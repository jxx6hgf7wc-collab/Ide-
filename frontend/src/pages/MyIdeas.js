import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
    ArrowLeft,
    Sun,
    Moon,
    Sparkles,
    Plus,
    StickyNote,
    Lightbulb,
    Image,
    Video,
    Link2,
    Trash2,
    Edit3,
    X,
    Loader2,
    LayoutGrid,
    List,
    Search,
    FileText
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ideaTypes = [
    { id: 'all', name: 'All', icon: LayoutGrid },
    { id: 'note', name: 'Notes', icon: StickyNote, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', gradient: 'from-amber-500 to-orange-500' },
    { id: 'idea', name: 'Ideas', icon: Lightbulb, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-500 to-teal-500' },
    { id: 'photo', name: 'Photos', icon: Image, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', gradient: 'from-purple-500 to-pink-500' },
    { id: 'video', name: 'Videos', icon: Video, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', gradient: 'from-rose-500 to-red-500' },
    { id: 'link', name: 'Links', icon: Link2, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', gradient: 'from-indigo-500 to-blue-500' },
];

export default function MyIdeas() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [ideas, setIdeas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    
    // Dialog states
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        idea_type: 'note',
        media_url: '',
        tags: ''
    });
    const [editingIdea, setEditingIdea] = useState(null);

    useEffect(() => {
        fetchIdeas();
    }, [activeTab]);

    const fetchIdeas = async () => {
        setIsLoading(true);
        try {
            const params = activeTab !== 'all' ? `?idea_type=${activeTab}` : '';
            const response = await axios.get(`${API_URL}/ideas${params}`);
            setIdeas(response.data);
        } catch (error) {
            console.error('Failed to fetch ideas:', error);
            toast.error('Failed to load ideas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: formData.title,
                content: formData.content || null,
                idea_type: formData.idea_type,
                media_url: formData.media_url || null,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
            };

            await axios.post(`${API_URL}/ideas`, payload);
            toast.success('Idea saved!');
            setShowAddDialog(false);
            resetForm();
            fetchIdeas();
        } catch (error) {
            console.error('Create error:', error);
            toast.error('Failed to save idea');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!formData.title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: formData.title,
                content: formData.content || null,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
            };

            await axios.put(`${API_URL}/ideas/${editingIdea.id}`, payload);
            toast.success('Idea updated!');
            setShowEditDialog(false);
            resetForm();
            fetchIdeas();
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update idea');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        
        try {
            await axios.delete(`${API_URL}/ideas/${deleteId}`);
            toast.success('Idea deleted');
            setIdeas(prev => prev.filter(i => i.id !== deleteId));
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete');
        } finally {
            setDeleteId(null);
        }
    };

    const openEditDialog = (idea) => {
        setEditingIdea(idea);
        setFormData({
            title: idea.title,
            content: idea.content || '',
            idea_type: idea.idea_type,
            media_url: idea.media_url || '',
            tags: idea.tags?.join(', ') || ''
        });
        setShowEditDialog(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            idea_type: 'note',
            media_url: '',
            tags: ''
        });
        setEditingIdea(null);
    };

    const getTypeConfig = (typeId) => {
        return ideaTypes.find(t => t.id === typeId) || ideaTypes[1];
    };

    const filteredIdeas = ideas.filter(idea => 
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-background noise-texture">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 glass border-b border-border/50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
                            data-testid="myideas-theme-toggle"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="px-6 py-8 border-b border-border/50">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                            <FileText className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="font-serif text-2xl md:text-3xl font-medium" data-testid="myideas-title">
                                My Ideas
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Your personal creative workspace
                            </p>
                        </div>
                    </div>
                    
                    <Button
                        onClick={() => setShowAddDialog(true)}
                        className="rounded-full h-11 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 border-0 shadow-lg hover:shadow-xl transition-shadow"
                        data-testid="add-idea-btn"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Search and View Toggle */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search ideas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-secondary/50 border-0"
                            data-testid="search-ideas"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            className="rounded-lg"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('list')}
                            className="rounded-lg"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Type Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList className="h-auto p-1 bg-secondary/50 rounded-xl flex-wrap">
                        {ideaTypes.map((type) => (
                            <TabsTrigger
                                key={type.id}
                                value={type.id}
                                className="rounded-lg px-4 py-2 data-[state=active]:bg-background"
                                data-testid={`tab-${type.id}`}
                            >
                                <type.icon className="w-4 h-4 mr-2" />
                                {type.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Ideas Grid/List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredIdeas.length === 0 ? (
                    <div className="text-center py-16">
                        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="font-serif text-xl mb-2">
                            {searchQuery ? 'No matching ideas' : 'No ideas yet'}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            {searchQuery 
                                ? 'Try a different search term' 
                                : 'Start capturing your thoughts, photos, and inspiration'
                            }
                        </p>
                        {!searchQuery && (
                            <Button
                                onClick={() => setShowAddDialog(true)}
                                className="rounded-full"
                                data-testid="empty-add-btn"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Idea
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className={viewMode === 'grid' 
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
                        : 'space-y-3'
                    }>
                        {filteredIdeas.map((idea, index) => {
                            const typeConfig = getTypeConfig(idea.idea_type);
                            const Icon = typeConfig.icon;
                            
                            return (
                                <Card
                                    key={idea.id}
                                    className={`group rounded-2xl border-border/50 shadow-soft hover:shadow-soft-hover transition-all duration-300 overflow-hidden animate-fade-in ${
                                        viewMode === 'list' ? 'hover:bg-secondary/30' : 'hover:-translate-y-1'
                                    }`}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                    data-testid={`idea-${idea.id}`}
                                >
                                    {/* Gradient top bar */}
                                    {viewMode === 'grid' && (
                                        <div className={`h-1.5 bg-gradient-to-r ${typeConfig.gradient}`} />
                                    )}
                                    
                                    <CardContent className={viewMode === 'grid' ? 'p-5' : 'p-4 flex items-start gap-4'}>
                                        {/* Type Icon */}
                                        <div className={`${viewMode === 'grid' ? 'mb-3' : ''} flex-shrink-0`}>
                                            <div className={`w-10 h-10 rounded-xl ${typeConfig.color} flex items-center justify-center`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            {/* Title */}
                                            <h3 className="font-medium text-base mb-1 truncate pr-8">
                                                {idea.title}
                                            </h3>
                                            
                                            {/* Content Preview */}
                                            {idea.content && (
                                                <p className={`text-sm text-muted-foreground ${viewMode === 'grid' ? 'line-clamp-3 mb-3' : 'line-clamp-1'}`}>
                                                    {idea.content}
                                                </p>
                                            )}
                                            
                                            {/* Media Preview */}
                                            {idea.media_url && idea.idea_type === 'photo' && viewMode === 'grid' && (
                                                <div className="mb-3 rounded-lg overflow-hidden">
                                                    <img 
                                                        src={idea.media_url} 
                                                        alt={idea.title}
                                                        className="w-full h-32 object-cover"
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                </div>
                                            )}
                                            
                                            {idea.media_url && idea.idea_type === 'video' && viewMode === 'grid' && (
                                                <div className="mb-3 rounded-lg overflow-hidden bg-secondary/50 p-3">
                                                    <a 
                                                        href={idea.media_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        <Video className="w-3 h-3" />
                                                        Watch Video
                                                    </a>
                                                </div>
                                            )}
                                            
                                            {idea.media_url && idea.idea_type === 'link' && (
                                                <a 
                                                    href={idea.media_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline flex items-center gap-1 mb-2"
                                                >
                                                    <Link2 className="w-3 h-3" />
                                                    {new URL(idea.media_url).hostname}
                                                </a>
                                            )}
                                            
                                            {/* Tags */}
                                            {idea.tags?.length > 0 && viewMode === 'grid' && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {idea.tags.slice(0, 3).map((tag, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs px-2 py-0">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {idea.tags.length > 3 && (
                                                        <Badge variant="secondary" className="text-xs px-2 py-0">
                                                            +{idea.tags.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Date */}
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(idea.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className={`flex items-center gap-1 ${viewMode === 'grid' ? 'absolute top-3 right-3' : ''} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditDialog(idea);
                                                }}
                                                data-testid={`edit-${idea.id}`}
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteId(idea.id);
                                                }}
                                                data-testid={`delete-${idea.id}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Add Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">Add New Idea</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        {/* Type Selection */}
                        <div className="flex flex-wrap gap-2">
                            {ideaTypes.slice(1).map((type) => (
                                <Button
                                    key={type.id}
                                    variant={formData.idea_type === type.id ? 'default' : 'outline'}
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => setFormData({ ...formData, idea_type: type.id })}
                                >
                                    <type.icon className="w-4 h-4 mr-1" />
                                    {type.name}
                                </Button>
                            ))}
                        </div>
                        
                        <Input
                            placeholder="Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="h-11 rounded-xl"
                            data-testid="idea-title-input"
                        />
                        
                        <Textarea
                            placeholder="Write your thoughts..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="min-h-[120px] rounded-xl resize-none"
                            data-testid="idea-content-input"
                        />
                        
                        {(formData.idea_type === 'photo' || formData.idea_type === 'video' || formData.idea_type === 'link') && (
                            <Input
                                placeholder={formData.idea_type === 'photo' ? 'Image URL' : formData.idea_type === 'video' ? 'Video URL' : 'Link URL'}
                                value={formData.media_url}
                                onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                                className="h-11 rounded-xl"
                                data-testid="idea-media-input"
                            />
                        )}
                        
                        <Input
                            placeholder="Tags (comma separated)"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className="h-11 rounded-xl"
                            data-testid="idea-tags-input"
                        />
                    </div>
                    
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => { setShowAddDialog(false); resetForm(); }}
                            className="rounded-full"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting}
                            className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 border-0"
                            data-testid="save-idea-btn"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Idea'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">Edit Idea</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="h-11 rounded-xl"
                        />
                        
                        <Textarea
                            placeholder="Write your thoughts..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="min-h-[120px] rounded-xl resize-none"
                        />
                        
                        <Input
                            placeholder="Tags (comma separated)"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className="h-11 rounded-xl"
                        />
                    </div>
                    
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => { setShowEditDialog(false); resetForm(); }}
                            className="rounded-full"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isSubmitting}
                            className="rounded-full"
                            data-testid="update-idea-btn"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-serif">Delete this idea?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
