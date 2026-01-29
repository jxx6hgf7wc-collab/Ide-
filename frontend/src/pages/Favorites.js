import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
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
    Ideæles,
    Heart,
    Check,
    Loader2
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
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                            <Heart className="w-7 h-7 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <h1 className="font-serif text-2xl md:text-3xl font-medium" data-testid="favorites-title">
                                Your Favorites
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {favorites.length} saved {favorites.length === 1 ? 'suggestion' : 'suggestions'}
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
                        <Ideæles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
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
                                    className="rounded-2xl border-border/50 shadow-soft animate-fade-in"
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
