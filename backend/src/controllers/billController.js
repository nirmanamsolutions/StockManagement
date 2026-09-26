const Bill = require('../models/Bill');
const Stock = require('../models/Stock');
const Customer = require('../models/Customer');
const LedgerTransaction = require('../models/LedgerTransaction');
const generateBillId = require('../utils/billNumberGenerator');

// @desc    Create a new bill & update stock / ledger
// @route   POST /api/bills
exports.createBill = async (req, res, next) => {
  try {
    const { customerName, customerPhone, items, paymentStatus, paymentType, amountPaid } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Bill must contain at least one item' });
    }

    let calculatedTotal = 0;
    const billItems = [];

    // Step 1: Verify & prepare stock items
    for (const item of items) {
      const stockItem = await Stock.findById(item.productId);
      if (!stockItem) {
        return res.status(404).json({
          success: false,
          message: `Product not found for ID: ${item.productId}`,
        });
      }

      const itemSellingPrice = item.sellingPrice !== undefined ? Number(item.sellingPrice) : stockItem.sellingPrice;
      const itemUnit = item.unit || stockItem.unit;
      const itemSubtotal = item.subtotal !== undefined ? Number(item.subtotal) : itemSellingPrice * Number(item.quantity);
      calculatedTotal += itemSubtotal;

      billItems.push({
        productId: stockItem._id,
        name: stockItem.name,
        quantity: Number(item.quantity),
        unit: itemUnit,
        sellingPrice: itemSellingPrice,
        subtotal: itemSubtotal,
      });
    }

    // Step 2: Deduct Stock
    for (const item of items) {
      await Stock.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -Number(item.quantity) },
      });
    }

    const billId = generateBillId();
    const isPaid = paymentStatus === 'PAID';
    const finalAmountPaid = isPaid ? calculatedTotal : Number(amountPaid || 0);
    const amountDue = calculatedTotal - finalAmountPaid;

    // Step 3: Create Bill Record
    const newBill = await Bill.create({
      billId,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      items: billItems,
      totalAmount: calculatedTotal,
      paymentStatus: isPaid ? 'PAID' : 'UNPAID',
      paymentType: isPaid ? paymentType || 'CASH' : 'KATHA',
      amountPaid: finalAmountPaid,
      amountDue: amountDue > 0 ? amountDue : 0,
      paidAt: isPaid ? new Date() : null,
    });

    // Step 4: If UNPAID or Partial Due, link to Customer Katha Ledger
    if (!isPaid || amountDue > 0) {
      if (!customerName || !customerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Customer Name and Phone are required for Unpaid (Katha) bills',
        });
      }

      let customer = await Customer.findOne({ phone: customerPhone.trim() });
      if (!customer) {
        customer = await Customer.create({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          totalDue: 0,
        });
      }

      // Add to Customer Total Due
      customer.totalDue += amountDue;
      await customer.save();

      // Log Ledger Transaction
      await LedgerTransaction.create({
        customerId: customer._id,
        type: 'DUE',
        amount: amountDue,
        billId: newBill._id,
        billNumber: billId,
        note: `Unpaid Bill #${billId}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Bill generated successfully',
      data: newBill,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bills
// @route   GET /api/bills
exports.getAllBills = async (req, res, next) => {
  try {
    const { status, search, date } = req.query;
    let query = {};

    if (status) {
      query.paymentStatus = status.toUpperCase();
    }
    if (search) {
      query.$or = [
        { billId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const bills = await Bill.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bill by ID
// @route   GET /api/bills/:id
exports.getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    next(error);
  }
};

// @desc    Manual trigger to clean up paid bills older than 30 days
// @route   DELETE /api/bills/cleanup-paid
exports.cleanupPaidBills = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await Bill.deleteMany({
      paymentStatus: 'PAID',
      paidAt: { $lt: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedCount} paid bills older than 30 days`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
