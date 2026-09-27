const Customer = require('../models/Customer');
const LedgerTransaction = require('../models/LedgerTransaction');
const generateWhatsAppLink = require('../utils/whatsapp');
const runAutoCleanup = require('../utils/autoCleanup');

// @desc    Get all ledger customers or search by name/phone
// @route   GET /api/ledger/customers
exports.getCustomers = async (req, res, next) => {
  try {
    await runAutoCleanup();
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query).sort({ totalDue: -1, updatedAt: -1 }).lean();
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new customer for Katha
// @route   POST /api/ledger/customers
exports.addCustomer = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and Phone number are required' });
    }

    const existingCustomer = await Customer.findOne({ phone: phone.trim() }).lean();
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists',
        data: existingCustomer,
      });
    }

    const newCustomer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      totalDue: 0,
      zeroDueSince: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Customer added to ledger successfully',
      data: newCustomer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific customer due history & total due
// @route   GET /api/ledger/history/:customerId
exports.getCustomerDetails = async (req, res, next) => {
  try {
    await runAutoCleanup();
    const customer = await Customer.findById(req.params.customerId).lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const history = await LedgerTransaction.find({ customerId: customer._id })
      .populate('billId')
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        customer,
        totalDue: customer.totalDue,
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record customer payment towards due balance
// @route   POST /api/ledger/pay
exports.recordPayment = async (req, res, next) => {
  try {
    const { customerId, amount, paymentMethod, note } = req.body;

    if (!customerId || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid customerId and positive payment amount are required',
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;
    const payAmount = round2(amount);
    const currentDue = round2(customer.totalDue);

    if (payAmount > currentDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${payAmount.toFixed(2)}) cannot exceed customer total due balance of ₹${currentDue.toFixed(2)}`,
      });
    }

    // Subtract from total due (cannot go below 0)
    customer.totalDue = round2(Math.max(0, currentDue - payAmount));
    if (customer.totalDue === 0) {
      customer.zeroDueSince = new Date();
    } else {
      customer.zeroDueSince = null;
    }
    await customer.save();

    // Log transaction
    const transaction = await LedgerTransaction.create({
      customerId: customer._id,
      type: 'PAYMENT',
      amount: payAmount,
      paymentMethod: paymentMethod || 'CASH',
      note: note || `Payment received via ${paymentMethod || 'CASH'}`,
      date: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `Payment of ₹${payAmount} recorded. Remaining due: ₹${customer.totalDue}`,
      data: {
        customer,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Marathi WhatsApp reminder details for customer due
// @route   GET /api/ledger/whatsapp/:customerId
exports.getWhatsAppReminder = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const storeName = req.query.storeName || 'आमचे दुकान';
    const linkInfo = generateWhatsAppLink(customer.phone, customer.name, customer.totalDue, storeName);

    res.status(200).json({
      success: true,
      data: linkInfo,
    });
  } catch (error) {
    next(error);
  }
};
