import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import dbService from '../services/DatabaseService';
import '../styles/Login.css';

function Login({ setIsAuthenticated, setUserData }) {
  const [cardNumber, setCardNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [isCardInserted, setIsCardInserted] = useState(false);

  
  const validateCardNumber = (number) => {
    let cardNum = number.replace(/\D/g, '');
    
    if(cardNum.length !== 16) {
      return false;
    }
    
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = cardNum.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNum.charAt(i));
      
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  };

  const formatCardNumber = (value) => {
    if (!value) return value;
    const cardNum = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    
    for (let i = 0; i < cardNum.length; i += 4) {
      parts.push(cardNum.substring(i, i + 4));
    }
    
    return parts.join(' ');
  };

  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue.substring(0, 19)); 
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setPin(value.substring(0, 4)); 
  };

  const insertCard = () => {
    const strippedCardNumber = cardNumber.replace(/\s+/g, '');
    if (!validateCardNumber(strippedCardNumber)) {
      setError('Invalid card number format. Please check and try again.');
      return;
    }
    
    const user = dbService.getUserByCardNumber(strippedCardNumber);
    if (!user) {
      setError('Card not recognized. Please try another card.');
      return;
    }
    
    setIsCardInserted(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    setError('');
    
    if (!isCardInserted) {
      insertCard();
      return;
    }
    
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    
    setLoading(true);
    
    try {
      const strippedCardNumber = cardNumber.replace(/\s+/g, '');
      const authenticatedUser = dbService.authenticateUser(strippedCardNumber, pin);
      
      if (authenticatedUser) {
        const userTransactions = dbService.getUserTransactions(authenticatedUser.id);
        setUserData({...authenticatedUser, transactions: userTransactions});
        setIsAuthenticated(true);
      } else {
        const newAttempt = attempt + 1;
        setAttempt(newAttempt);
        
        if (newAttempt >= 3) {
          setError('Too many failed attempts. Your card has been temporarily locked for security. Please contact customer support.');
          setIsCardInserted(false);
        } else {
          setError(`Invalid PIN. ${3 - newAttempt} attempts remaining.`);
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ejectCard = () => {
    setCardNumber('');
    setPin('');
    setError('');
    setIsCardInserted(false);
    setAttempt(0);
  };
  
  const handleKeypadPress = (key) => {
    if (loading) return; 
    
    if (!isCardInserted) {
      if (typeof key === 'number') {
        const newCardNumber = cardNumber.replace(/\s+/g, '') + key;
        setCardNumber(formatCardNumber(newCardNumber).substring(0, 19));
      } else if (key === 'clear') {
        setCardNumber('');
      } else if (key === 'backspace') {
        // Remove the last character from card number
        const strippedNumber = cardNumber.replace(/\s+/g, '');
        if (strippedNumber.length > 0) {
          const newNumber = strippedNumber.slice(0, -1);
          setCardNumber(formatCardNumber(newNumber));
        }
      }
    } else {
      if (typeof key === 'number' && pin.length < 4) {
        setPin(prev => prev + key);
      } else if (key === 'clear') {
        setPin('');
      } else if (key === 'backspace') {
        // Remove the last digit from PIN
        if (pin.length > 0) {
          setPin(prev => prev.slice(0, -1));
        }
      }
    }
  };

  return (
    <div className="login-container">
      <div className="atm-machine">
        <div className="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <h1>Silicon Bank ATM</h1>
        
        <div className="login-form">
          <form onSubmit={handleSubmit}>
            {!isCardInserted ? (
              <>
                <p className="instruction">Please insert your card</p>
                <div className="form-group">
                  <label>Card Number</label>
                  <input 
                    type="text" 
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    className="card-input"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
                <button 
                  type="submit" 
                  className="login-btn"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Insert Card'}
                </button>
              </>
            ) : (
              <>
                <p className="instruction">Card inserted. Enter your PIN</p>
                <div className="form-group">
                  <label>PIN</label>
                  <input 
                    type="password" 
                    value={pin}
                    onChange={handlePinChange}
                    placeholder="Enter 4-digit PIN"
                    className="pin-input"
                    disabled={loading}
                    autoFocus
                    readOnly
                  />
                </div>
                <div className="pin-display">
                  <div className={`pin-dot ${pin.length >= 1 ? 'active' : ''}`}></div>
                  <div className={`pin-dot ${pin.length >= 2 ? 'active' : ''}`}></div>
                  <div className={`pin-dot ${pin.length >= 3 ? 'active' : ''}`}></div>
                  <div className={`pin-dot ${pin.length >= 4 ? 'active' : ''}`}></div>
                </div>
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={ejectCard}
                    disabled={loading}
                  >
                    Cancel / Eject Card
                  </button>
                  <button 
                    type="submit" 
                    className="login-btn"
                    disabled={loading || pin.length !== 4}
                  >
                    {loading ? 'Verifying...' : 'Submit'}
                  </button>
                </div>
              </>
            )}
          </form>
          {error && <p className="error-message">{error}</p>}
        </div>
        
        <div className="admin-link">
          <Link to="/admin-login">Admin Access</Link>
        </div>
      </div>
      
      <div className="atm-keypad-visual">
        <div className="keypad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'backspace'].map((key) => (
            <button 
              key={key} 
              className={`keypad-btn ${key === 'clear' ? 'red' : key === 'backspace' ? 'yellow' : ''}`}
              onClick={() => handleKeypadPress(key)}
              disabled={loading || (isCardInserted && pin.length >= 4 && typeof key === 'number')}
            >
              {key === 'clear' ? 'C' : key === 'backspace' ? '⌫' : key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Login;