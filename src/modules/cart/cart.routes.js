const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('user'));

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/item/:itemId', cartController.updateCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
