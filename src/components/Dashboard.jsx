import React, { useState, useEffect } from 'react';
import TransactionReceipt from './TransactionReceipt';
import dbService from '../services/DatabaseService';
import '../styles/Dashboard.css';

function Dashboard({ userData, setIsAuthenticated }) {
  const [balance, setBalance] = useState(userData?.balance || 0);
  const [transactions, setTransactions] = useState(userData?.transactions || []);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState(300);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [quickAmounts, setQuickAmounts] = useState({
    withdraw: [100, 200, 500, 2000, 5000]
  });

  useEffect(() => {
    if (sessionTimeout <= 0) {
      handleLogout();
      return;
    }

    const timer = setTimeout(() => {
      setSessionTimeout(sessionTimeout - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [sessionTimeout]);

  const resetTimeout = () => {
    setSessionTimeout(300);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {  
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleWithdraw = async () => {
    try {
      resetTimeout();
      
      if (!amount || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const withdrawAmount = parseFloat(amount);
      
      if (withdrawAmount > balance) {
        setError('Insufficient funds');
        return;
      }
      
      const result = dbService.processWithdrawal(userData.cardNumber, withdrawAmount);
      
      if (result.success) {
        setBalance(result.newBalance);
        setTransactions([result.transaction, ...transactions]);
        setCurrentTransaction(result.transaction);
        setShowReceipt(true);
        
        setAmount('');
        setSuccess(`Successfully withdrew ${formatCurrency(withdrawAmount)}`);
        setCurrentView('dashboard');
      } else {
        setError(result.message || 'Withdrawal failed. Please try again.');
      }
    } catch (err) {
      setError('Failed to process withdrawal. Please try again.');
      console.error(err);
    }
  };

  const changeView = (view) => {
    resetTimeout();
    setCurrentView(view);
    setError('');
    setSuccess('');
    setAmount('');
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setCurrentTransaction(null);
  };

  const handleViewReceipt = (transaction) => {
    setCurrentTransaction(transaction);
    setShowReceipt(true);
    resetTimeout();
  };

  return (
    <div className="dashboard-container atm-theme" onClick={resetTimeout}>
      <div className="dashboard-header">
        <h1>Welcome, {userData.name}</h1>
        <button className="logout-btn" onClick={handleLogout}>Exit</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="dashboard-content">
        {currentView === 'dashboard' && (
          <div className="main-dashboard">
            <div className="balance-section">
              <h2>Available Balance</h2>
              <div className="balance-amount">
                {formatCurrency(balance)}
              </div>
              <div className="account-info">
                <div>Account: {userData && userData.accountType ? 
                `${userData.accountType.charAt(0).toUpperCase()}${userData.accountType.slice(1)}` : 
                'Checking'}</div>
                <div>Account Number: {userData?.accountNumber || 'N/A'}</div>
                <div>Card Number: {userData?.cardNumber ? `XXXX XXXX XXXX ${userData.cardNumber.slice(-4)}` : 'N/A'}</div>
              </div>
            </div>
            
            <div className="actions-section">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button className="action-btn withdraw" onClick={() => changeView('withdraw')}>
                  <span className="icon">💸</span>
                  Withdraw Cash
                </button>
                {}
                <button className="action-btn history" onClick={() => changeView('history')}>
                  <span className="icon">📝</span>
                  Transaction History
                </button>
              </div>
            </div>
            
            <div className="transactions-section">
              <h2>Recent Transactions</h2>
              {transactions.length > 0 ? (
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Transaction ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => (
                      <tr key={index}>
                        <td>{formatDate(transaction.date)}</td>
                        <td>{transaction.type}</td>
                        <td className={transaction.type === 'Withdrawal' ? 'withdraw-amount' : 'deposit-amount'}>
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td>{transaction.transactionId}</td>
                        <td>
                          <button 
                            className="receipt-btn" 
                            onClick={() => handleViewReceipt(transaction)}
                          >
                            Print Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-transactions">No recent transactions</p>
              )}
            </div>
          </div>
        )}

        {currentView === 'withdraw' && (
          <div className="transaction-form">
            <h2>Cash Withdrawal</h2>
            <div className="form-group">
              <label>Amount to Withdraw</label>
              <div className="amount-input">
                {}
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                />
              </div>
            </div>
            
            <div className="quick-amounts withdraw-quick">
              <span className="quick-amounts-title">Quick Amounts:</span>
              <div className="quick-amount-buttons">
                {quickAmounts.withdraw.map((value) => (
                  <button
                    key={value}
                    className={`quick-amount-btn ${amount === value.toString() ? 'active' : ''}`}
                    onClick={() => handleQuickAmount(value)}
                    disabled={value > balance}
                  >
                    ₹{value}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="available-balance">
              Available Balance: <span className="balance-value">{formatCurrency(balance)}</span>
            </div>
            
            <div className="form-actions">
              <button 
                className="cancel-btn" 
                onClick={() => changeView('dashboard')}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleWithdraw}
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              >
                Withdraw
              </button>
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="transaction-history-full">
            <h2>Transaction History</h2>
            {transactions.length > 0 ? (
              <table className="transactions-table full-history">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Transaction ID</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={index}>
                      <td>{formatDate(transaction.date)}</td>
                      <td>{transaction.type}</td>
                      <td className={transaction.type === 'Withdrawal' ? 'withdraw-amount' : 'deposit-amount'}>
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td>{transaction.transactionId}</td>
                      <td>{transaction.status}</td>
                      <td>
                        <button 
                          className="receipt-btn" 
                          onClick={() => handleViewReceipt(transaction)}
                        >
                          Print Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-transactions">No transaction history found</p>
            )}
            
            <div className="back-button-container">
              <button className="back-btn" onClick={() => changeView('dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="session-timer">
        Session: {Math.floor(sessionTimeout / 60)}:{(sessionTimeout % 60).toString().padStart(2, '0')}
      </div>

      {showReceipt && currentTransaction && (
        <TransactionReceipt
          transaction={currentTransaction}
          userData={{...userData, balance: balance}}
          onClose={handleCloseReceipt}
          onPrint={() => {
            dbService.logReceiptPrint(currentTransaction.transactionId);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;