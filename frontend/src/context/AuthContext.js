import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar si hay un usuario en localStorage al cargar
        try {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (storedUser && token && storedUser !== 'undefined') {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error al cargar usuario del localStorage:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (identifier, password) => {
        try {
            const response = await authAPI.login({ identifier, password });
            const { user: userData } = response.data;
            const { token, ...userInfo } = userData;

            // Guardar en localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userInfo));

            setUser(userInfo);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.error || 'Error al iniciar sesión';
            return { success: false, error: message };
        }
    };

    const registerDonor = async (data) => {
        try {
            const response = await authAPI.registerDonor(data);
            const { user: userData, token } = response.data;

            // Guardar en localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.error || 'Error al registrar usuario';
            return { success: false, error: message };
        }
    };

    const registerOng = async (data) => {
        try {
            const response = await authAPI.registerOng(data);
            const { user: userData, token, ong } = response.data;
            const userInfo = ong ? { ...userData, ong } : userData;

            // Guardar en localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userInfo));

            setUser(userInfo);
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.error || 'Error al registrar ONG';
            return { success: false, error: message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateProfile = async (data) => {
        try {
            const response = await authAPI.updateProfile(data);
            const { user: updatedUser } = response.data;

            // Actualizar en localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.error || 'Error al actualizar perfil';
            return { success: false, error: message };
        }
    };

    const isAdmin = () => user?.role === 'ADMIN';
    const isDonor = () => user?.role === 'DONANTE';
    const isOng = () => user?.role === 'ONG';

    const value = {
        user,
        loading,
        login,
        logout,
        registerDonor,
        registerOng,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin,
        isDonor,
        isOng,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
