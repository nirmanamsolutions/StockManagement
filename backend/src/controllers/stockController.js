const Stock = require('../models/Stock');

// @desc    Get all stock items
// @route   GET /api/stock
exports.getAllStock = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const stockItems = await Stock.find(query).sort({ updatedAt: -1 }).lean();
    res.status(200).json({
      success: true,
      count: stockItems.length,
      data: stockItems,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single stock item
// @route   GET /api/stock/:id
exports.getStockById = async (req, res, next) => {
  try {
    const stockItem = await Stock.findById(req.params.id);
    if (!stockItem) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }
    res.status(200).json({ success: true, data: stockItem });
  } catch (error) {
    next(error);
  }
};

const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

// @desc    Add new stock item
// @route   POST /api/stock
exports.addStock = async (req, res, next) => {
  try {
    const { name, costPrice, sellingPrice, quantity, unit, minStockAlert } = req.body;

    if (!name || costPrice === undefined || sellingPrice === undefined || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, costPrice, sellingPrice, quantity)',
      });
    }

    const newStock = await Stock.create({
      name,
      costPrice: round2(costPrice),
      sellingPrice: round2(sellingPrice),
      quantity: round2(quantity),
      unit: unit || 'unit',
      minStockAlert: minStockAlert ? round2(minStockAlert) : 5,
    });

    res.status(201).json({
      success: true,
      message: 'Stock item added successfully',
      data: newStock,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stock item
// @route   PUT /api/stock/:id
exports.updateStock = async (req, res, next) => {
  try {
    const { name, costPrice, sellingPrice, quantity, unit, minStockAlert } = req.body;

    let stockItem = await Stock.findById(req.params.id);
    if (!stockItem) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }

    stockItem.name = name !== undefined ? name : stockItem.name;
    stockItem.costPrice = costPrice !== undefined ? round2(costPrice) : stockItem.costPrice;
    stockItem.sellingPrice = sellingPrice !== undefined ? round2(sellingPrice) : stockItem.sellingPrice;
    stockItem.quantity = quantity !== undefined ? round2(quantity) : stockItem.quantity;
    stockItem.unit = unit !== undefined ? unit : stockItem.unit;
    stockItem.minStockAlert = minStockAlert !== undefined ? round2(minStockAlert) : stockItem.minStockAlert;

    await stockItem.save();

    res.status(200).json({
      success: true,
      message: 'Stock item updated successfully',
      data: stockItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete stock item
// @route   DELETE /api/stock/:id
exports.deleteStock = async (req, res, next) => {
  try {
    const stockItem = await Stock.findById(req.params.id);
    if (!stockItem) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }

    await stockItem.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Stock item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock list report for PDF generation (Name, Available Stock + Unit, Selling Price)
// @route   GET /api/stock/pdf-report
exports.getPdfStockList = async (req, res, next) => {
  try {
    const stockItems = await Stock.find().select('name quantity unit sellingPrice').sort({ name: 1 });

    const formattedList = stockItems.map((item) => ({
      id: item._id,
      name: item.name,
      stockAvailable: `${item.quantity} ${item.unit}`,
      quantity: item.quantity,
      unit: item.unit,
      sellingPrice: item.sellingPrice,
    }));

    res.status(200).json({
      success: true,
      generatedAt: new Date(),
      count: formattedList.length,
      data: formattedList,
    });
  } catch (error) {
    next(error);
  }
};
