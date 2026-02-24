import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWalletBalance, getTransactions } from '../services/api';
import './WalletPage.css';

const WalletPage = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceRes, transRes] = await Promise.all([
        getWalletBalance(),
        getTransactions()
      ]);
      setBalance(balanceRes.data.wallet_balance || 0);
      setTransactions(transRes.data || []);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    }
    setLoading(false);
  };

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1>Wallet</h1>
      </div>

      <div className="balance-card">
        <span className="balance-label">Available Balance</span>
        <span className="balance-amount">₹{Number(balance).toFixed(2)}</span>
      </div>

      <div className="transactions-section">
        <h2>Transaction History</h2>
        {loading ? (
          <p className="loading">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="no-transactions">No transactions yet</p>
        ) : (
          <div className="transactions-list">
            {transactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div className="tx-info">
                  <span className="tx-icon">💰</span>
                  <div>
                    <h4>Delivery Earning</h4>
                    <p>{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="tx-amount">+₹{Number(tx.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
