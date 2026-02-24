const express = require('express');
const router = express.Router();
const walletController = require('./wallet.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('driver'));

router.get('/balance', walletController.getBalance);
router.get('/transactions', walletController.getTransactions);

module.exports = router;
