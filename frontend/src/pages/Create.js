import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
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
    Sparkles,
    Loader2,
    Check,
    Zap,
    Star,
    Bookmark,
    Share2
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = {
    'writing': { 
        name: 'Writing Prompts', 
        icon: Pen, 
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        accentColor: 'from-amber-500 to-orange-500',
        placeholder: 'E.g., "I need a story about a time traveler who can only go 5 minutes into the past..."'
    },
    'design': { 
        name: 'Design Inspiration', 
        icon: Palette, 
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        accentColor: 'from-purple-500 to-pink-500',
        placeholder: 'E.g., "I\'m designing a logo for a sustainable coffee brand..."'
    },
    'problem-solving': { 
        name: 'Problem Solving', 
        icon: Lightbulb, 
        color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
        accentColor: 'from-cyan-500 to-teal-500',
        placeholder: 'E.g., "How can I make team meetings more engaging for remote workers..."'
    },
    'gift-ideas': { 
        name: 'Gift Ideas', 
        icon: Gift, 
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        accentColor: 'from-rose-500 to-red-500',
        placeholder: 'E.g., "A gift for my dad who loves gardening and old movies..."'
    },
    'project-names': { 
        name: 'Project Names', 
        icon: Tag, 
        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        accentColor: 'from-indigo-500 to-blue-500',
        placeholder: 'E.g., "A productivity app that helps writers stay focused..."'
    },
    'content-ideas': { 
        name: 'Content Ideas', 
        icon: FileText, 
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        accentColor: 'from-emerald-500 to-green-500',
        placeholder: 'E.g., "Content ideas for a YouTube channel about minimalist living..."'
    }
};

