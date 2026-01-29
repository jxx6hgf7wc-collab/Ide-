import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdProvider } from './components/AdProvider';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Create from './pages/Create';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse-soft">
                    <div className="w-8 h-8 rounded-full bg-primary/20"></div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    return <AdProvider>{children}</AdProvider>;
};

// App Routes
const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/create/:categoryId"
                element={
                    <ProtectedRoute>
                        <Create />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/favorites"
                element={
                    <ProtectedRoute>
                        <Favorites />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    <AppRoutes />
                    <Toaster 
                        position="top-center" 
                        richColors 
                        closeButton
                        toastOptions={{
                            className: 'rounded-xl',
                        }}
                    />
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
