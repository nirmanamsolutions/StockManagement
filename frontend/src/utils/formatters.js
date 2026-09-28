// Utility helpers for formatting quantities, currency amounts, phone numbers, and enforcing strict input rules

export const isIntegerUnit = (unit) => {
  if (!unit) return true;
  const norm = String(unit).trim().toLowerCase();
  return (
    norm === 'unit' ||
    norm === 'pcs' ||
    norm === 'pkt' ||
    norm === 'packet' ||
    norm === 'box' ||
    norm === 'piece' ||
    norm === 'pieces' ||
    norm === 'item' ||
    norm === 'items'
  );
};

export const formatQuantity = (quantity, unit) => {
  const num = Number(quantity || 0);
  if (isIntegerUnit(unit)) {
    return Math.round(num).toString();
  }
  if (num % 1 === 0) {
    return num.toString();
  }
  return num.toFixed(2);
};

export const formatAmount = (amount) => {
  const num = Number(amount || 0);
  if (isNaN(num)) return '0';
  // Round to 2 decimal places first to avoid floating point inaccuracies (e.g. 32.000000000000004), then round up to next whole number (e.g. 17.1 to 17.9 -> 18, 32.1 to 32.9 -> 33)
  const fixedNum = Math.round(num * 100) / 100;
  const rounded = Math.ceil(fixedNum);
  return rounded.toString();
};

// Input sanitizer for decimal values (max 2 decimal places allowed)
export const sanitizeDecimalInput = (val) => {
  if (val === undefined || val === null || val === '') return '';
  let str = String(val).replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  if (str.includes('.')) {
    const [intPart, decPart] = str.split('.');
    return `${intPart}.${decPart.slice(0, 2)}`;
  }
  return str;
};

// Input sanitizer for integer-only values (no decimal allowed)
export const sanitizeIntegerInput = (val) => {
  if (val === undefined || val === null || val === '') return '';
  return String(val).replace(/\D/g, '');
};

// Input sanitizer for Indian 10-digit phone numbers (digits only, max 10 chars)
export const sanitizePhoneInput = (val) => {
  if (val === undefined || val === null || val === '') return '';
  return String(val).replace(/\D/g, '').slice(0, 10);
};

// Strict check for valid 10-digit mobile phone number
export const isValidPhone = (val) => {
  if (!val) return false;
  return /^\d{10}$/.test(String(val).trim());
};

// Pretty print 10-digit phone number (e.g. "98765 43210")
export const formatPhone = (val) => {
  if (!val) return '';
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return digits;
};

// Formats JS dates into readable Indian store format (e.g. 27/09/2026)
export const formatDateShort = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB');
};
