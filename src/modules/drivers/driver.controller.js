const driverService = require('./driver.service');

const goOnline = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location required' });
    }

    const result = await driverService.goOnline(req.user.id, lat, lng);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const goOffline = async (req, res) => {
  try {
    const result = await driverService.goOffline(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location required' });
    }

    const result = await driverService.updateLocation(req.user.id, lat, lng);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const acceptOrder = async (req, res) => {
  try {
    const order = await driverService.handleAcceptOrder(req.user.id, req.params.id);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const pickupOrder = async (req, res) => {
  try {
    const order = await driverService.handlePickup(req.user.id, req.params.id);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const startDelivery = async (req, res) => {
  try {
    const order = await driverService.startDelivery(req.user.id, req.params.id);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const completeOrder = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP required' });
    }

    const result = await driverService.completeOrder(req.user.id, req.params.id, otp);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getCurrentOrder = async (req, res) => {
  try {
    const order = await driverService.getCurrentOrder(req.user.id);
    res.json(order || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await driverService.getDriverStats(req.user.id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  goOnline,
  goOffline,
  updateLocation,
  acceptOrder,
  pickupOrder,
  startDelivery,
  completeOrder,
  getCurrentOrder,
  getStats
};
