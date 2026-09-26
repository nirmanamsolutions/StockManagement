/**
 * Generates a unique Bill ID format: BILL-YYYYMMDD-XXXX
 */
const generateBillId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `BILL-${dateStr}-${randomSuffix}`;
};

module.exports = generateBillId;
