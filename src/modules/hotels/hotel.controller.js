const hotelService = require('./hotel.service');

const getAllHotels = async (req, res) => {
  try {
    const hotels = await hotelService.getAllHotels();
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getHotelById = async (req, res) => {
  try {
    const hotel = await hotelService.getHotelById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllHotels, getHotelById };
