import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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
    Sparkles
} from 'lucide-react';

const categories = [
    {
        id: 'writing',
        name: 'Writing Prompts',
        description: 'Overcome writer\'s block with unique story ideas and prompts',
        icon: Pen,
        image: 'https://images.unsplash.com/photo-1767547109500-db6a9d411ae9',
        color: 'from-amber-500/20 to-orange-500/20'
    },
    {
        id: 'design',
        name: 'Design Inspiration',
        description: 'Find creative visual concepts and aesthetic directions',
        icon: Palette,
        image: 'https://images.unsplash.com/photo-1651611243377-2c15b94ad613',
        color: 'from-purple-500/20 to-pink-500/20'
    },
    {
        id: 'problem-solving',
        name: 'Problem Solving',
        description: 'Think outside the box with innovative solutions',
        icon: Lightbulb,
        image: 'https://images.unsplash.com/photo-1769454297008-0098feffa1c2',
        color: 'from-cyan-500/20 to-teal-500/20'
    },
    {
        id: 'gift-ideas',
        name: 'Gift Ideas',
        description: 'Discover thoughtful and unique gift suggestions',
        icon: Gift,
        image: 'https://images.unsplash.com/photo-1637679276613-9b0f80d39a40',
        color: 'from-rose-500/20 to-red-500/20'
    },
    {
        id: 'project-names',
        name: 'Project Names',
        description: 'Generate memorable names for your ventures',
        icon: Tag,
        image: 'https://images.unsplash.com/photo-1543089745-8f772b9db4ae',
        color: 'from-indigo-500/20 to-blue-500/20'
    },
    {
        id: 'content-ideas',
        name: 'Content Ideas',
        description: 'Create engaging content for any platform',
        icon: FileText,
        image: 'https://images.unsplash.com/photo-1705656774214-d276c2092c42',
        color: 'from-emerald-500/20 to-green-500/20'
    }
];

export default function Landing() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [hoveredCard, setHoveredCard] = useState(null);

    const handleCategoryClick = (categoryId) => {
        if (isAuthenticated) {
            navigate(`/create/${categoryId}`);
        } else {
            navigate('/auth', { state: { redirectTo: `/create/${categoryId}` } });
        }
    };

    const handleGetStarted = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/auth');
        }
    };

    return (
        <div className="min-h-screen bg-background noise-texture">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-spark-yellow" />
                        <span className="font-serif text-xl font-medium">Ideæ</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-full"
                            data-testid="theme-toggle-btn"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </Button>
                        {isAuthenticated ? (
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="rounded-full px-6"
                                data-testid="dashboard-btn"
                            >
                                Dashboard
                            </Button>
                        ) : (
                            <Button
                                onClick={() => navigate('/auth')}
                                className="rounded-full px-6"
                                data-testid="signin-btn"
                            >
                                Sign In
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-6 md:px-12 lg:px-24">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-3xl">
                        <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground/80 mb-4 animate-fade-in">
                            The Anti-Block Creative Assistant
                        </p>
                        <h1 className="font-serif text-5xl md:text-7xl font-light tracking-tight leading-[0.9] mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            Out of ideas? <span className="text-gradient">We've got you.</span>
                        </h1>
                        <p className="font-sans text-base md:text-lg leading-relaxed text-muted-foreground max-w-xl mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            Not for everyday questions. For when you need real creative help — 
                            writing ideas, design concepts, unique gifts, and more.
                        </p>
                        <Button 
                            onClick={handleGetStarted}
                            className="h-12 px-8 rounded-full transition-transform hover:scale-105 active:scale-95 shadow-lg animate-fade-in"
                            style={{ animationDelay: '0.3s' }}
                            data-testid="get-started-btn"
                        >
                            Get Started <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="py-16 px-6 md:px-12 lg:px-24">
                <div className="max-w-7xl mx-auto">
                    <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground/80 mb-8">
                        Choose your creative challenge
                    </p>
                    
                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((category, index) => (
                            <Card
                                key={category.id}
                                className={`group relative overflow-hidden rounded-2xl border border-border/50 shadow-soft hover:shadow-soft-hover cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                                    index === 0 || index === 3 ? 'lg:col-span-2 lg:row-span-1' : ''
                                }`}
                                onClick={() => handleCategoryClick(category.id)}
                                onMouseEnter={() => setHoveredCard(category.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                data-testid={`category-${category.id}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                
                                <div className="relative p-6 md:p-8 h-full min-h-[200px] flex flex-col justify-between">
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <category.icon className="w-6 h-6 text-foreground" />
                                        </div>
                                        <h3 className="font-serif text-2xl md:text-3xl font-medium mb-2">
                                            {category.name}
                                        </h3>
                                        <p className="font-sans text-sm text-muted-foreground">
                                            {category.description}
                                        </p>
                                    </div>
                                    
                                    <div className={`flex items-center gap-2 mt-4 text-sm font-medium transition-all duration-300 ${
                                        hoveredCard === category.id ? 'translate-x-2 opacity-100' : 'opacity-70'
                                    }`}>
                                        Explore <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 md:px-12 lg:px-24 border-t border-border/50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-spark-yellow" />
                        <span className="font-serif text-lg">Ideæ</span>
                    </div>
                    <p className="font-sans text-sm text-muted-foreground">
                        Designed to unblock your creativity
                    </p>
                </div>
            </footer>
        </div>
    );
}
