import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('ideae_token'));
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('ideae_token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    }, []);

    const fetchUser = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/auth/me`);
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            // Only logout if it's an auth error (401/403), not network errors
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                logout();
            } else {
                // For network errors, keep the token and try again later
                console.log('Network error, keeping session');
            }
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token, fetchUser]);

    // Set up axios interceptor for handling auth errors globally
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401 && token) {
                    // Token is invalid or expired
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [token, logout]);

    const login = async (email, password) => {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        const { token: newToken, user: userData } = response.data;
        
        localStorage.setItem('ideae_token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(userData);
        
        return userData;
    };

    const register = async (name, email, password) => {
        const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
        const { token: newToken, user: userData } = response.data;
        
        localStorage.setItem('ideae_token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(userData);
        
        return userData;
    };

    const updateTheme = async (theme) => {
        try {
            const response = await axios.put(`${API_URL}/settings/theme`, { theme });
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error('Failed to update theme:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            register,
            logout,
            updateTheme,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
