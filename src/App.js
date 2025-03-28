import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} setUserData={setUserData} /> : <Navigate to="/dashboard" />} />
          <Route path="/admin-login" element={!isAdminAuthenticated ? <AdminLogin setIsAdminAuthenticated={setIsAdminAuthenticated} /> : <Navigate to="/admin" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard userData={userData} setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
          <Route path="/admin" element={isAdminAuthenticated ? <AdminDashboard setIsAdminAuthenticated={setIsAdminAuthenticated} /> : <Navigate to="/admin-login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;