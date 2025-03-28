import React, { useState, useEffect } from 'react';
import dbService from '../services/DatabaseService';
import '../styles/AdminDashboard.css';

function AdminDashboard({ adminData = {}, setIsAdminAuthenticated }) {
  const [currentView, setCurrentView] = useState('overview');
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    accountNumber: '',
    cardNumber: '',
    pin: '',
    initialBalance: '0',
    accountType: 'checking'
  });
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState(600);
  const [exportData, setExportData] = useState('');

  useEffect(() => {
    fetchDatabaseData();
  }, []);

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

  const fetchDatabaseData = () => {
    try {
      const allUsers = dbService.getAllUsers();
      const allTransactions = dbService.getAllTransactions();
      const systemStats = dbService.getSystemStats();
      
      setUsers(allUsers);
      setTransactions(allTransactions);
      setStats(systemStats);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load database data. Please try again.");
    }
  };

  const resetTimeout = () => {
    setSessionTimeout(600); 
  };

  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
  };

  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  
  const changeView = (view) => {
    resetTimeout();
    setCurrentView(view);
    setError('');
    setSuccess('');
  };

  
  const handleLogout = () => {
    setIsAdminAuthenticated(false);
  };

  
  const filteredUsers = searchTerm
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.accountNumber.includes(searchTerm) ||
        user.cardNumber.includes(searchTerm)
      )
    : users;

  
  const filteredTransactions = transactionSearchTerm
    ? transactions.filter(tx => 
        (tx.userName && tx.userName.toLowerCase().includes(transactionSearchTerm.toLowerCase())) ||
        (tx.accountNumber && tx.accountNumber.includes(transactionSearchTerm)) ||
        (tx.transactionId && tx.transactionId.includes(transactionSearchTerm)) ||
        (tx.type && tx.type.toLowerCase().includes(transactionSearchTerm.toLowerCase()))
      )
    : transactions;

  
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  
  const handleEditUserChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({ ...prev, [name]: value }));
  };

  
  const viewUserDetails = (user) => {
    resetTimeout();
    
    
    const userTransactions = dbService.getUserTransactions(user.id);
    
    setSelectedUser({
      ...user,
      transactions: userTransactions
    });
    
    setCurrentView('user-details');
  };

  
  const startEditingUser = (user) => {
    resetTimeout();
    setEditingUser({
      ...user,
      initialBalance: user.balance.toString()
    });
    setCurrentView('edit-user');
  };

  
  const viewTransactionDetails = (transaction) => {
    resetTimeout();
    setSelectedTransaction(transaction);
    setCurrentView('transaction-details');
  };

  
  const handleAddUser = (e) => {
    e.preventDefault();
    resetTimeout();
    
    try {
      
      const formattedCardNumber = newUser.cardNumber.replace(/\s/g, '');
      
      if (formattedCardNumber.length !== 16 || !/^\d{16}$/.test(formattedCardNumber)) {
        setError('Card number must be exactly 16 digits.');
        return;
      }
      
      if (newUser.pin.length !== 4 || !/^\d{4}$/.test(newUser.pin)) {
        setError('PIN must be exactly 4 digits.');
        return;
      }
      
      const existingUser = users.find(user => user.cardNumber === formattedCardNumber);
      if (existingUser) {
        setError('A user with this card number already exists.');
        return;
      }
      
      const newUserId = `user_${Date.now()}`;
      const userToAdd = {
        id: newUserId,
        name: newUser.name,
        accountNumber: newUser.accountNumber,
        cardNumber: formattedCardNumber,
        pin: newUser.pin,
        balance: parseFloat(newUser.initialBalance) || 0,
        accountType: newUser.accountType,
        createdAt: new Date().toISOString()
      };
      
      const result = dbService.addNewUser(userToAdd);
      
      if (result.success) {
        
        setNewUser({
          name: '',
          accountNumber: '',
          cardNumber: '',
          pin: '',
          initialBalance: '0',
          accountType: 'checking'
        });
        
        setSuccess(`User ${result.user.name} created successfully!`);
        fetchDatabaseData(); 
        changeView('users');
      } else {
        setError(result.message || 'Failed to create user.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while creating the user.');
    }
  };

  
  const handleSaveUser = (e) => {
    e.preventDefault();
    resetTimeout();
    
    try {
      
      const isValidCard = dbService.validateCardNumber(editingUser.cardNumber);
      if (!isValidCard) {
        setError('Invalid card number. Please check and try again.');
        return;
      }
      
      
      if (editingUser.pin.length !== 4 || !/^\d{4}$/.test(editingUser.pin)) {
        setError('PIN must be exactly 4 digits.');
        return;
      }
      
      
      const existingUser = dbService.getUserByCard(editingUser.cardNumber);
      if (existingUser && existingUser.id !== editingUser.id) {
        setError('Another user with this card number already exists.');
        return;
      }
      
      
      const result = dbService.updateUser(editingUser.id, {
        name: editingUser.name,
        accountNumber: editingUser.accountNumber,
        cardNumber: editingUser.cardNumber,
        pin: editingUser.pin,
        balance: parseFloat(editingUser.initialBalance) || 0,
        accountType: editingUser.accountType
      });
      
      if (result.success) {
        
        setSuccess(`User ${result.user.name} updated successfully!`);
        fetchDatabaseData();
        changeView('users');
      } else {
        setError(result.message || 'Failed to update user.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while updating the user.');
    }
  };

  
  const handleDeleteUser = (userId) => {
    resetTimeout();
    
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const result = dbService.deleteUser(userId);
        
        if (result.success) {
          
          setSuccess(`User ${result.user.name} deleted successfully!`);
          fetchDatabaseData();
          
          
          if (currentView === 'user-details' || currentView === 'edit-user') {
            changeView('users');
          }
        } else {
          setError(result.message || 'Failed to delete user.');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while deleting the user.');
      }
    }
  };

  
  const handleExportDatabase = () => {
    resetTimeout();
    
    try {
      const dbData = dbService.exportDatabase();
      setExportData(JSON.stringify(dbData, null, 2));
      
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "atm_database_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (err) {
      console.error(err);
      setError('An error occurred while exporting the database.');
    }
  };

  return (
    <div className="admin-dashboard-container" onClick={resetTimeout}>
      <div className="admin-dashboard-header">
        <div className="admin-title">
          <h1>ATM System Administration</h1>
          <div className="admin-subtitle">
            Logged in as: <span>{adminData?.username || 'Admin'}</span> | Role: <span>{adminData?.role || 'Administrator'}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="admin-dashboard-main">
        <div className="admin-sidebar">
          <div className="admin-menu">
            <button 
              className={`menu-item ${currentView === 'overview' ? 'active' : ''}`} 
              onClick={() => changeView('overview')}
            >
              Dashboard Overview
            </button>
            <button 
              className={`menu-item ${currentView === 'users' ? 'active' : ''}`} 
              onClick={() => changeView('users')}
            >
              Manage Users
            </button>
            <button 
              className={`menu-item ${currentView === 'add-user' ? 'active' : ''}`} 
              onClick={() => changeView('add-user')}
            >
              Add New User
            </button>
            <button 
              className={`menu-item ${currentView === 'transactions' ? 'active' : ''}`} 
              onClick={() => changeView('transactions')}
            >
              View Transactions
            </button>
            <button 
              className={`menu-item ${currentView === 'export' ? 'active' : ''}`} 
              onClick={() => changeView('export')}
            >
              Export Database
            </button>
          </div>
        </div>
        
        <div className="admin-content">
          {currentView === 'overview' && stats && (
            <div className="overview-section">
              <h2>System Overview</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalTransactions}</div>
                  <div className="stat-label">Total Transactions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{formatCurrency(stats.totalDeposits)}</div>
                  <div className="stat-label">Total Deposits</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{formatCurrency(stats.totalWithdrawals)}</div>
                  <div className="stat-label">Total Withdrawals</div>
                </div>
              </div>
              
              <div className="recent-activity">
                <h3>Recent Transactions</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map((tx, index) => (
                      <tr key={index} onClick={() => viewTransactionDetails(tx)}>
                        <td>{formatDate(tx.date)}</td>
                        <td>{tx.userName || 'N/A'}</td>
                        <td>{tx.type}</td>
                        <td>{formatCurrency(tx.amount)}</td>
                        <td>{tx.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {currentView === 'users' && (
            <div className="users-section">
              <h2>Manage Users</h2>
              
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search users by name, account or card number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Account #</th>
                    <th>Card # (Last 4)</th>
                    <th>Account Type</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.accountNumber}</td>
                      <td>XXXX XXXX XXXX {user.cardNumber.slice(-4)}</td>
                      <td>{user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1)}</td>
                      <td>{formatCurrency(user.balance)}</td>
                      <td className="action-buttons">
                        <button 
                          className="action-btn view" 
                          onClick={() => viewUserDetails(user)}
                        >
                          View
                        </button>
                        <button 
                          className="action-btn edit" 
                          onClick={() => startEditingUser(user)}
                        >
                          Edit
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <p className="no-results">No users found matching your search criteria.</p>
              )}
            </div>
          )}
          
          {currentView === 'add-user' && (
            <div className="add-user-section">
              <h2>Add New User</h2>
              
              <form onSubmit={handleAddUser} className="admin-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleNewUserChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={newUser.accountNumber}
                    onChange={handleNewUserChange}
                    placeholder="Enter account number"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Card Number (16 digits)</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={newUser.cardNumber}
                    onChange={handleNewUserChange}
                    placeholder="Enter 16-digit card number"
                    maxLength="16"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>PIN (4 digits)</label>
                  <input
                    type="password"
                    name="pin"
                    value={newUser.pin}
                    onChange={handleNewUserChange}
                    placeholder="Enter 4-digit PIN"
                    maxLength="4"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Initial Balance</label>
                  <div className="amount-input">
                    {}
                    <input
                      type="number"
                      name="initialBalance"
                      value={newUser.initialBalance}
                      onChange={handleNewUserChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Account Type</label>
                  <select
                    name="accountType"
                    value={newUser.accountType}
                    onChange={handleNewUserChange}
                    required
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => changeView('users')}>Cancel</button>
                  <button type="submit" className="submit-btn">Add User</button>
                </div>
              </form>
            </div>
          )}

          {currentView === 'edit-user' && editingUser && (
            <div className="edit-user-section">
              <h2>Edit User</h2>
              
              <form onSubmit={handleSaveUser} className="admin-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editingUser.name}
                    onChange={handleEditUserChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={editingUser.accountNumber}
                    onChange={handleEditUserChange}
                    placeholder="Enter account number"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Card Number (16 digits)</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={editingUser.cardNumber}
                    onChange={handleEditUserChange}
                    placeholder="Enter 16-digit card number"
                    maxLength="16"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>PIN (4 digits)</label>
                  <input
                    type="password"
                    name="pin"
                    value={editingUser.pin}
                    onChange={handleEditUserChange}
                    placeholder="Enter 4-digit PIN"
                    maxLength="4"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Initial Balance</label>
                  <div className="amount-input">
                    <span>₹</span>
                    <input
                      type="number"
                      name="initialBalance"
                      value={editingUser.initialBalance}
                      onChange={handleEditUserChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Account Type</label>
                  <select
                    name="accountType"
                    value={editingUser.accountType}
                    onChange={handleEditUserChange}
                    required
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => changeView('users')}>Cancel</button>
                  <button type="submit" className="submit-btn">Save Changes</button>
                </div>
              </form>
            </div>
          )}

          {currentView === 'transaction-details' && selectedTransaction && (
            <div className="transaction-details-section">
              <h2>Transaction Details</h2>
              
              <div className="transaction-details">
                <p><strong>Date & Time:</strong> {formatDate(selectedTransaction.date)}</p>
                <p><strong>User:</strong> {selectedTransaction.userName || 'N/A'}</p>
                <p><strong>Account Number:</strong> {selectedTransaction.accountNumber}</p>
                <p><strong>Transaction ID:</strong> {selectedTransaction.transactionId}</p>
                <p><strong>Type:</strong> {selectedTransaction.type}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedTransaction.amount)}</p>
                <p><strong>Status:</strong> {selectedTransaction.status}</p>
              </div>
              
              <div className="form-actions">
                <button type="button" className="back-btn" onClick={() => changeView('transactions')}>Back to Transactions</button>
              </div>
            </div>
          )}

          {currentView === 'export' && (
            <div className="export-section">
              <h2>Export Database</h2>
              
              <button className="export-btn" onClick={handleExportDatabase}>Export Database</button>
              
              {exportData && (
                <div className="export-data">
                  <h3>Exported Data</h3>
                  <pre>{exportData}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
