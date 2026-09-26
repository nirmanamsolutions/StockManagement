const mongoose = require('mongoose');

const ledgerTransactionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    type: {
      type: String,
      enum: ['DUE', 'PAYMENT'], // DUE = added unpaid bill, PAYMENT = customer paid due
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than 0'],
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'OTHER', 'N/A'],
      default: 'N/A',
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      default: null,
    },
    billNumber: {
      type: String,
      default: '',
    },
    note: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// High Performance Query Index
ledgerTransactionSchema.index({ customerId: 1, date: -1 });

module.exports = mongoose.model('LedgerTransaction', ledgerTransactionSchema);
