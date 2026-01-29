import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { 
    ArrowLeft,
    Sun,
    Moon,
    Ideæles,
    User,
    Palette,
    LogOut
} from 'lucide-react';

export default function Settings() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();

    const handleThemeChange = (isDark) => {
        const newTheme = isDark ? 'dark' : 'light';
        setTheme(newTheme);
        toast.success(`Switched to ${newTheme} mode`);
    };

    const handleLogout = () => {
        logout();
        toast.success('Signed out successfully');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background noise-texture">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 glass border-b border-border/50">
                <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => navigate('/dashboard')}
                        data-testid="back-to-dashboard"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Dashboard
                    </Button>
                    
                    <div className="flex items-center gap-2">
                        <Ideæles className="w-5 h-5 text-spark-yellow" />
                        <span className="font-serif text-lg font-medium">Ideæ</span>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
                <div>
                    <h1 className="font-serif text-2xl md:text-3xl font-medium mb-2" data-testid="settings-title">
                        Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your account and preferences
                    </p>
                </div>

                {/* Profile Card */}
                <Card className="rounded-2xl border-border/50 shadow-soft">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                                <User className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                                <CardTitle className="font-serif text-lg">{user?.name}</CardTitle>
                                <CardDescription>{user?.email}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Appearance Card */}
                <Card className="rounded-2xl border-border/50 shadow-soft">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <CardTitle className="font-serif text-lg">Appearance</CardTitle>
                                <CardDescription>Customize how Ideæ looks</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {theme === 'dark' ? (
                                    <Moon className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <Sun className="w-5 h-5 text-muted-foreground" />
                                )}
                                <div>
                                    <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Switch between light and dark themes
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="dark-mode"
                                checked={theme === 'dark'}
                                onCheckedChange={handleThemeChange}
                                data-testid="theme-switch"
                            />
                        </div>
                        
                        {/* Theme Preview */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setTheme('light')}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                    theme === 'light' 
                                        ? 'border-primary' 
                                        : 'border-transparent hover:border-border'
                                }`}
                                data-testid="light-theme-btn"
                            >
                                <div className="bg-[#FDFBF7] rounded-lg p-3 mb-2 border">
                                    <div className="w-full h-2 bg-[#1A1A1A] rounded mb-1"></div>
                                    <div className="w-3/4 h-1 bg-[#66605B] rounded"></div>
                                </div>
                                <p className="text-sm font-medium">Light</p>
                            </button>
                            
                            <button
                                onClick={() => setTheme('dark')}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                    theme === 'dark' 
                                        ? 'border-primary' 
                                        : 'border-transparent hover:border-border'
                                }`}
                                data-testid="dark-theme-btn"
                            >
                                <div className="bg-[#0A0A0A] rounded-lg p-3 mb-2 border border-[#2A2A2A]">
                                    <div className="w-full h-2 bg-[#EDEDED] rounded mb-1"></div>
                                    <div className="w-3/4 h-1 bg-[#A1A1AA] rounded"></div>
                                </div>
                                <p className="text-sm font-medium">Dark</p>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Sign Out */}
                <Card className="rounded-2xl border-border/50 shadow-soft">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                                    <LogOut className="w-5 h-5 text-destructive" />
                                </div>
                                <div>
                                    <p className="font-medium">Sign Out</p>
                                    <p className="text-xs text-muted-foreground">
                                        Sign out of your account
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="destructive"
                                className="rounded-full"
                                onClick={handleLogout}
                                data-testid="settings-logout-btn"
                            >
                                Sign Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
