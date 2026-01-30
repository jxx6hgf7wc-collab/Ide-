import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { 
    ArrowLeft,
    Sun,
    Moon,
    Plus,
    Trash2,
    Loader2,
    Sparkles,
    Image,
    Link2,
    Pencil,
    Eraser,
    Type,
    X,
    Paperclip,
    ChevronLeft
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MyIdeas() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [ideas, setIdeas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'create' | 'view'
    const [viewingIdea, setViewingIdea] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [activeMode, setActiveMode] = useState('write');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [drawingData, setDrawingData] = useState('');
    const [files, setFiles] = useState([]);
    
    // Drawing state
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#1a1a1a');
    const [brushSize, setBrushSize] = useState(3);
    const [tool, setTool] = useState('pen');

    useEffect(() => {
        fetchIdeas();
    }, []);

    useEffect(() => {
        if (activeMode === 'draw' && canvasRef.current && view === 'create') {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!drawingData) {
                ctx.fillStyle = theme === 'dark' ? '#1a1a1a' : '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
        
        // Cleanup: re-enable scroll when leaving draw mode
        return () => {
            document.body.style.overflow = '';
        };
    }, [activeMode, view, theme]);

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

    const startDrawing = (e) => {
        e.preventDefault();
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
        
        // Prevent page scroll while drawing
        document.body.style.overflow = 'hidden';
    };

    const draw = (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) * scaleX;
        const y = ((e.clientY || e.touches?.[0]?.clientY) - rect.top) * scaleY;
        
        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? (theme === 'dark' ? '#1a1a1a' : '#ffffff') : color;
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
        // Re-enable page scroll
        document.body.style.overflow = '';
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = theme === 'dark' ? '#1a1a1a' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setDrawingData('');
    };

    const handleCreate = async () => {
        const hasContent = title.trim() || content.trim() || mediaUrl || drawingData;
        if (!hasContent) {
            toast.error('Add something first');
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
                if (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) ideaType = 'photo';
                else if (mediaUrl.match(/youtube|vimeo|\.mp4/i)) ideaType = 'video';
                else ideaType = 'link';
            }

            let finalContent = content;
            if (files.length > 0) {
                finalContent = content + (content ? '\n\n' : '') + 'Attachments:\n' + files.join('\n');
            }

            await axios.post(`${API_URL}/ideas`, {
                title: title || (drawingData ? 'Sketch' : 'Note'),
                content: finalContent || null,
                idea_type: ideaType,
                media_url: finalMediaUrl || null,
                tags: []
            });

            toast.success('Saved!');
            resetForm();
            setView('list');
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
            if (view === 'view') setView('list');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setMediaUrl('');
        setDrawingData('');
        setFiles([]);
        setActiveMode('write');
    };

    const openCreate = () => {
        resetForm();
        setView('create');
    };

    const isImageUrl = (url) => url?.match(/\.(jpg|jpeg|png|gif|webp)/i) || url?.startsWith('data:image');
    
    const colors = [
        { value: '#1a1a1a', name: 'Black' },
        { value: '#6b7280', name: 'Gray' },
        { value: '#dc2626', name: 'Red' },
        { value: '#ea580c', name: 'Orange' },
        { value: '#ca8a04', name: 'Yellow' },
        { value: '#16a34a', name: 'Green' },
        { value: '#2563eb', name: 'Blue' },
        { value: '#9333ea', name: 'Purple' },
    ];

    // LIST VIEW
    if (view === 'list') {
        return (
            <div className="min-h-screen bg-background noise-texture">
                <nav className="sticky top-0 z-50 glass border-b border-border/50">
                    <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Button variant="ghost" className="rounded-full" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-500" />
                            <span className="font-serif text-lg">My Ideas</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </Button>
                    </div>
                </nav>

                <main className="max-w-5xl mx-auto px-6 py-10">
                    <div className="text-center mb-10">
                        <h1 className="font-serif text-4xl md:text-5xl font-light tracking-tight mb-3">
                            Your creative <span className="text-gradient">space</span>
                        </h1>
                        <p className="text-muted-foreground">Capture thoughts, sketches, and inspiration</p>
                    </div>

                    <Button
                        onClick={openCreate}
                        className="w-full max-w-md mx-auto h-16 rounded-2xl mb-12 bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-base font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex"
                        data-testid="add-idea-btn"
                    >
                        <Plus className="w-5 h-5 mr-2" /> New Idea
                    </Button>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : ideas.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-emerald-500/50" />
                            </div>
                            <p className="text-muted-foreground">Your ideas will appear here</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {ideas.map((idea, index) => (
                                <Card
                                    key={idea.id}
                                    className="group rounded-2xl border-border/50 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                                    style={{ animationDelay: `${index * 0.03}s` }}
                                    onClick={() => { setViewingIdea(idea); setView('view'); }}
                                >
                                    {idea.media_url && isImageUrl(idea.media_url) ? (
                                        <div className="aspect-square bg-secondary">
                                            <img src={idea.media_url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="aspect-square bg-gradient-to-br from-secondary to-secondary/50 p-4 flex flex-col justify-between">
                                            <h3 className="font-serif text-base font-medium line-clamp-2">{idea.title}</h3>
                                            {idea.content && (
                                                <p className="text-xs text-muted-foreground line-clamp-4 mt-2">
                                                    {idea.content.split('Attachments:')[0]}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <div className="p-3 border-t border-border/50">
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {idea.media_url && isImageUrl(idea.media_url) ? idea.title : ''}
                                            {new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // CREATE VIEW
    if (view === 'create') {
        return (
            <div className="min-h-screen bg-background noise-texture">
                <nav className="sticky top-0 z-50 glass border-b border-border/50">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Button variant="ghost" className="rounded-full" onClick={() => setView('list')}>
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                        <span className="font-serif text-lg">New Idea</span>
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </Button>
                    </div>
                </nav>

                <main className="max-w-4xl mx-auto px-6 py-8">
                    {/* Mode Switcher */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex p-1.5 bg-secondary/50 rounded-2xl">
                            {[
                                { id: 'write', icon: Type, label: 'Write' },
                                { id: 'draw', icon: Pencil, label: 'Draw' },
                                { id: 'media', icon: Image, label: 'Media' },
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setActiveMode(mode.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                                        activeMode === mode.id 
                                            ? 'bg-background shadow-md text-foreground' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <mode.icon className="w-4 h-4" />
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[60vh]">
                        {/* Write Mode */}
                        {activeMode === 'write' && (
                            <div className="space-y-4 animate-fade-in">
                                <Input
                                    placeholder="Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-16 rounded-2xl border-0 bg-secondary/30 text-2xl font-serif font-medium px-6 placeholder:text-muted-foreground/50"
                                    autoFocus
                                />
                                <Textarea
                                    placeholder="Start writing..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="min-h-[45vh] rounded-2xl border-0 bg-secondary/30 resize-none text-base leading-relaxed p-6 placeholder:text-muted-foreground/50"
                                />
                            </div>
                        )}

                        {/* Draw Mode */}
                        {activeMode === 'draw' && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Toolbar */}
                                <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-secondary/30 rounded-2xl">
                                    <div className="flex gap-1 p-1 bg-background/50 rounded-xl">
                                        <button
                                            onClick={() => setTool('pen')}
                                            className={`p-3 rounded-lg transition-all ${tool === 'pen' ? 'bg-foreground text-background' : 'hover:bg-secondary'}`}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setTool('eraser')}
                                            className={`p-3 rounded-lg transition-all ${tool === 'eraser' ? 'bg-foreground text-background' : 'hover:bg-secondary'}`}
                                        >
                                            <Eraser className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="h-8 w-px bg-border" />
                                    
                                    <div className="flex gap-1.5">
                                        {colors.map((c) => (
                                            <button
                                                key={c.value}
                                                onClick={() => { setColor(c.value); setTool('pen'); }}
                                                className={`w-7 h-7 rounded-full transition-transform ${color === c.value && tool === 'pen' ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-110'}`}
                                                style={{ backgroundColor: c.value }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                    
                                    <div className="h-8 w-px bg-border" />
                                    
                                    <div className="flex gap-1 p-1 bg-background/50 rounded-xl">
                                        {[2, 4, 8].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setBrushSize(size)}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${brushSize === size ? 'bg-foreground text-background' : 'hover:bg-secondary'}`}
                                            >
                                                <div 
                                                    className="rounded-full bg-current" 
                                                    style={{ width: size + 2, height: size + 2 }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="h-8 w-px bg-border" />
                                    
                                    <button
                                        onClick={clearCanvas}
                                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                                
                                {/* Canvas */}
                                <div className={`rounded-2xl overflow-hidden shadow-inner ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                                    <canvas
                                        ref={canvasRef}
                                        width={900}
                                        height={500}
                                        className="w-full cursor-crosshair"
                                        style={{ aspectRatio: '9/5', touchAction: 'none' }}
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                    />
                                </div>
                                
                                <Input
                                    placeholder="Add a title for your sketch..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-12 rounded-xl border-0 bg-secondary/30 text-base px-5"
                                />
                            </div>
                        )}

                        {/* Media Mode */}
                        {activeMode === 'media' && (
                            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                                <Input
                                    placeholder="Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-14 rounded-2xl border-0 bg-secondary/30 text-xl font-serif px-6"
                                />
                                
                                {/* Image */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Image className="w-4 h-4" /> Image
                                    </label>
                                    {mediaUrl && isImageUrl(mediaUrl) ? (
                                        <div className="relative rounded-2xl overflow-hidden">
                                            <img src={mediaUrl} alt="" className="w-full max-h-80 object-cover" />
                                            <Button
                                                variant="secondary" size="icon"
                                                className="absolute top-3 right-3 rounded-full"
                                                onClick={() => setMediaUrl('')}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Input
                                            placeholder="Paste image URL..."
                                            value={mediaUrl}
                                            onChange={(e) => setMediaUrl(e.target.value)}
                                            className="h-14 rounded-xl border-0 bg-secondary/30 px-5"
                                        />
                                    )}
                                </div>

                                {/* Link */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Link2 className="w-4 h-4" /> Link
                                    </label>
                                    <Input
                                        placeholder="Paste any URL..."
                                        value={!isImageUrl(mediaUrl) ? mediaUrl : ''}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        className="h-14 rounded-xl border-0 bg-secondary/30 px-5"
                                    />
                                </div>

                                {/* Files */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Paperclip className="w-4 h-4" /> Attachments
                                    </label>
                                    {files.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
                                            <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            <span className="text-sm flex-1 truncate">{file}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setFiles(files.filter((_, i) => i !== idx))}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const url = prompt('Paste file link (Dropbox, Google Drive, etc.)');
                                            if (url) setFiles([...files, url]);
                                        }}
                                        className="w-full p-6 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                                    >
                                        <Plus className="w-5 h-5 mx-auto mb-2" />
                                        <span className="text-sm">Add attachment</span>
                                    </button>
                                </div>

                                {/* Notes */}
                                <Textarea
                                    placeholder="Add notes..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="min-h-[120px] rounded-xl border-0 bg-secondary/30 resize-none p-5"
                                />
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="mt-8 flex justify-center">
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting}
                            className="h-14 px-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-base font-medium shadow-lg hover:shadow-xl transition-all"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Idea'}
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    // VIEW MODE
    if (view === 'view' && viewingIdea) {
        return (
            <div className="min-h-screen bg-background noise-texture">
                <nav className="sticky top-0 z-50 glass border-b border-border/50">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Button variant="ghost" className="rounded-full" onClick={() => setView('list')}>
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full text-destructive hover:text-destructive"
                            onClick={() => handleDelete(viewingIdea.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </nav>

                <main className="max-w-3xl mx-auto px-6 py-10">
                    {viewingIdea.media_url && isImageUrl(viewingIdea.media_url) && (
                        <div className="rounded-3xl overflow-hidden mb-8 shadow-2xl">
                            <img src={viewingIdea.media_url} alt="" className="w-full" />
                        </div>
                    )}
                    
                    <div className="space-y-6">
                        <div>
                            <h1 className="font-serif text-3xl md:text-4xl font-medium mb-2">{viewingIdea.title}</h1>
                            <p className="text-muted-foreground">
                                {new Date(viewingIdea.created_at).toLocaleDateString('en-US', { 
                                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                                })}
                            </p>
                        </div>
                        
                        {viewingIdea.content && (
                            <p className="text-lg leading-relaxed whitespace-pre-wrap">
                                {viewingIdea.content.split('Attachments:')[0]}
                            </p>
                        )}
                        
                        {viewingIdea.media_url && !isImageUrl(viewingIdea.media_url) && (
                            <a 
                                href={viewingIdea.media_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary hover:underline bg-primary/5 px-5 py-3 rounded-xl"
                            >
                                <Link2 className="w-4 h-4" />
                                {viewingIdea.media_url}
                            </a>
                        )}
                        
                        {viewingIdea.content?.includes('Attachments:') && (
                            <div className="pt-6 border-t border-border/50">
                                <p className="text-sm font-medium text-muted-foreground mb-3">Attachments</p>
                                {viewingIdea.content.split('Attachments:')[1]?.split('\n').filter(Boolean).map((url, idx) => (
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
                </main>
            </div>
        );
    }

    return null;
}
