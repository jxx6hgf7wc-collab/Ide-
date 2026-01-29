import { useState, useEffect, useRef } from 'react';
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
    Link2,
    Pencil,
    Eraser,
    Download,
    X,
    Expand,
    FileText,
    Paperclip
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Simple Drawing Canvas Component
const DrawingCanvas = ({ onSave, onClose }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(3);
    const [tool, setTool] = useState('pen');

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
        
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
        
        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const saveDrawing = () => {
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
    };

    const colors = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-secondary/50 rounded-xl">
                <Button
                    variant={tool === 'pen' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTool('pen')}
                    className="rounded-lg"
                >
                    <Pencil className="w-4 h-4" />
                </Button>
                <Button
                    variant={tool === 'eraser' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTool('eraser')}
                    className="rounded-lg"
                >
                    <Eraser className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-6 bg-border mx-1" />
                
                {colors.map((c) => (
                    <button
                        key={c}
                        onClick={() => { setColor(c); setTool('pen'); }}
                        className={`w-6 h-6 rounded-full transition-transform ${color === c && tool === 'pen' ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
                
                <div className="w-px h-6 bg-border mx-1" />
                
                <select 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="h-8 px-2 rounded-lg bg-background border text-sm"
                >
                    <option value={2}>Thin</option>
                    <option value={4}>Medium</option>
                    <option value={8}>Thick</option>
                </select>
                
                <Button variant="ghost" size="sm" onClick={clearCanvas} className="rounded-lg ml-auto">
                    Clear
                </Button>
            </div>
            
            {/* Canvas */}
            <div className="border rounded-xl overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    width={500}
                    height={350}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl">
                    Cancel
                </Button>
                <Button onClick={saveDrawing} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0">
                    <Download className="w-4 h-4 mr-2" />
                    Save Drawing
                </Button>
            </div>
        </div>
    );
};

export default function MyIdeas() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [ideas, setIdeas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDrawDialog, setShowDrawDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [viewingIdea, setViewingIdea] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [files, setFiles] = useState([]);

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
        if (!title.trim() && !mediaUrl) {
            toast.error('Please add a title or content');
            return;
        }

        setIsSubmitting(true);
        try {
            let ideaType = 'note';
            let finalMediaUrl = mediaUrl;
            
            // Check if it's a drawing (base64)
            if (mediaUrl.startsWith('data:image')) {
                ideaType = 'drawing';
            } else if (mediaUrl) {
                if (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
                    ideaType = 'photo';
                } else if (mediaUrl.match(/youtube|vimeo|\.mp4/i)) {
                    ideaType = 'video';
                } else {
                    ideaType = 'link';
                }
            }

            // Add file URLs to content if any
            let finalContent = content;
            if (files.length > 0) {
                finalContent = content + (content ? '\n\n' : '') + 'Attachments:\n' + files.join('\n');
            }

            await axios.post(`${API_URL}/ideas`, {
                title: title || 'Drawing',
                content: finalContent || null,
                idea_type: ideaType,
                media_url: finalMediaUrl || null,
                tags: []
            });

            toast.success('Saved!');
            closeAddDialog();
            fetchIdeas();
        } catch (error) {
            toast.error('Failed to save');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        try {
            await axios.delete(`${API_URL}/ideas/${id}`);
            setIdeas(prev => prev.filter(i => i.id !== id));
            toast.success('Deleted');
            if (viewingIdea?.id === id) {
                setShowViewDialog(false);
            }
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleDrawingSave = (dataUrl) => {
        setMediaUrl(dataUrl);
        setShowDrawDialog(false);
        if (!title) setTitle('Drawing');
    };

    const addFileUrl = () => {
        const url = prompt('Enter file URL (Dropbox, Google Drive, etc.)');
        if (url) {
            setFiles([...files, url]);
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const closeAddDialog = () => {
        setShowAddDialog(false);
        setTitle('');
        setContent('');
        setMediaUrl('');
        setFiles([]);
    };

    const openViewDialog = (idea) => {
        setViewingIdea(idea);
        setShowViewDialog(true);
    };

    const isImageUrl = (url) => url?.match(/\.(jpg|jpeg|png|gif|webp)/i) || url?.startsWith('data:image');

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
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
            <main className="max-w-3xl mx-auto px-6 py-8">
                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <Button
                        onClick={() => setShowAddDialog(true)}
                        className="h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-base font-medium shadow-lg hover:shadow-xl transition-all"
                        data-testid="add-idea-btn"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Note
                    </Button>
                    <Button
                        onClick={() => setShowDrawDialog(true)}
                        variant="outline"
                        className="h-16 rounded-2xl text-base font-medium border-2 hover:bg-secondary/50 transition-all"
                        data-testid="draw-btn"
                    >
                        <Pencil className="w-5 h-5 mr-2" />
                        Draw
                    </Button>
                </div>

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {ideas.map((idea, index) => (
                            <Card
                                key={idea.id}
                                className="rounded-2xl border-border/50 overflow-hidden group animate-fade-in cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => openViewDialog(idea)}
                            >
                                {/* Image/Drawing Preview */}
                                {idea.media_url && isImageUrl(idea.media_url) && (
                                    <div className="aspect-[4/3] bg-secondary">
                                        <img 
                                            src={idea.media_url} 
                                            alt={idea.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.target.parentElement.style.display = 'none'}
                                        />
                                    </div>
                                )}
                                
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {idea.idea_type === 'drawing' && <Pencil className="w-3 h-3 text-muted-foreground" />}
                                                {idea.idea_type === 'link' && <Link2 className="w-3 h-3 text-muted-foreground" />}
                                                <h3 className="font-medium text-sm truncate">{idea.title}</h3>
                                            </div>
                                            
                                            {idea.content && !idea.content.startsWith('Attachments:') && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {idea.content.split('Attachments:')[0]}
                                                </p>
                                            )}
                                            
                                            <p className="text-[10px] text-muted-foreground/60 mt-2">
                                                {new Date(idea.created_at).toLocaleDateString('en-US', { 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                        
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            onClick={(e) => handleDelete(idea.id, e)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Add Note Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">New Idea</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 mt-4">
                        <Input
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-12 rounded-xl border-0 bg-secondary/50 text-base font-medium"
                            autoFocus
                        />
                        
                        <Textarea
                            placeholder="Write your thoughts..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[180px] rounded-xl border-0 bg-secondary/50 resize-none text-sm"
                        />
                        
                        {/* Image Preview */}
                        {mediaUrl && isImageUrl(mediaUrl) && (
                            <div className="relative rounded-xl overflow-hidden">
                                <img src={mediaUrl} alt="Preview" className="w-full max-h-48 object-cover" />
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7 rounded-full"
                                    onClick={() => setMediaUrl('')}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        )}
                        
                        {/* Attachments */}
                        {files.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Attachments</p>
                                {files.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-xs flex-1 truncate">{file}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(idx)}>
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg"
                                onClick={() => setShowDrawDialog(true)}
                            >
                                <Pencil className="w-4 h-4 mr-1" />
                                Draw
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg"
                                onClick={() => {
                                    const url = prompt('Enter image URL');
                                    if (url) setMediaUrl(url);
                                }}
                            >
                                <Image className="w-4 h-4 mr-1" />
                                Image
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg"
                                onClick={addFileUrl}
                            >
                                <Paperclip className="w-4 h-4 mr-1" />
                                Attach
                            </Button>
                        </div>
                        
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting || (!title.trim() && !mediaUrl)}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0 font-medium"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Idea'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Drawing Dialog */}
            <Dialog open={showDrawDialog} onOpenChange={setShowDrawDialog}>
                <DialogContent className="sm:max-w-xl rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">Draw Something</DialogTitle>
                    </DialogHeader>
                    <DrawingCanvas 
                        onSave={handleDrawingSave} 
                        onClose={() => setShowDrawDialog(false)} 
                    />
                </DialogContent>
            </Dialog>

            {/* View Idea Dialog (Expanded) */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="sm:max-w-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh]">
                    {viewingIdea && (
                        <>
                            {/* Image */}
                            {viewingIdea.media_url && isImageUrl(viewingIdea.media_url) && (
                                <div className="bg-secondary">
                                    <img 
                                        src={viewingIdea.media_url} 
                                        alt={viewingIdea.title}
                                        className="w-full max-h-[50vh] object-contain"
                                    />
                                </div>
                            )}
                            
                            <div className="p-6 overflow-y-auto">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="font-serif text-2xl font-medium">{viewingIdea.title}</h2>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(viewingIdea.created_at).toLocaleDateString('en-US', { 
                                                weekday: 'long',
                                                month: 'long', 
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full text-destructive hover:text-destructive"
                                        onClick={(e) => handleDelete(viewingIdea.id, e)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                {viewingIdea.content && (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <p className="whitespace-pre-wrap text-base leading-relaxed">
                                            {viewingIdea.content.split('Attachments:')[0]}
                                        </p>
                                        
                                        {/* Show attachments */}
                                        {viewingIdea.content.includes('Attachments:') && (
                                            <div className="mt-4 pt-4 border-t">
                                                <p className="text-sm font-medium mb-2">Attachments</p>
                                                {viewingIdea.content.split('Attachments:')[1]?.split('\n').filter(Boolean).map((url, idx) => (
                                                    <a 
                                                        key={idx}
                                                        href={url.trim()}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-sm text-primary hover:underline mb-1"
                                                    >
                                                        <Paperclip className="w-3 h-3" />
                                                        {url.trim()}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Link */}
                                {viewingIdea.media_url && !isImageUrl(viewingIdea.media_url) && (
                                    <a 
                                        href={viewingIdea.media_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-4 bg-primary/5 px-3 py-2 rounded-lg"
                                    >
                                        <Link2 className="w-4 h-4" />
                                        {viewingIdea.media_url}
                                    </a>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
