const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true,
      unique: true,
    },
    totalDue: {
      type: Number,
      default: 0,
      min: [0, 'Total due cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Search index for customer name and phone
customerSchema.index({ name: 'text', phone: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
