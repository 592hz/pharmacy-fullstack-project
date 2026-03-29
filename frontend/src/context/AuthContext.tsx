import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

import { type Login, type Signup } from '../lib/schemas';
import { AuthContext, type User } from './auth-context-type';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const userData = await authService.getMe();
                    setUser(userData);
                } catch {
                    console.error('Failed to load user');
                    logout();
                }
            }
            setIsLoading(false);
        };
        loadUser();
    }, [token]);

    const login = async (credentials: Login) => {
        const { token, user } = await authService.login(credentials);
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
    };

    const register = async (userData: Signup) => {
        const { token, user } = await authService.register(userData);
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
