const express = require('express');
const router = express.Router();
const {
  getCustomers,
  addCustomer,
  getCustomerDetails,
  recordPayment,
  addDueAmount,
  getWhatsAppReminder,
} = require('../controllers/ledgerController');

router.route('/customers').get(getCustomers).post(addCustomer);
router.get('/history/:customerId', getCustomerDetails);
router.post('/pay', recordPayment);
router.post('/add-due', addDueAmount);
router.get('/whatsapp/:customerId', getWhatsAppReminder);

module.exports = router;
