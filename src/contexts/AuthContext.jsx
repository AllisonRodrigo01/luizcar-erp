import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('luizcar_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      api.verifyUser(parsed.id).then(exists => {
        if (exists) {
          setUser(parsed);
        } else {
          localStorage.removeItem('luizcar_user');
        }
        setLoading(false);
      }).catch(() => {
        setUser(parsed);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const userData = await api.login(username, password);
      if (userData) {
        setUser(userData);
        localStorage.setItem('luizcar_user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('luizcar_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
