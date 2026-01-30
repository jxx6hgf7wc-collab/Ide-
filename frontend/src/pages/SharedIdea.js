import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useTheme } from '../contexts/ThemeContext';
import { 
    ArrowLeft,
    Sun,
    Moon,
    Sparkles,
    Loader2,
    Link2,
    Paperclip,
    User,
    Calendar,
    ExternalLink,
    Globe
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SharedIdea() {
    const { shareId } = useParams();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [idea, setIdea] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSharedIdea();
    }, [shareId]);

    const fetchSharedIdea = async () => {
        try {
            const response = await axios.get(`${API_URL}/shared/${shareId}`);
            setIdea(response.data);
        } catch (error) {
            setError('This idea is no longer available or the link is invalid.');
        } finally {
            setIsLoading(false);
        }
    };

    const isImageUrl = (url) => url?.match(/\.(jpg|jpeg|png|gif|webp)/i) || url?.startsWith('data:image');

    return (
        <div className="min-h-screen bg-background noise-texture">
            <nav className="sticky top-0 z-50 glass border-b border-border/50">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Button variant="ghost" className="rounded-full" onClick={() => navigate('/explore')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Explore
                    </Button>
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium">Shared Idea</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </Button>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-10">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                        <h2 className="font-serif text-2xl mb-2">Idea not found</h2>
                        <p className="text-muted-foreground mb-6">{error}</p>
                        <Button onClick={() => navigate('/explore')} className="rounded-full">
                            Explore Ideas
                        </Button>
                    </div>
                ) : idea && (
                    <div className="animate-fade-in">
                        {/* Image */}
                        {idea.media_url && isImageUrl(idea.media_url) && (
                            <div className="rounded-3xl overflow-hidden mb-8 shadow-2xl">
                                <img src={idea.media_url} alt="" className="w-full" />
                            </div>
                        )}
                        
                        {/* Content */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="font-serif text-3xl md:text-4xl font-medium mb-4">{idea.title}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <User className="w-4 h-4" />
                                        {idea.author_name}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(idea.created_at).toLocaleDateString('en-US', { 
                                            month: 'long', day: 'numeric', year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                            
                            {idea.content && (
                                <div className="prose prose-lg dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap leading-relaxed">
                                        {idea.content.split('Attachments:')[0]}
                                    </p>
                                </div>
                            )}
                            
                            {/* Link */}
                            {idea.media_url && !isImageUrl(idea.media_url) && (
                                <a 
                                    href={idea.media_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-primary hover:underline bg-primary/5 px-5 py-3 rounded-xl"
                                >
                                    <Link2 className="w-4 h-4" />
                                    {idea.media_url}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                            
                            {/* Attachments */}
                            {idea.content?.includes('Attachments:') && (
                                <div className="pt-6 border-t border-border/50">
                                    <p className="text-sm font-medium text-muted-foreground mb-3">Attachments</p>
                                    {idea.content.split('Attachments:')[1]?.split('\n').filter(Boolean).map((url, idx) => (
                                        <a 
                                            key={idx}
                                            href={url.trim()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-primary hover:underline mb-2"
                                        >
                                            <Paperclip className="w-3 h-3" />
                                            {url.trim()}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* CTA */}
                        <Card className="mt-12 rounded-2xl border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                            <CardContent className="p-6 text-center">
                                <h3 className="font-serif text-xl mb-2">Have your own ideas?</h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    Join Ideæ to capture, create, and share your creative thoughts
                                </p>
                                <Button onClick={() => navigate('/auth')} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 border-0">
                                    Get Started
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}
