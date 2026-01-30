import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog';
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
    Copy,
    Trash2,
    Sun,
    Moon,
    Sparkles,
    Heart,
    Check,
    Loader2,
    Edit3,
    Save
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categoryConfig = {
    'writing': { name: 'Writing Prompts', icon: Pen, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    'design': { name: 'Design Inspiration', icon: Palette, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    'problem-solving': { name: 'Problem Solving', icon: Lightbulb, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
    'gift-ideas': { name: 'Gift Ideas', icon: Gift, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    'project-names': { name: 'Project Names', icon: Tag, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    'content-ideas': { name: 'Content Ideas', icon: FileText, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
};

export default function Favorites() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Edit state
    const [editingFavorite, setEditingFavorite] = useState(null);
    const [editedSuggestion, setEditedSuggestion] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const response = await axios.get(`${API_URL}/favorites`);
            setFavorites(response.data);
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
            toast.error('Failed to load favorites');
        } finally {
            setIsLoading(false);
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

    const handleDelete = async () => {
        if (!deleteId) return;
        
        setIsDeleting(true);
        try {
            await axios.delete(`${API_URL}/favorites/${deleteId}`);
            setFavorites(prev => prev.filter(f => f.id !== deleteId));
            toast.success('Removed from favorites');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to remove');
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const openEdit = (favorite) => {
        setEditingFavorite(favorite);
        setEditedSuggestion(favorite.suggestion);
    };

    const handleSaveEdit = async () => {
        if (!editingFavorite) return;
        
        setIsSaving(true);
        try {
            const response = await axios.put(`${API_URL}/favorites/${editingFavorite.id}`, {
                suggestion: editedSuggestion
            });
            
            setFavorites(prev => prev.map(f => 
                f.id === editingFavorite.id ? response.data : f
            ));
            
            toast.success('Changes saved!');
            setEditingFavorite(null);
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const getCategory = (categoryId) => {
        return categoryConfig[categoryId] || { 
            name: categoryId, 
            icon: FileText, 
            color: 'bg-gray-500/10 text-gray-600' 
        };
    };

    return (
        <div className="min-h-screen bg-background noise-texture">
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
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full"
                        data-testid="favorites-theme-toggle"
                    >
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </Button>
                </div>
            </nav>

            {/* Header */}
            <div className="px-6 py-8 border-b border-border/50">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
                            <Heart className="w-7 h-7 text-white fill-white" />
                        </div>
                        <div>
                            <h1 className="font-serif text-2xl md:text-3xl font-medium" data-testid="favorites-title">
                                Your Favorites
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {favorites.length} saved {favorites.length === 1 ? 'suggestion' : 'suggestions'} • Click edit to customize
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-16">
                        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="font-serif text-xl mb-2">No favorites yet</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            Save your favorite creative suggestions to find them here
                        </p>
                        <Button
                            onClick={() => navigate('/dashboard')}
                            className="rounded-full"
                            data-testid="start-creating-btn"
                        >
                            Start Creating
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {favorites.map((favorite, index) => {
                            const category = getCategory(favorite.category);
                            const Icon = category.icon;
                            
                            return (
                                <Card 
                                    key={favorite.id} 
                                    className="rounded-2xl border-border/50 shadow-soft animate-fade-in overflow-hidden"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                    data-testid={`favorite-${favorite.id}`}
                                >
                                    <CardContent className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl ${category.color} flex items-center justify-center`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{category.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(favorite.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-full h-8 w-8"
                                                    onClick={() => openEdit(favorite)}
                                                    data-testid={`edit-favorite-${favorite.id}`}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => setDeleteId(favorite.id)}
                                                    data-testid={`delete-favorite-${favorite.id}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {/* Original Prompt */}
                                        <div className="bg-secondary/50 rounded-xl p-3 mb-4">
                                            <p className="text-xs font-medium text-muted-foreground mb-1">Your prompt:</p>
                                            <p className="text-sm">{favorite.prompt}</p>
                                        </div>
                                        
                                        {/* Suggestion */}
                                        <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                                            <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                                {favorite.suggestion}
                                            </div>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="rounded-full h-8 px-3"
                                                onClick={() => handleCopy(favorite.suggestion, favorite.id)}
                                                data-testid={`copy-favorite-${favorite.id}`}
                                            >
                                                {copiedId === favorite.id ? (
                                                    <Check className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <Copy className="w-3 h-3 mr-1" />
                                                )}
                                                {copiedId === favorite.id ? 'Copied' : 'Copy'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="rounded-full h-8 px-3"
                                                onClick={() => openEdit(favorite)}
                                            >
                                                <Edit3 className="w-3 h-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="rounded-full h-8 px-3"
                                                onClick={() => navigate(`/create/${favorite.category}`)}
                                                data-testid={`create-more-${favorite.id}`}
                                            >
                                                Create more
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Edit Dialog */}
            <Dialog open={!!editingFavorite} onOpenChange={() => setEditingFavorite(null)}>
                <DialogContent className="sm:max-w-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh]">
                    {editingFavorite && (
                        <>
                            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                                <DialogTitle className="font-serif text-xl">Edit Suggestion</DialogTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Customize this suggestion to better fit your needs
                                </p>
                            </DialogHeader>
                            
                            <div className="px-6 py-4 space-y-4 overflow-y-auto">
                                {/* Original Prompt - Read only */}
                                <div className="bg-secondary/50 rounded-xl p-4">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Original prompt:</p>
                                    <p className="text-sm">{editingFavorite.prompt}</p>
                                </div>
                                
                                {/* Editable Suggestion */}
                                <div>
                                    <label className="text-sm font-medium mb-2 block">AI Suggestion (editable):</label>
                                    <Textarea
                                        value={editedSuggestion}
                                        onChange={(e) => setEditedSuggestion(e.target.value)}
                                        className="min-h-[300px] rounded-xl border-0 bg-secondary/30 resize-none text-sm leading-relaxed p-4"
                                        placeholder="Edit the suggestion..."
                                    />
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 border-t border-border/50 flex justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    className="rounded-full"
                                    onClick={() => setEditingFavorite(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                    className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 border-0"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-serif">Remove from favorites?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The suggestion will be removed from your favorites.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full" data-testid="cancel-delete">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                            data-testid="confirm-delete"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
