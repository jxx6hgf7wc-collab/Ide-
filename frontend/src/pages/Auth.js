import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { Sparkles, Sun, Moon, ArrowLeft, Loader2 } from 'lucide-react';

export default function Auth() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();
    const { theme, toggleTheme } = useTheme();
    
    const [isLoading, setIsLoading] = useState(false);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' });

    const redirectTo = location.state?.redirectTo || '/dashboard';

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login(loginData.email, loginData.password);
            toast.success('Welcome back!');
            navigate(redirectTo);
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.detail || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (registerData.password !== registerData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (registerData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await register(registerData.name, registerData.email, registerData.password);
            toast.success('Account created successfully!');
            navigate(redirectTo);
        } catch (error) {
            console.error('Register error:', error);
            toast.error(error.response?.data?.detail || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background noise-texture flex flex-col">
            {/* Header */}
            <nav className="px-6 md:px-12 lg:px-24 py-4 flex items-center justify-between">
                <Button
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => navigate('/')}
                    data-testid="back-btn"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="rounded-full"
                    data-testid="auth-theme-toggle"
                >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </Button>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <Sparkles className="w-8 h-8 text-spark-yellow" />
                        <span className="font-serif text-2xl font-medium">Spark</span>
                    </div>

                    <Card className="rounded-2xl shadow-soft border-border/50">
                        <Tabs defaultValue="login" className="w-full">
                            <CardHeader className="pb-4">
                                <TabsList className="grid w-full grid-cols-2 rounded-full bg-secondary p-1">
                                    <TabsTrigger 
                                        value="login" 
                                        className="rounded-full data-[state=active]:bg-background"
                                        data-testid="login-tab"
                                    >
                                        Sign In
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="register" 
                                        className="rounded-full data-[state=active]:bg-background"
                                        data-testid="register-tab"
                                    >
                                        Create Account
                                    </TabsTrigger>
                                </TabsList>
                            </CardHeader>

                            <CardContent>
                                <TabsContent value="login" className="mt-0">
                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="login-email" className="font-sans text-sm">
                                                Email
                                            </Label>
                                            <Input
                                                id="login-email"
                                                type="email"
                                                placeholder="hello@example.com"
                                                value={loginData.email}
                                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                className="h-12 rounded-xl"
                                                required
                                                data-testid="login-email-input"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="login-password" className="font-sans text-sm">
                                                Password
                                            </Label>
                                            <Input
                                                id="login-password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={loginData.password}
                                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                className="h-12 rounded-xl"
                                                required
                                                data-testid="login-password-input"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full h-12 rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                            disabled={isLoading}
                                            data-testid="login-submit-btn"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                'Sign In'
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>

                                <TabsContent value="register" className="mt-0">
                                    <form onSubmit={handleRegister} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="register-name" className="font-sans text-sm">
                                                Name
                                            </Label>
                                            <Input
                                                id="register-name"
                                                type="text"
                                                placeholder="Your name"
                                                value={registerData.name}
                                                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                                className="h-12 rounded-xl"
                                                required
                                                data-testid="register-name-input"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="register-email" className="font-sans text-sm">
                                                Email
                                            </Label>
                                            <Input
                                                id="register-email"
                                                type="email"
                                                placeholder="hello@example.com"
                                                value={registerData.email}
                                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                                className="h-12 rounded-xl"
                                                required
                                                data-testid="register-email-input"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="register-password" className="font-sans text-sm">
                                                Password
                                            </Label>
                                            <Input
                                                id="register-password"
                                                type="password"
                                                placeholder="At least 6 characters"
                                                value={registerData.password}
                                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                                className="h-12 rounded-xl"
                                                required
                                                data-testid="register-password-input"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="register-confirm" className="font-sans text-sm">
                                                Confirm Password
                                            </Label>
                                            <Input
                                                id="register-confirm"
                                                type="password"
                                                placeholder="••••••••"
                                                value={registerData.confirmPassword}
                                                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                                className="h-12 rounded-xl"
                                                required
                                                data-testid="register-confirm-input"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full h-12 rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                            disabled={isLoading}
                                            data-testid="register-submit-btn"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                'Create Account'
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        By continuing, you agree to Spark's Terms of Service
                    </p>
                </div>
            </div>
        </div>
    );
}
