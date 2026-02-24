const walletService = require('./wallet.service');

const getBalance = async (req, res) => {
  try {
    const balance = await walletService.getWalletBalance(req.user.id);
    res.json(balance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await walletService.getTransactions(req.user.id);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getBalance, getTransactions };
