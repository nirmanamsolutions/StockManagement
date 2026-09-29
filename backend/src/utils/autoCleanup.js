/**
 * Permanent Data Retention Policy
 * All bills, transactions, and Khata customer records are preserved permanently.
 * Automatic deletion logic is completely disabled.
 */
const runAutoCleanup = async () => {
  // Permanent data preservation enabled - no records are deleted
  return;
};

module.exports = runAutoCleanup;
