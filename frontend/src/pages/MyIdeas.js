import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { 
    ArrowLeft,
    Sun,
    Moon,
    Plus,
    Trash2,
    Loader2,
    NotebookPen,
    Image,
    Link2
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MyIdeas() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [ideas, setIdeas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');

    useEffect(() => {
        fetchIdeas();
    }, []);

    const fetchIdeas = async () => {
        try {
            const response = await axios.get(`${API_URL}/ideas`);
            setIdeas(response.data);
        } catch (error) {
            console.error('Failed to fetch ideas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            toast.error('Please add a title');
            return;
        }

        setIsSubmitting(true);
        try {
            // Auto-detect type based on content
            let ideaType = 'note';
            if (mediaUrl) {
                if (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
                    ideaType = 'photo';
                } else if (mediaUrl.match(/youtube|vimeo|\.mp4/i)) {
                    ideaType = 'video';
                } else {
                    ideaType = 'link';
                }
            }

            await axios.post(`${API_URL}/ideas`, {
                title,
                content: content || null,
                idea_type: ideaType,
                media_url: mediaUrl || null,
                tags: []
            });

            toast.success('Saved!');
            setShowAddDialog(false);
            setTitle('');
            setContent('');
            setMediaUrl('');
            fetchIdeas();
        } catch (error) {
            toast.error('Failed to save');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/ideas/${id}`);
            setIdeas(prev => prev.filter(i => i.id !== id));
            toast.success('Deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const isImageUrl = (url) => url?.match(/\.(jpg|jpeg|png|gif|webp)/i);

    return (
        <div className="min-h-screen bg-background">
            {/* Simple Header */}
            <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    
                    <h1 className="font-serif text-lg font-medium">My Ideas</h1>
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full"
                    >
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </Button>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-6 py-8">
                {/* Add Button */}
                <Button
                    onClick={() => setShowAddDialog(true)}
                    className="w-full h-14 rounded-2xl mb-8 bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-base font-medium shadow-lg hover:shadow-xl transition-all"
                    data-testid="add-idea-btn"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Idea
                </Button>

                {/* Ideas List */}
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : ideas.length === 0 ? (
                    <div className="text-center py-16">
                        <NotebookPen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">No ideas yet. Start capturing your thoughts!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ideas.map((idea, index) => (
                            <Card
                                key={idea.id}
                                className="rounded-2xl border-border/50 overflow-hidden group animate-fade-in"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Image Preview */}
                                {idea.media_url && isImageUrl(idea.media_url) && (
                                    <div className="aspect-video bg-secondary">
                                        <img 
                                            src={idea.media_url} 
                                            alt={idea.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.target.parentElement.style.display = 'none'}
                                        />
                                    </div>
                                )}
                                
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-base mb-1">{idea.title}</h3>
                                            
                                            {idea.content && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                    {idea.content}
                                                </p>
                                            )}
                                            
                                            {/* Link Preview */}
                                            {idea.media_url && !isImageUrl(idea.media_url) && (
                                                <a 
                                                    href={idea.media_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline bg-primary/5 px-2.5 py-1 rounded-full"
                                                >
                                                    <Link2 className="w-3 h-3" />
                                                    {idea.media_url.length > 30 ? idea.media_url.slice(0, 30) + '...' : idea.media_url}
                                                </a>
                                            )}
                                            
                                            <p className="text-xs text-muted-foreground/60 mt-2">
                                                {new Date(idea.created_at).toLocaleDateString('en-US', { 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                        
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(idea.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Simple Add Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-md rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">New Idea</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 mt-4">
                        <Input
                            placeholder="What's on your mind?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-12 rounded-xl border-0 bg-secondary/50 text-base"
                            autoFocus
                        />
                        
                        <Textarea
                            placeholder="Add more details... (optional)"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[100px] rounded-xl border-0 bg-secondary/50 resize-none"
                        />
                        
                        <div className="relative">
                            <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Paste image or link URL (optional)"
                                value={mediaUrl}
                                onChange={(e) => setMediaUrl(e.target.value)}
                                className="h-11 pl-10 rounded-xl border-0 bg-secondary/50 text-sm"
                            />
                        </div>
                        
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting || !title.trim()}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0 font-medium"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Idea'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
