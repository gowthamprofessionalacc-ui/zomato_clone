const express = require('express');
const router = express.Router();
const driverController = require('./driver.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('driver'));

router.post('/go-online', driverController.goOnline);
router.post('/go-offline', driverController.goOffline);
router.post('/location', driverController.updateLocation);
router.get('/current-order', driverController.getCurrentOrder);
router.get('/stats', driverController.getStats);

router.post('/order/:id/accept', driverController.acceptOrder);
router.post('/order/:id/pickup', driverController.pickupOrder);
router.post('/order/:id/start-delivery', driverController.startDelivery);
router.post('/order/:id/complete', driverController.completeOrder);

module.exports = router;
