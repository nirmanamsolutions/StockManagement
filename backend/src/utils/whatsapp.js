/**
 * Generates a WhatsApp Web / App shareable direct message link formatted in Marathi.
 * @param {string} phone Customer phone number
 * @param {string} customerName Customer name
 * @param {number} totalDue Amount due in INR
 * @param {string} storeName Store name (optional)
 * @returns {object} { phone, message, whatsappUrl }
 */
const generateWhatsAppLink = (phone, customerName, totalDue, storeName = 'आमचे दुकान') => {
  // Clean phone number (ensure country code +91 for India if not specified)
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const message = `नमस्कार ${customerName} जी,\n\n${storeName} मध्ये तुमची एकूण उधारी (Pending Due): ₹${totalDue} बाकी आहे.\nकृपया लवकरात लवकर भरणा करावा.\n\nधन्यवाद! 🙏`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  return {
    phone: cleanPhone,
    message,
    whatsappUrl,
  };
};

module.exports = generateWhatsAppLink;
