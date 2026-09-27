const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const LedgerTransaction = require('../models/LedgerTransaction');

/**
 * Automatic 1-Month Retention & Cleanup Utility
 * 1. Automatically deletes bills older than 30 days.
 * 2. Automatically deletes paid history / ledger transactions older than 30 days.
 * 3. Automatically deletes Khata customers whose remaining balance has been 0 for over 1 month (30 days).
 */
const runAutoCleanup = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Delete bills older than 30 days
    const billCleanupResult = await Bill.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
    });

    // 2. Delete paid history & ledger transactions older than 30 days
    const ledgerTxCleanupResult = await LedgerTransaction.deleteMany({
      $or: [
        { date: { $lt: thirtyDaysAgo } },
        { createdAt: { $lt: thirtyDaysAgo } }
      ]
    });

    // 3. Delete Khata customers whose amount remains 0 for 1 month (30 days)
    const zeroDueCustomers = await Customer.find({
      totalDue: 0,
      $or: [
        { zeroDueSince: { $lt: thirtyDaysAgo } },
        { zeroDueSince: { $exists: false }, updatedAt: { $lt: thirtyDaysAgo } }
      ]
    }).lean();

    if (zeroDueCustomers.length > 0) {
      const customerIds = zeroDueCustomers.map((c) => c._id);
      await LedgerTransaction.deleteMany({ customerId: { $in: customerIds } });
      const customerCleanupResult = await Customer.deleteMany({ _id: { $in: customerIds } });
      console.log(`[Auto Cleanup] Deleted ${customerCleanupResult.deletedCount} zero-balance customers older than 30 days.`);
    }

    if (billCleanupResult.deletedCount > 0 || ledgerTxCleanupResult.deletedCount > 0) {
      console.log(`[Auto Cleanup] Deleted ${billCleanupResult.deletedCount} bills and ${ledgerTxCleanupResult.deletedCount} ledger transactions older than 30 days.`);
    }
  } catch (error) {
    console.error('[Auto Cleanup Error]', error.message);
  }
};

module.exports = runAutoCleanup;
