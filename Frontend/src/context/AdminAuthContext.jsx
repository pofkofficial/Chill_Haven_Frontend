import { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken } from '../services/api';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(true);

  // Load admin data on initial mount
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
      
      // Optional: You can decode the token here to get admin info
      // For now, we'll keep it simple
      setAdmin({ email: 'admin@chillhaven.com' }); // placeholder - can be improved later
    }
    
    
    setLoading(false);
  }, []);

  const login = (adminData, newToken) => {
    setAdmin(adminData);
    setToken(newToken);
    localStorage.setItem('adminToken', newToken);
    setAuthToken(newToken);
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('adminToken');
    setAuthToken(null);
  };

  const value = {
    admin,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};