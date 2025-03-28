import dbData from '../data/db.json';

class DatabaseService {
  constructor() {
    
    this.users = [...dbData.users];
    this.transactions = [...dbData.transactions];
    this.admins = [...dbData.admins];
    this.systemInfo = {...dbData.systemInfo};
    
    
    const storedData = localStorage.getItem('atm_database');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData && 
          parsedData.users && 
          parsedData.users.length && 
          process.env.NODE_ENV !== 'development') {
        this.users = parsedData.users;
        this.transactions = parsedData.transactions || [];
        this.admins = parsedData.admins || [];
        this.systemInfo = parsedData.systemInfo || {};
        console.log('Loaded data from localStorage');
        } else {
          
          this._saveToStorage();
          console.log('Using data from DB file');
        }
      } catch (e) {
        console.error('Error parsing stored database, using JSON file data:', e);
        this._saveToStorage();
      }
    } else {
      
      this._saveToStorage();
      console.log('Initialized data from JSON file');
    }
    
    
    this._validateData();
  }

  
  _loadInitialData() {
    try {
      this.users = dbData.users || [];
      this.transactions = dbData.transactions || [];
      this.admins = dbData.admins || [];
      this.systemInfo = dbData.systemInfo || {};
      console.log('Loaded initial data from JSON file');
      this._saveToStorage();
    } catch (e) {
      console.error('Error loading initial data:', e);
      
      this.users = [];
      this.transactions = [];
      this.admins = [{ id: 'admin1', username: 'admin', password: 'admin123', role: 'administrator' }];
      this.systemInfo = { name: 'Silicon Bank ATM System', version: '1.0.0' };
    }
  }

  
  _validateData() {
    
    this.users.forEach(user => {
      if (!user.id) user.id = `user${Date.now()}${Math.floor(Math.random() * 1000)}`;
      if (!user.accountType) user.accountType = "checking";
      if (user.balance === undefined || user.balance === null) user.balance = 0;
      if (!user.createdAt) user.createdAt = new Date().toISOString();
      if (!user.updatedAt) user.updatedAt = new Date().toISOString();
    });
    
    
    this.transactions.forEach(tx => {
      if (!tx.id) tx.id = `tx${Date.now()}${Math.floor(Math.random() * 1000)}`;
      if (!tx.date) tx.date = new Date().toISOString();
      if (!tx.transactionId) tx.transactionId = 'TX' + Math.floor(100000 + Math.random() * 900000);
      if (!tx.status) tx.status = 'Completed';
    });
    
    
    if (!this.admins || this.admins.length === 0) {
      this.admins = [{ 
        id: 'admin1', 
        username: 'admin', 
        password: 'admin123', 
        role: 'administrator',
        lastLogin: new Date().toISOString()
      }];
    }
    
    console.log('Data validation complete');
  }

  
  _saveToStorage() {
    try {
      const data = {
        users: this.users,
        transactions: this.transactions,
        admins: this.admins,
        systemInfo: {
          ...this.systemInfo,
          totalTransactions: this.transactions.length,
          lastUpdated: new Date().toISOString()
        }
      };
      localStorage.setItem('atm_database', JSON.stringify(data));
      console.log('Data saved to localStorage');
      return true;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      return false;
    }
  }
  
  
  exportDatabase() {
    return {
      users: this.users,
      transactions: this.transactions,
      admins: this.admins.map(admin => {
        
        const { password, ...safeAdmin } = admin;
        return safeAdmin;
      }),
      systemInfo: {
        ...this.systemInfo,
        totalTransactions: this.transactions.length,
        lastExport: new Date().toISOString()
      }
    };
  }

  
  authenticateUser(cardNumber, pin) {
    const user = this.getUserByCard(cardNumber);
    
    if (!user) {
      return null;
    }
    
    if (user.pin !== pin) {
      return null;
    }
    
    
    const userTransactions = this.getUserTransactions(user.id);
    
    return {
      ...user,
      transactions: userTransactions
    };
  }
  
  
  authenticateAdmin(username, password) {
    const admin = this.admins.find(a => a.username === username && a.password === password);
    
    if (!admin) {
      return null;
    }
    
    
    admin.lastLogin = new Date().toISOString();
    this._saveToStorage();
    
    return admin;
  }

  
  getUserByCard(cardNumber) {
    if (!cardNumber) return null;
    return this.users.find(u => u.cardNumber === cardNumber);
  }
  
  
  getUserByCardNumber(cardNumber) {
    return this.getUserByCard(cardNumber);
  }
  
  
  getUserById(userId) {
    if (!userId) return null;
    return this.users.find(u => u.id === userId);
  }
  
  
  getUserByAccount(accountNumber) {
    if (!accountNumber) return null;
    return this.users.find(u => u.accountNumber === accountNumber);
  }

  
  getUserTransactions(userId) {
    if (!userId) return [];
    return this.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  
  processDeposit(cardNumber, amount) {
    const user = this.getUserByCard(cardNumber);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, message: 'Invalid amount' };
    }
    
    
    user.balance = (parseFloat(user.balance) || 0) + numAmount;
    user.updatedAt = new Date().toISOString();
    
    
    const transaction = {
      id: `tx${Date.now()}`,
      date: new Date().toISOString(),
      userId: user.id,
      accountNumber: user.accountNumber,
      userName: user.name,
      type: 'Deposit',
      amount: numAmount,
      transactionId: 'TX' + Math.floor(100000 + Math.random() * 900000),
      status: 'Completed'
    };
    
    this.transactions.push(transaction);
    this._saveToStorage();
    
    return {
      success: true,
      newBalance: user.balance,
      transaction: transaction
    };
  }

  
  processWithdrawal(cardNumber, amount) {
    const user = this.getUserByCard(cardNumber);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, message: 'Invalid amount' };
    }
    
    
    const balance = parseFloat(user.balance) || 0;
    if (balance < numAmount) {
      return { success: false, message: 'Insufficient funds' };
    }
    
    
    user.balance = balance - numAmount;
    user.updatedAt = new Date().toISOString();
    
    
    const transaction = {
      id: `tx${Date.now()}`,
      date: new Date().toISOString(),
      userId: user.id,
      accountNumber: user.accountNumber,
      userName: user.name,
      type: 'Withdrawal',
      amount: numAmount,
      transactionId: 'TX' + Math.floor(100000 + Math.random() * 900000),
      status: 'Completed'
    };
    
    this.transactions.push(transaction);
    this._saveToStorage();
    
    return {
      success: true,
      newBalance: user.balance,
      transaction: transaction
    };
  }

  
  processTransfer(cardNumber, amount, toAccountNumber) {
    const fromUser = this.getUserByCard(cardNumber);
    const toUser = this.getUserByAccount(toAccountNumber);
    
    if (!fromUser) {
      return { success: false, message: 'User not found' };
    }
    
    if (!toUser) {
      return { success: false, message: 'Destination account not found' };
    }
    
    if (fromUser.id === toUser.id) {
      return { success: false, message: 'Cannot transfer to your own account' };
    }
    
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, message: 'Invalid amount' };
    }
    
    
    const balance = parseFloat(fromUser.balance) || 0;
    if (balance < numAmount) {
      return { success: false, message: 'Insufficient funds' };
    }
    
    
    fromUser.balance = balance - numAmount;
    toUser.balance = (parseFloat(toUser.balance) || 0) + numAmount;
    
    fromUser.updatedAt = new Date().toISOString();
    toUser.updatedAt = new Date().toISOString();
    
    
    const transaction = {
      id: `tx${Date.now()}`,
      date: new Date().toISOString(),
      userId: fromUser.id,
      accountNumber: fromUser.accountNumber,
      userName: fromUser.name,
      type: 'Transfer',
      amount: numAmount,
      toAccount: toAccountNumber,
      toUserName: toUser.name,
      transactionId: 'TX' + Math.floor(100000 + Math.random() * 900000),
      status: 'Completed'
    };
    
    this.transactions.push(transaction);
    this._saveToStorage();
    
    return {
      success: true,
      newBalance: fromUser.balance,
      transaction: transaction
    };
  }
  
  
  logReceiptPrint(transactionId) {
    const transaction = this.transactions.find(t => t.transactionId === transactionId);
    if (transaction) {
      transaction.receiptPrinted = true;
      transaction.receiptPrintDate = new Date().toISOString();
      this._saveToStorage();
    }
  }
  
  
  getAllUsers() {
    return [...this.users];
  }
  
  
  getAllTransactions() {
    return [...this.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  
  
  addNewUser(userData) {
    try {
      
      const formattedCardNumber = userData.cardNumber.replace(/\s/g, '');
      
      
      if (!formattedCardNumber || formattedCardNumber.length !== 16 || !/^\d+$/.test(formattedCardNumber)) {
        return { success: false, message: 'Card number must be 16 digits' };
      }
      
      
      if (!userData.pin || userData.pin.length !== 4 || !/^\d+$/.test(userData.pin)) {
        return { success: false, message: 'PIN must be 4 digits' };
      }
      
      
      const existingCard = this.getUserByCard(formattedCardNumber);
      if (existingCard) {
        return { success: false, message: 'Card number already exists' };
      }
      
      
      const existingAccount = this.getUserByAccount(userData.accountNumber);
      if (existingAccount) {
        return { success: false, message: 'Account number already exists' };
      }
      
      
      const balance = parseFloat(userData.balance || userData.initialBalance) || 0;
      
      
      const newUser = {
        id: userData.id || `user_${Date.now()}`,
        name: userData.name,
        accountNumber: userData.accountNumber,
        cardNumber: formattedCardNumber,
        pin: userData.pin,
        balance: balance,
        accountType: userData.accountType || 'checking',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      
      this.users.push(newUser);
      
      
      if (balance > 0) {
        const transaction = {
          id: `tx${Date.now()}`,
          date: new Date().toISOString(),
          userId: newUser.id,
          accountNumber: newUser.accountNumber,
          userName: newUser.name,
          type: 'Initial Deposit',
          amount: balance,
          transactionId: 'TX' + Math.floor(100000 + Math.random() * 900000),
          status: 'Completed'
        };
        
        this.transactions.push(transaction);
      }
      
      
      this._saveToStorage();
      
      return {
        success: true,
        user: newUser
      };
    } catch (error) {
      console.error('Error adding new user:', error);
      return { 
        success: false, 
        message: `Error creating user: ${error.message}` 
      };
    }
  }
  
  
  addUser(userData) {
    return this.addNewUser(userData);
  }
  
  
  validateCardNumber(cardNumber) {
    
    if (!cardNumber || cardNumber.length !== 16 || !/^\d{16}$/.test(cardNumber)) {
      return false;
    }
    
    
    let sum = 0;
    let shouldDouble = false;
    
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  }
  
  
  updateUser(userId, updates) {
    const userIndex = this.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    
    if (updates.cardNumber && updates.cardNumber !== this.users[userIndex].cardNumber) {
      const existingCard = this.getUserByCard(updates.cardNumber);
      if (existingCard && existingCard.id !== userId) {
        return { success: false, message: 'Card number already exists' };
      }
    }
    
    if (updates.accountNumber && updates.accountNumber !== this.users[userIndex].accountNumber) {
      const existingAccount = this.getUserByAccount(updates.accountNumber);
      if (existingAccount && existingAccount.id !== userId) {
        return { success: false, message: 'Account number already exists' };
      }
    }
    
    
    if (updates.balance !== undefined) {
      updates.balance = parseFloat(updates.balance) || 0;
    }
    if (updates.initialBalance !== undefined) {
      updates.balance = parseFloat(updates.initialBalance) || 0;
      delete updates.initialBalance;
    }
    
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this._saveToStorage();
    
    return {
      success: true,
      user: this.users[userIndex]
    };
  }
  
  
  deleteUser(userId) {
    const userIndex = this.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    const deletedUser = this.users[userIndex];
    
    
    this.users.splice(userIndex, 1);
    
    
    const transaction = {
      id: `tx${Date.now()}`,
      date: new Date().toISOString(),
      userId: deletedUser.id,
      accountNumber: deletedUser.accountNumber,
      userName: deletedUser.name,
      type: 'Account Closure',
      amount: 0,
      notes: 'Account closed by administrator',
      transactionId: 'TX' + Math.floor(100000 + Math.random() * 900000),
      status: 'Completed'
    };
    
    this.transactions.push(transaction);
    this._saveToStorage();
    
    return {
      success: true,
      user: deletedUser
    };
  }
   
  getSystemStats() {
    const totalUsers = this.users.length;
    const totalTransactions = this.transactions.length;
    
    const totalDeposits = this.transactions
      .filter(t => t.type === 'Deposit' || t.type === 'Initial Deposit')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
    const totalWithdrawals = this.transactions
      .filter(t => t.type === 'Withdrawal')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
    const totalTransfers = this.transactions
      .filter(t => t.type === 'Transfer')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const last7Days = Array(7).fill().map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    
    const transactionsByDay = {};
    last7Days.forEach(day => {
      transactionsByDay[day] = this.transactions.filter(t => 
        t.date && t.date.split('T')[0] === day
      ).length;
    });

    return {
      totalUsers,
      totalTransactions,
      totalDeposits,
      totalWithdrawals,
      totalTransfers,
      transactionsByDay,
      lastUpdated: new Date().toISOString()
    };
  }
}

const dbService = new DatabaseService();
export default dbService;