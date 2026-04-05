import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

import { type Login, type Signup } from '../lib/schemas';
import { AuthContext, type User } from './auth-context-type';

// Helper to obfuscate data in localStorage
const encodeData = (data: any) => btoa(unescape(encodeURIComponent(JSON.stringify(data))));
const decodeData = (str: string | null) => {
    if (!str) return null;
    try {
        return JSON.parse(decodeURIComponent(escape(atob(str))));
    } catch (e) {
        return null;
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(() => {
        // Cleanup old plain-text keys if they exist
        localStorage.removeItem('user');
        
        const savedUser = localStorage.getItem('_ap_id_'); 
        return decodeData(savedUser);
    });
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(!user); // If we have a cached user, we're not "loading" the UI shell

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('_ap_id_');
        localStorage.removeItem('user_data'); // Cleanup
        localStorage.removeItem('user'); // Cleanup
    };

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const userData = await authService.getMe();
                    setUser(userData);
                    localStorage.setItem('_ap_id_', encodeData(userData));
                    localStorage.removeItem('user_data'); // Transition cleanup
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
        localStorage.setItem('_ap_id_', encodeData(user));
        localStorage.removeItem('user_data');
    };

    const register = async (userData: Signup) => {
        const { token, user } = await authService.register(userData);
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('_ap_id_', encodeData(user));
        localStorage.removeItem('user_data');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
