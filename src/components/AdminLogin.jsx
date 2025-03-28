import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import dbService from '../services/DatabaseService';
import '../styles/AdminLogin.css';

function AdminLogin({ setIsAdminAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const authenticatedAdmin = dbService.authenticateAdmin(username, password);
      
      if (authenticatedAdmin) {
        setIsAdminAuthenticated(true);
      } else {
        const newAttempt = attempt + 1;
        setAttempt(newAttempt);
        
        if (newAttempt >= 3) {
          setError('Too many failed attempts. Access has been temporarily disabled for security reasons.');
          setTimeout(() => {
            setAttempt(0);
            setError('');
          }, 30000);
        } else {
          setError(`Invalid credentials. ${3 - newAttempt} attempts remaining.`);
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      
      <h1>Silicon Bank Admin</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Administrator Username"
            disabled={loading || attempt >= 3}
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Administrator Password"
            disabled={loading || attempt >= 3}
          />
        </div>
        
        <button 
          type="submit" 
          className="login-btn"
          disabled={loading || attempt >= 3}
        >
          {loading ? 'Authenticating...' : 'Login'}
        </button>
      </form>
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="admin-system-text">
        Administrative access requires proper authorization
      </div>
      
      <div className="back-to-user">
        <Link to="/">Return to User Login</Link>
      </div>
    </div>
  );
}

export default AdminLogin;