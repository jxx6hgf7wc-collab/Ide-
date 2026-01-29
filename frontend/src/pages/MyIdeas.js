import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    Dialog,
    DialogContent,
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
    Type,
    X,
    Paperclip
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MyIdeas() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [ideas, setIdeas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [viewingIdea, setViewingIdea] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [activeTab, setActiveTab] = useState('write');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [drawingData, setDrawingData] = useState('');
    const [files, setFiles] = useState([]);
    
    // Drawing state
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(4);
    const [tool, setTool] = useState('pen');

    useEffect(() => {
        fetchIdeas();
    }, []);

    // Initialize canvas when tab changes to draw
    useEffect(() => {
        if (activeTab === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!drawingData) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [activeTab, showCreateDialog]);

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

    // Drawing functions
    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) * scaleX;
        const y = ((e.clientY || e.touches?.[0]?.clientY) - rect.top) * scaleY;
        
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) * scaleX;
        const y = ((e.clientY || e.touches?.[0]?.clientY) - rect.top) * scaleY;
        
        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing && canvasRef.current) {
            setDrawingData(canvasRef.current.toDataURL('image/png'));
        }
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setDrawingData('');
    };

    const handleCreate = async () => {
        const hasContent = title.trim() || content.trim() || mediaUrl || drawingData;
        if (!hasContent) {
            toast.error('Please add some content');
            return;
        }

        setIsSubmitting(true);
        try {
            let ideaType = 'note';
            let finalMediaUrl = mediaUrl;
            
            if (drawingData) {
                ideaType = 'drawing';
                finalMediaUrl = drawingData;
            } else if (mediaUrl) {
                if (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
                    ideaType = 'photo';
                } else if (mediaUrl.match(/youtube|vimeo|\.mp4/i)) {
                    ideaType = 'video';
                } else {
                    ideaType = 'link';
                }
            }

            let finalContent = content;
            if (files.length > 0) {
                finalContent = content + (content ? '\n\n' : '') + 'Attachments:\n' + files.join('\n');
            }

            await axios.post(`${API_URL}/ideas`, {
                title: title || (drawingData ? 'Drawing' : 'Untitled'),
                content: finalContent || null,
                idea_type: ideaType,
                media_url: finalMediaUrl || null,
                tags: []
            });

            toast.success('Saved!');
            closeCreateDialog();
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
            if (viewingIdea?.id === id) setShowViewDialog(false);
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const closeCreateDialog = () => {
        setShowCreateDialog(false);
        setTitle('');
        setContent('');
        setMediaUrl('');
        setDrawingData('');
        setFiles([]);
        setActiveTab('write');
    };

    const isImageUrl = (url) => url?.match(/\.(jpg|jpeg|png|gif|webp)/i) || url?.startsWith('data:image');
    const colors = ['#000000', '#6b7280', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="rounded-full" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="font-serif text-lg font-medium">My Ideas</h1>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </Button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Big Add Button */}
                <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="w-full h-20 rounded-3xl mb-8 bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-lg font-medium shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
                    data-testid="add-idea-btn"
                >
                    <Plus className="w-6 h-6 mr-3" />
                    Create New Idea
                </Button>

                {/* Ideas Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : ideas.length === 0 ? (
                    <div className="text-center py-16">
                        <NotebookPen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">No ideas yet. Start creating!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ideas.map((idea, index) => (
                            <Card
                                key={idea.id}
                                className="rounded-2xl border-border/50 overflow-hidden group animate-fade-in cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => { setViewingIdea(idea); setShowViewDialog(true); }}
                            >
                                {idea.media_url && isImageUrl(idea.media_url) && (
                                    <div className="aspect-[4/3] bg-secondary">
                                        <img src={idea.media_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm truncate">{idea.title}</h3>
                                            {idea.content && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {idea.content.split('Attachments:')[0]}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground/60 mt-2">
                                                {new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
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

            {/* BIG Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-4xl h-[85vh] rounded-3xl p-0 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <h2 className="font-serif text-2xl font-medium">New Idea</h2>
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={closeCreateDialog}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 pt-4">
                            <TabsList className="h-12 p-1 bg-secondary/50 rounded-2xl">
                                <TabsTrigger value="write" className="rounded-xl px-6 h-10 data-[state=active]:bg-background">
                                    <Type className="w-4 h-4 mr-2" /> Write
                                </TabsTrigger>
                                <TabsTrigger value="draw" className="rounded-xl px-6 h-10 data-[state=active]:bg-background">
                                    <Pencil className="w-4 h-4 mr-2" /> Draw
                                </TabsTrigger>
                                <TabsTrigger value="media" className="rounded-xl px-6 h-10 data-[state=active]:bg-background">
                                    <Image className="w-4 h-4 mr-2" /> Media
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Write Tab */}
                        <TabsContent value="write" className="flex-1 overflow-auto px-6 py-4 mt-0">
                            <div className="space-y-4 h-full flex flex-col">
                                <Input
                                    placeholder="Title (optional)"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-14 rounded-2xl border-0 bg-secondary/50 text-xl font-medium px-5"
                                />
                                <Textarea
                                    placeholder="Write your thoughts, ideas, notes..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="flex-1 min-h-[300px] rounded-2xl border-0 bg-secondary/50 resize-none text-base p-5"
                                />
                            </div>
                        </TabsContent>

                        {/* Draw Tab */}
                        <TabsContent value="draw" className="flex-1 overflow-auto px-6 py-4 mt-0">
                            <div className="h-full flex flex-col gap-4">
                                {/* Drawing Toolbar */}
                                <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/50 rounded-2xl">
                                    <Button
                                        variant={tool === 'pen' ? 'default' : 'ghost'}
                                        size="sm" onClick={() => setTool('pen')}
                                        className="rounded-xl h-10 px-4"
                                    >
                                        <Pencil className="w-4 h-4 mr-2" /> Pen
                                    </Button>
                                    <Button
                                        variant={tool === 'eraser' ? 'default' : 'ghost'}
                                        size="sm" onClick={() => setTool('eraser')}
                                        className="rounded-xl h-10 px-4"
                                    >
                                        <Eraser className="w-4 h-4 mr-2" /> Eraser
                                    </Button>
                                    
                                    <div className="w-px h-8 bg-border mx-2" />
                                    
                                    <div className="flex gap-2">
                                        {colors.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => { setColor(c); setTool('pen'); }}
                                                className={`w-8 h-8 rounded-full transition-all ${color === c && tool === 'pen' ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    
                                    <div className="w-px h-8 bg-border mx-2" />
                                    
                                    <select 
                                        value={brushSize} 
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="h-10 px-4 rounded-xl bg-background border text-sm"
                                    >
                                        <option value={2}>Fine</option>
                                        <option value={4}>Medium</option>
                                        <option value={8}>Bold</option>
                                        <option value={16}>Thick</option>
                                    </select>
                                    
                                    <Button variant="ghost" size="sm" onClick={clearCanvas} className="rounded-xl ml-auto">
                                        Clear All
                                    </Button>
                                </div>
                                
                                {/* Canvas */}
                                <div className="flex-1 border-2 border-dashed border-border rounded-2xl overflow-hidden bg-white min-h-[400px]">
                                    <canvas
                                        ref={canvasRef}
                                        width={800}
                                        height={500}
                                        className="w-full h-full touch-none cursor-crosshair"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Media Tab */}
                        <TabsContent value="media" className="flex-1 overflow-auto px-6 py-4 mt-0">
                            <div className="space-y-6">
                                {/* Image URL */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Image className="w-4 h-4" /> Image URL
                                    </label>
                                    <Input
                                        placeholder="Paste image link here..."
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        className="h-14 rounded-2xl border-0 bg-secondary/50 text-base px-5"
                                    />
                                    {mediaUrl && isImageUrl(mediaUrl) && (
                                        <div className="relative rounded-2xl overflow-hidden">
                                            <img src={mediaUrl} alt="Preview" className="w-full max-h-64 object-cover" />
                                            <Button
                                                variant="secondary" size="icon"
                                                className="absolute top-3 right-3 h-8 w-8 rounded-full"
                                                onClick={() => setMediaUrl('')}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Link */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Link2 className="w-4 h-4" /> Link / Video URL
                                    </label>
                                    <Input
                                        placeholder="Paste any link or video URL..."
                                        value={!isImageUrl(mediaUrl) ? mediaUrl : ''}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        className="h-14 rounded-2xl border-0 bg-secondary/50 text-base px-5"
                                    />
                                </div>

                                {/* File Attachments */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Paperclip className="w-4 h-4" /> File Attachments
                                    </label>
                                    <p className="text-xs text-muted-foreground">Add links to files from Dropbox, Google Drive, etc.</p>
                                    
                                    {files.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                                            <Paperclip className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm flex-1 truncate">{file}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFiles(files.filter((_, i) => i !== idx))}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    
                                    <Button
                                        variant="outline"
                                        className="w-full h-14 rounded-2xl border-dashed"
                                        onClick={() => {
                                            const url = prompt('Enter file URL');
                                            if (url) setFiles([...files, url]);
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add File Link
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-background">
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-lg font-medium"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Idea'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="sm:max-w-3xl rounded-3xl p-0 overflow-hidden max-h-[90vh]">
                    {viewingIdea && (
                        <>
                            {viewingIdea.media_url && isImageUrl(viewingIdea.media_url) && (
                                <div className="bg-secondary">
                                    <img src={viewingIdea.media_url} alt="" className="w-full max-h-[50vh] object-contain" />
                                </div>
                            )}
                            <div className="p-8 overflow-y-auto">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="font-serif text-2xl font-medium">{viewingIdea.title}</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {new Date(viewingIdea.created_at).toLocaleDateString('en-US', { 
                                                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost" size="icon"
                                        className="rounded-full text-destructive"
                                        onClick={(e) => handleDelete(viewingIdea.id, e)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                {viewingIdea.content && (
                                    <p className="whitespace-pre-wrap text-base leading-relaxed">
                                        {viewingIdea.content.split('Attachments:')[0]}
                                    </p>
                                )}
                                {viewingIdea.media_url && !isImageUrl(viewingIdea.media_url) && (
                                    <a href={viewingIdea.media_url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary hover:underline mt-4 bg-primary/5 px-4 py-2 rounded-xl">
                                        <Link2 className="w-4 h-4" /> {viewingIdea.media_url}
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
