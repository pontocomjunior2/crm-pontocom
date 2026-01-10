import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('pontocom_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const userData = await authAPI.me();
            setUser(userData);
        } catch (err) {
            console.error('Session verification failed:', err);
            localStorage.removeItem('pontocom_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const { token, user: userData } = await authAPI.login(email, password);
            localStorage.setItem('pontocom_token', token);
            setUser(userData);
            return userData;
        } catch (err) {
            setError(err.message || 'Erro ao realizar login');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('pontocom_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, logout, isAdmin: user?.role === 'ADMIN' }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
