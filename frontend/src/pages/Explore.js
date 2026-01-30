import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
    ArrowLeft,
    Sun,
    Moon,
    Sparkles,
    Loader2,
    User,
    Globe,
    ArrowRight
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Explore() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { isAuthenticated } = useAuth();
    const [ideas, setIdeas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSharedIdeas();
    }, []);

    const fetchSharedIdeas = async () => {
        try {
            const response = await axios.get(`${API_URL}/shared`);
            setIdeas(response.data);
        } catch (error) {
            console.error('Failed to fetch shared ideas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isImageUrl = (url) => url?.match(/\.(jpg|jpeg|png|gif|webp)/i) || url?.startsWith('data:image');

    return (
        <div className="min-h-screen bg-background noise-texture">
            <nav className="sticky top-0 z-50 glass border-b border-border/50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Button variant="ghost" className="rounded-full" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> {isAuthenticated ? 'Dashboard' : 'Home'}
                    </Button>
                    <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-emerald-500" />
                        <span className="font-serif text-lg">Explore</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </Button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-10">
                <div className="text-center mb-12">
                    <h1 className="font-serif text-4xl md:text-5xl font-light tracking-tight mb-3">
                        Explore <span className="text-gradient">Ideas</span>
                    </h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Discover creative thoughts shared by the community. Get inspired or collaborate on something amazing.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : ideas.length === 0 ? (
                    <div className="text-center py-20">
                        <Sparkles className="w-16 h-16 mx-auto text-muted-foreground/20 mb-6" />
                        <h2 className="font-serif text-2xl mb-2">No shared ideas yet</h2>
                        <p className="text-muted-foreground mb-6">Be the first to share your creative thoughts!</p>
                        {isAuthenticated ? (
                            <Button onClick={() => navigate('/my-ideas')} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 border-0">
                                Share Your Idea
                            </Button>
                        ) : (
                            <Button onClick={() => navigate('/auth')} className="rounded-full">
                                Sign In to Share
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ideas.map((idea, index) => (
                            <Card
                                key={idea.id}
                                className="group rounded-2xl border-border/50 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => navigate(`/shared/${idea.id}`)}
                            >
                                {idea.media_url && isImageUrl(idea.media_url) ? (
                                    <div className="aspect-[4/3] bg-secondary overflow-hidden">
                                        <img 
                                            src={idea.media_url} 
                                            alt="" 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-[4/3] bg-gradient-to-br from-secondary to-secondary/30 p-6 flex flex-col justify-between">
                                        <h3 className="font-serif text-xl font-medium line-clamp-2">{idea.title}</h3>
                                        {idea.content && (
                                            <p className="text-sm text-muted-foreground line-clamp-4">
                                                {idea.content.split('Attachments:')[0]}
                                            </p>
                                        )}
                                    </div>
                                )}
                                
                                <CardContent className="p-4 border-t border-border/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="w-4 h-4" />
                                            <span className="truncate">{idea.author_name}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                                    </div>
                                    {idea.media_url && isImageUrl(idea.media_url) && (
                                        <h4 className="font-medium text-sm mt-2 truncate">{idea.title}</h4>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* CTA for non-authenticated users */}
                {!isAuthenticated && ideas.length > 0 && (
                    <Card className="mt-16 rounded-2xl border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                        <CardContent className="p-8 text-center">
                            <Sparkles className="w-10 h-10 mx-auto text-emerald-500 mb-4" />
                            <h3 className="font-serif text-2xl mb-2">Ready to share your ideas?</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Join Ideæ to capture your creative thoughts, get AI-powered inspiration, and share with the world.
                            </p>
                            <Button onClick={() => navigate('/auth')} className="rounded-full h-12 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 border-0">
                                Get Started Free
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
