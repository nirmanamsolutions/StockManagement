const express = require('express');
const router = express.Router();
const { login, updateCredentials, getMe } = require('../controllers/authController');

router.post('/login', login);
router.put('/update-credentials', updateCredentials);
router.get('/me', getMe);

module.exports = router;
