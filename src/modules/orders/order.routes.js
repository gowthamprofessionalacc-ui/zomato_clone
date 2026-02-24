const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('user'));

router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/active', orderController.getActiveOrder);
router.get('/:id', orderController.getOrder);
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;
