const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
    },
    unit: {
      type: String,
      required: [true, 'Quantity unit (e.g. kg, g, unit, liter) is required'],
      trim: true,
      default: 'unit',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    minStockAlert: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

// High Performance Query Indexes
stockSchema.index({ name: 'text' });
stockSchema.index({ category: 1 });
stockSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Stock', stockSchema);
