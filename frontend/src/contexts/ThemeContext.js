import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const { user, updateTheme } = useAuth();
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem('spark_theme');
        return saved || 'light';
    });

    useEffect(() => {
        if (user?.theme) {
            setThemeState(user.theme);
        }
    }, [user?.theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('spark_theme', theme);
    }, [theme]);

    const setTheme = async (newTheme) => {
        setThemeState(newTheme);
        if (user) {
            try {
                await updateTheme(newTheme);
            } catch (error) {
                console.error('Failed to save theme preference:', error);
            }
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
