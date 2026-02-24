const orderService = require('./order.service');
const supabase = require('../../config/db');

const createOrder = async (req, res) => {
  try {
    const { delivery_lat, delivery_lng, coupon_code } = req.body;

    if (!delivery_lat || !delivery_lng) {
      return res.status(400).json({ error: 'Delivery location required' });
    }

    const order = await orderService.createOrder(
      req.user.id,
      delivery_lat,
      delivery_lng,
      coupon_code
    );

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await orderService.getUserOrders(req.user.id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getActiveOrder = async (req, res) => {
  try {
    const { data: activeOrders } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        hotel:hotels(id, name),
        created_at
      `)
      .eq('user_id', req.user.id)
      .not('status', 'in', '("delivered","cancelled")')
      .order('created_at', { ascending: false })
      .limit(1);

    const activeOrder = activeOrders && activeOrders.length > 0 ? activeOrders[0] : null;
    res.json({ activeOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user.id);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { createOrder, getOrder, getUserOrders, getActiveOrder, cancelOrder };
