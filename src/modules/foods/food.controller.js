const foodService = require('./food.service');

const getAllFoods = async (req, res) => {
  try {
    const filters = {
      hotel_id: req.query.hotel_id,
      is_veg: req.query.is_veg === 'true' ? true : undefined,
      search: req.query.search
    };

    const foods = await foodService.getAllFoods(filters);
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFoodById = async (req, res) => {
  try {
    const food = await foodService.getFoodById(req.params.id);
    if (!food) {
      return res.status(404).json({ error: 'Food not found' });
    }
    res.json(food);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFoodsByHotel = async (req, res) => {
  try {
    const foods = await foodService.getFoodsByHotel(req.params.hotelId);
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllFoods, getFoodById, getFoodsByHotel };
