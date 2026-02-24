const express = require('express');
const router = express.Router();
const foodController = require('./food.controller');

router.get('/', foodController.getAllFoods);
router.get('/hotel/:hotelId', foodController.getFoodsByHotel);
router.get('/:id', foodController.getFoodById);

module.exports = router;
