const express = require('express');
const router = express.Router();
const {
  getAllStock,
  getStockById,
  addStock,
  updateStock,
  deleteStock,
  getPdfStockList,
} = require('../controllers/stockController');

router.get('/pdf-report', getPdfStockList);
router.route('/').get(getAllStock).post(addStock);
router.route('/:id').get(getStockById).put(updateStock).delete(deleteStock);

module.exports = router;