// Parse AI response into structured sections
const parseResponse = (text) => {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = null;
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // Check for numbered items with various formats: "1.", "1)", "1:", etc.
        const numberedMatch = trimmed.match(/^(\d+)[\.\)\:]?\s*\)?\s*\*?\*?["']?(.+?)["']?\*?\*?\s*$/);
        const boldHeaderMatch = trimmed.match(/^\*\*(\d+[\.\)]?\s*)?(.+?)\*\*:?\s*$/);
        const headerMatch = trimmed.match(/^#{1,3}\s*(.+)$/);
        
        // Detect if this is a new section header
        const isNewSection = numberedMatch || boldHeaderMatch || headerMatch;
        
        if (isNewSection) {
            if (currentSection && (currentSection.title || currentSection.content.length > 0)) {
                sections.push(currentSection);
            }
            
            let title = '';
            let number = sections.length + 1;
            
            if (numberedMatch) {
                number = parseInt(numberedMatch[1]);
                title = numberedMatch[2].replace(/\*\*/g, '').replace(/^["']|["']$/g, '');
            } else if (boldHeaderMatch) {
                title = boldHeaderMatch[2].replace(/\*\*/g, '');
                if (boldHeaderMatch[1]) {
                    const num = boldHeaderMatch[1].match(/(\d+)/);
                    if (num) number = parseInt(num[1]);
                }
            } else if (headerMatch) {
                title = headerMatch[1];
            }
            
            currentSection = {
                title: title,
                content: [],
                number: number
            };
        } else if (currentSection) {
            // Add content to current section - clean up markdown
            let cleanLine = trimmed
                .replace(/^\*\s*/, '')
                .replace(/^-\s*/, '')
                .replace(/\*\*(.+?)\*\*/g, '$1')
                .replace(/\*(.+?)\*/g, '$1');
            
            if (cleanLine) {
                currentSection.content.push(cleanLine);
            }
        } else {
            // First content without header - create a section
            currentSection = {
                title: null,
                content: [trimmed.replace(/\*\*(.+?)\*\*/g, '$1')],
                number: 1
            };
        }
    });
    
    if (currentSection && (currentSection.title || currentSection.content.length > 0)) {
        sections.push(currentSection);
    }
    
    // If no structured sections found, create one with the full text
    if (sections.length === 0) {
        return [{ title: null, content: [text], number: 1 }];
    }
    
    return sections;
    
    if (currentSection) {
        sections.push(currentSection);
    }
    
    return sections.length > 0 ? sections : [{ title: null, content: [text], number: 1 }];
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
    const [expandedCards, setExpandedCards] = useState(new Set());
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
            toast.success('Creative suggestions generated!');
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

    const toggleExpand = (id) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    if (!category) return null;

    const Icon = category.icon;

    return (
        <div className="min-h-screen bg-background noise-texture flex flex-col">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 glass border-b border-border/50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.accentColor} flex items-center justify-center shadow-lg`}>
                            <Icon className="w-7 h-7 text-white" />
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
            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
                {/* Suggestions List */}
                <ScrollArea className="flex-1 px-6" ref={scrollRef}>
                    <div className="py-6 space-y-8">
                        {suggestions.length === 0 ? (
                            <div className="text-center py-16">
                                <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${category.accentColor} flex items-center justify-center shadow-lg mb-6`}>
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="font-serif text-2xl mb-3">Ready to inspire</h3>
                                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                                    Describe what you're looking for below, and I'll generate creative suggestions tailored to your needs.
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    <Badge variant="secondary" className="px-3 py-1">
                                        <Zap className="w-3 h-3 mr-1" /> AI-Powered
                                    </Badge>
                                    <Badge variant="secondary" className="px-3 py-1">
                                        <Star className="w-3 h-3 mr-1" /> Unique Ideas
                                    </Badge>
                                    <Badge variant="secondary" className="px-3 py-1">
                                        <Bookmark className="w-3 h-3 mr-1" /> Save Favorites
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            suggestions.map((suggestion, index) => {
                                const sections = parseResponse(suggestion.suggestion);
                                const isExpanded = expandedCards.has(suggestion.id);
                                
                                return (
                                    <div 
                                        key={suggestion.id} 
                                        className="animate-fade-in"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        {/* User Query */}
                                        <div className="flex justify-end mb-4">
                                            <div className={`max-w-[80%] bg-gradient-to-r ${category.accentColor} text-white rounded-2xl rounded-br-md px-5 py-3 shadow-lg`}>
                                                <p className="text-sm font-medium">{suggestion.prompt}</p>
                                            </div>
                                        </div>
                                        
                                        {/* AI Response - Enhanced Card */}
                                        <Card 
                                            className="rounded-3xl border-border/50 shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300" 
                                            data-testid={`suggestion-${suggestion.id}`}
                                        >
                                            {/* Gradient Header */}
                                            <div className={`h-2 bg-gradient-to-r ${category.accentColor}`} />
                                            
                                            <CardContent className="p-0">
                                                {/* Ideas Grid */}
                                                <div className="p-6">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                            {sections.length} Creative {sections.length === 1 ? 'Idea' : 'Ideas'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className={`grid gap-4 ${sections.length > 2 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'}`}>
                                                        {sections.slice(0, isExpanded ? sections.length : 3).map((section, idx) => (
                                                            <div 
                                                                key={idx}
                                                                className="group/card relative p-5 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors duration-200 border border-transparent hover:border-border/50"
                                                            >
                                                                {/* Number Badge */}
                                                                <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-br ${category.accentColor} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                                                                    {section.number}
                                                                </div>
                                                                
                                                                {section.title && (
                                                                    <h4 className="font-serif text-lg font-medium mb-2 mt-2 pr-4">
                                                                        {section.title.replace(/\*\*/g, '')}
                                                                    </h4>
                                                                )}
                                                                
                                                                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                                                                    {section.content.map((line, lineIdx) => (
                                                                        <p key={lineIdx}>{line.replace(/\*\*/g, '')}</p>
                                                                    ))}
                                                                </div>
                                                                
                                                                {/* Quick copy for this idea */}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity h-7 w-7 p-0 rounded-full"
                                                                    onClick={() => handleCopy(
                                                                        `${section.title ? section.title + '\n' : ''}${section.content.join('\n')}`,
                                                                        `${suggestion.id}-${idx}`
                                                                    )}
                                                                >
                                                                    {copiedId === `${suggestion.id}-${idx}` ? (
                                                                        <Check className="w-3 h-3" />
                                                                    ) : (
                                                                        <Copy className="w-3 h-3" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    {sections.length > 3 && (
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full mt-4 rounded-full"
                                                            onClick={() => toggleExpand(suggestion.id)}
                                                        >
                                                            {isExpanded ? 'Show Less' : `Show ${sections.length - 3} More Ideas`}
                                                        </Button>
                                                    )}
                                                </div>
                                                
                                                <Separator />
                                                
                                                {/* Actions Bar */}
                                                <div className="px-6 py-4 flex items-center justify-between bg-muted/30">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="rounded-full h-9 px-4"
                                                            onClick={() => handleCopy(suggestion.suggestion, suggestion.id)}
                                                            data-testid={`copy-${suggestion.id}`}
                                                        >
                                                            {copiedId === suggestion.id ? (
                                                                <Check className="w-4 h-4 mr-2" />
                                                            ) : (
                                                                <Copy className="w-4 h-4 mr-2" />
                                                            )}
                                                            {copiedId === suggestion.id ? 'Copied!' : 'Copy All'}
                                                        </Button>
                                                        <Button
                                                            variant={savedIds.has(suggestion.id) ? "default" : "secondary"}
                                                            size="sm"
                                                            className={`rounded-full h-9 px-4 ${savedIds.has(suggestion.id) ? 'bg-rose-500 hover:bg-rose-600 text-white' : ''}`}
                                                            onClick={() => handleSave(suggestion)}
                                                            data-testid={`save-${suggestion.id}`}
                                                        >
                                                            <Heart className={`w-4 h-4 mr-2 ${savedIds.has(suggestion.id) ? 'fill-current' : ''}`} />
                                                            {savedIds.has(suggestion.id) ? 'Saved!' : 'Save'}
                                                        </Button>
                                                    </div>
                                                    
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(suggestion.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })
                        )}
                        
                        {isLoading && (
                            <div className="flex justify-start">
                                <Card className="rounded-3xl border-border/50 animate-pulse-soft overflow-hidden">
                                    <div className={`h-2 bg-gradient-to-r ${category.accentColor} opacity-50`} />
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.accentColor} flex items-center justify-center`}>
                                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Generating creative ideas...</p>
                                            <p className="text-xs text-muted-foreground">This may take a moment</p>
                                        </div>
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
                            className={`h-[52px] w-[52px] rounded-xl transition-transform hover:scale-105 active:scale-95 bg-gradient-to-r ${category.accentColor} border-0`}
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
