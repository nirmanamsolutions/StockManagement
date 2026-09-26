const express = require('express');
const router = express.Router();
const {
  getCustomers,
  addCustomer,
  getCustomerDetails,
  recordPayment,
  getWhatsAppReminder,
} = require('../controllers/ledgerController');

router.route('/customers').get(getCustomers).post(addCustomer);
router.get('/history/:customerId', getCustomerDetails);
router.post('/pay', recordPayment);
router.get('/whatsapp/:customerId', getWhatsAppReminder);

module.exports = router;
