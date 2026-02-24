const cartService = require('./cart.service');

const getCart = async (req, res) => {
  try {
    console.log('GET /cart - User ID:', req.user.id, 'Email:', req.user.email);
    const cart = await cartService.getCart(req.user.id);
    console.log('Cart result for user:', req.user.id, 'Cart:', JSON.stringify(cart));
    res.json(cart || { items: [] });
  } catch (err) {
    console.error('Error getting cart:', err);
    res.status(500).json({ error: err.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { food_id, quantity } = req.body;

    if (!food_id) {
      return res.status(400).json({ error: 'food_id required' });
    }

    const result = await cartService.addToCart(req.user.id, food_id, quantity || 1);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (quantity === undefined) {
      return res.status(400).json({ error: 'quantity required' });
    }

    const result = await cartService.updateCartItem(req.user.id, itemId, quantity);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const result = await cartService.clearCart(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, clearCart };
