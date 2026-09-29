/**
 * Generates a unique 6-character Bill ID format: 3 Alphabets + 3 Digits (e.g. DVS101, DVS542)
 */
const generateBillId = () => {
  const prefix = 'DVS'; // 3 Alphabets for Shivratna Kirana
  const number = Math.floor(100 + Math.random() * 900); // 3 Digits (100-999)
  return `${prefix}${number}`;
};

module.exports = generateBillId;
