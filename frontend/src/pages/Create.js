import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
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
    ArrowLeft,
    Send,
    Heart,
    Copy,
    Sun,
    Moon,
    Ideæles,
    Loader2,
    Check
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = {
    'writing': { 
        name: 'Writing Prompts', 
        icon: Pen, 
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        placeholder: 'E.g., "I need a story about a time traveler who can only go 5 minutes into the past..."'
    },
    'design': { 
        name: 'Design Inspiration', 
        icon: Palette, 
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        placeholder: 'E.g., "I\'m designing a logo for a sustainable coffee brand..."'
    },
    'problem-solving': { 
        name: 'Problem Solving', 
        icon: Lightbulb, 
        color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
        placeholder: 'E.g., "How can I make team meetings more engaging for remote workers..."'
    },
    'gift-ideas': { 
        name: 'Gift Ideas', 
        icon: Gift, 
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        placeholder: 'E.g., "A gift for my dad who loves gardening and old movies..."'
    },
    'project-names': { 
        name: 'Project Names', 
        icon: Tag, 
        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        placeholder: 'E.g., "A productivity app that helps writers stay focused..."'
    },
    'content-ideas': { 
        name: 'Content Ideas', 
        icon: FileText, 
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        placeholder: 'E.g., "Content ideas for a YouTube channel about minimalist living..."'
    }
};

export default function Create() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [copiedId, setCopiedId] = useState(null);
    const [savedIds, setSavedIds] = useState(new Set());
    const scrollRef = useRef(null);

    const category = categories[categoryId];

    useEffect(() => {
        if (!category) {
            navigate('/dashboard');
        }
    }, [category, navigate]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [suggestions]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);

        try {
            const response = await axios.post(`${API_URL}/creative/generate`, {
                category: categoryId,
                prompt: prompt.trim()
            });

            setSuggestions(prev => [...prev, response.data]);
            setPrompt('');
            toast.success('Creative suggestion generated!');
        } catch (error) {
            console.error('Generation error:', error);
            toast.error(error.response?.data?.detail || 'Failed to generate suggestion');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (suggestion) => {
        if (savedIds.has(suggestion.id)) {
            toast.info('Already saved to favorites');
            return;
        }

        try {
            await axios.post(`${API_URL}/favorites`, {
                category: suggestion.category,
                prompt: suggestion.prompt,
                suggestion: suggestion.suggestion
            });
            setSavedIds(prev => new Set([...prev, suggestion.id]));
            toast.success('Saved to favorites!');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save');
        }
    };

    const handleCopy = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    if (!category) return null;

    const Icon = category.icon;

    return (
        <div className="min-h-screen bg-background noise-texture flex flex-col">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 glass border-b border-border/50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => navigate('/dashboard')}
                        data-testid="back-to-dashboard"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Dashboard
                    </Button>
                    
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-full"
                            data-testid="create-theme-toggle"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="px-6 py-8 border-b border-border/50">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center`}>
                            <Icon className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="font-serif text-2xl md:text-3xl font-medium" data-testid="category-title">
                                {category.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Describe what you're looking for
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                {/* Suggestions List */}
                <ScrollArea className="flex-1 px-6" ref={scrollRef}>
                    <div className="py-6 space-y-6">
                        {suggestions.length === 0 ? (
                            <div className="text-center py-16">
                                <Ideæles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="font-serif text-xl mb-2">Ready to spark creativity</h3>
                                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                    Describe what you're looking for below, and I'll generate creative suggestions tailored to your needs.
                                </p>
                            </div>
                        ) : (
                            suggestions.map((suggestion, index) => (
                                <div 
                                    key={suggestion.id} 
                                    className="animate-fade-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {/* User Query */}
                                    <div className="flex justify-end mb-4">
                                        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
                                            <p className="text-sm">{suggestion.prompt}</p>
                                        </div>
                                    </div>
                                    
                                    {/* AI Response */}
                                    <Card className="rounded-2xl rounded-bl-md border-border/50 shadow-soft" data-testid={`suggestion-${suggestion.id}`}>
                                        <CardContent className="p-6">
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                                    {suggestion.suggestion}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="rounded-full h-8 px-3"
                                                    onClick={() => handleCopy(suggestion.suggestion, suggestion.id)}
                                                    data-testid={`copy-${suggestion.id}`}
                                                >
                                                    {copiedId === suggestion.id ? (
                                                        <Check className="w-3 h-3 mr-1" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 mr-1" />
                                                    )}
                                                    {copiedId === suggestion.id ? 'Copied' : 'Copy'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`rounded-full h-8 px-3 ${savedIds.has(suggestion.id) ? 'text-rose-500' : ''}`}
                                                    onClick={() => handleSave(suggestion)}
                                                    data-testid={`save-${suggestion.id}`}
                                                >
                                                    <Heart className={`w-3 h-3 mr-1 ${savedIds.has(suggestion.id) ? 'fill-current' : ''}`} />
                                                    {savedIds.has(suggestion.id) ? 'Saved' : 'Save'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))
                        )}
                        
                        {isLoading && (
                            <div className="flex justify-start">
                                <Card className="rounded-2xl rounded-bl-md border-border/50 animate-pulse-soft">
                                    <CardContent className="p-6 flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Generating creative suggestions...</span>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="px-6 py-4 border-t border-border/50 bg-background">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={category.placeholder}
                            className="flex-1 min-h-[52px] max-h-32 rounded-xl resize-none bg-secondary/50 border-0 focus-visible:ring-1"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            data-testid="prompt-input"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="h-[52px] w-[52px] rounded-xl transition-transform hover:scale-105 active:scale-95"
                            disabled={!prompt.trim() || isLoading}
                            data-testid="submit-prompt-btn"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </form>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Press Enter to send, Shift+Enter for new line
                    </p>
                </div>
            </div>
        </div>
    );
}
