const express = require('express');
const router = express.Router();
const hotelController = require('./hotel.controller');

router.get('/', hotelController.getAllHotels);
router.get('/:id', hotelController.getHotelById);

module.exports = router;
