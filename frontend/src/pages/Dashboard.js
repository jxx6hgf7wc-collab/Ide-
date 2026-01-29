import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { 
    Pen, 
    Palette, 
    Lightbulb, 
    Gift, 
    Tag, 
    FileText, 
    ArrowRight,
    Sun,
    Moon,
    Sparkles,
    User,
    LogOut,
    Heart,
    Settings,
    Clock,
    NotebookPen
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
    { id: 'writing', name: 'Writing Prompts', icon: Pen, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { id: 'design', name: 'Design Inspiration', icon: Palette, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    { id: 'problem-solving', name: 'Problem Solving', icon: Lightbulb, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
    { id: 'gift-ideas', name: 'Gift Ideas', icon: Gift, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    { id: 'project-names', name: 'Project Names', icon: Tag, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    { id: 'content-ideas', name: 'Content Ideas', icon: FileText, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
];

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [recentQueries, setRecentQueries] = useState([]);
    const [favoritesCount, setFavoritesCount] = useState(0);

    useEffect(() => {
        fetchRecentQueries();
        fetchFavoritesCount();
    }, []);

    const fetchRecentQueries = async () => {
        try {
            const response = await axios.get(`${API_URL}/creative/history`);
            setRecentQueries(response.data.slice(0, 5));
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const fetchFavoritesCount = async () => {
        try {
            const response = await axios.get(`${API_URL}/favorites`);
            setFavoritesCount(response.data.length);
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        }
    };

    const handleLogout = () => {
        logout();
        toast.success('Signed out successfully');
        navigate('/');
    };

    const getCategoryIcon = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.icon : FileText;
    };

    const getCategoryColor = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.color : 'bg-gray-500/10 text-gray-600';
    };

    return (
        <div className="min-h-screen bg-background noise-texture">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 glass border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-4 flex items-center justify-between">
                    <div 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <Sparkles className="w-6 h-6 text-spark-yellow" />
                        <span className="font-serif text-xl font-medium">Ideæ</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-full"
                            data-testid="dashboard-theme-toggle"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </Button>
                        
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/favorites')}
                            className="rounded-full hidden sm:flex"
                            data-testid="favorites-nav-btn"
                        >
                            <Heart className="w-4 h-4 mr-2" />
                            Favorites
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" className="rounded-full gap-2" data-testid="user-menu-btn">
                                    <User className="w-4 h-4" />
                                    <span className="hidden sm:inline">{user?.name}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user?.name}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/favorites')} data-testid="dropdown-favorites">
                                    <Heart className="w-4 h-4 mr-2" />
                                    Favorites ({favoritesCount})
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/settings')} data-testid="dropdown-settings">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="logout-btn">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-8 md:py-12">
                {/* Welcome Section */}
                <div className="mb-12">
                    <h1 className="font-serif text-3xl md:text-4xl font-light tracking-tight mb-2">
                        Welcome back, {user?.name?.split(' ')[0]}
                    </h1>
                    <p className="font-sans text-muted-foreground">
                        What would you like to create today?
                    </p>
                </div>

                {/* Quick Access Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* Favorites Quick Access */}
                    <Card 
                        className="rounded-2xl border-2 border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-pink-500/10 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
                        onClick={() => navigate('/favorites')}
                        data-testid="favorites-card"
                    >
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Heart className="w-7 h-7 text-white fill-white" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-xl font-medium">Your Favorites</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {favoritesCount === 0 
                                            ? "Save ideas you love" 
                                            : `${favoritesCount} saved ${favoritesCount === 1 ? 'idea' : 'ideas'}`
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {favoritesCount > 0 && (
                                    <span className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-rose-500 text-white text-sm font-bold">
                                        {favoritesCount}
                                    </span>
                                )}
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* My Ideas Quick Access */}
                    <Card 
                        className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
                        onClick={() => navigate('/my-ideas')}
                        data-testid="my-ideas-card"
                    >
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <NotebookPen className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-xl font-medium">My Ideas</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Notes, photos, videos & more
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                        </CardContent>
                    </Card>
                </div>

                {/* Categories Grid */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif text-xl font-medium">Creative Categories</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((category) => (
                            <Card
                                key={category.id}
                                className="group cursor-pointer rounded-2xl border border-border/50 shadow-soft hover:shadow-soft-hover transition-all duration-300 hover:-translate-y-1"
                                onClick={() => navigate(`/create/${category.id}`)}
                                data-testid={`dashboard-category-${category.id}`}
                            >
                                <CardContent className="p-6">
                                    <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <category.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-serif text-lg font-medium mb-1">{category.name}</h3>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        Start creating <ArrowRight className="w-3 h-3" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Recent Activity */}
                {recentQueries.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <h2 className="font-serif text-xl font-medium">Recent Activity</h2>
                        </div>
                        
                        <div className="space-y-3">
                            {recentQueries.map((query) => {
                                const Icon = getCategoryIcon(query.category);
                                const colorClass = getCategoryColor(query.category);
                                
                                return (
                                    <Card
                                        key={query.id}
                                        className="rounded-xl border border-border/50 hover:border-border transition-colors cursor-pointer"
                                        onClick={() => navigate(`/create/${query.category}`)}
                                        data-testid={`recent-query-${query.id}`}
                                    >
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{query.prompt}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(query.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
