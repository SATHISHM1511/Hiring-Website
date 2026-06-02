import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const fetchMe = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        setUser(data.user);
        setProfile(data.profile);
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    if (data.success) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      toast.success('Welcome back! 👋');
      return data;
    }
    throw new Error(data.message);
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    if (data.success) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      toast.success('Account created successfully! 🎉');
      return data;
    }
    throw new Error(data.message);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProfile(null);
    toast.info('Logged out successfully');
  };

  const updateProfile = (updatedProfile) => {
    setProfile(prev => ({ ...prev, ...updatedProfile }));
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, token,
      login, register, logout, updateProfile, fetchMe
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
