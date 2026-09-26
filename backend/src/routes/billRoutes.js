const express = require('express');
const router = express.Router();
const {
  createBill,
  getAllBills,
  getBillById,
  cleanupPaidBills,
} = require('../controllers/billController');

router.delete('/cleanup-paid', cleanupPaidBills);
router.route('/').get(getAllBills).post(createBill);
router.route('/:id').get(getBillById);

module.exports = router;
