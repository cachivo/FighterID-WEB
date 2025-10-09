import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image, X, Plus, Loader2, Video, Upload, ImagePlus } from 'lucide-react';
import { CreatePostData } from '@/hooks/useSocialPosts';
import { FileUpload } from '@/components/ui/file-upload';

interface CreatePostFormProps {
  onSubmit: (data: CreatePostData) => Promise<void>;
  authorName: string;
  authorNickname?: string;
  authorAvatar?: string;
  authorType: 'fighter' | 'admin' | 'user';
  loading?: boolean;
  canToggleAuthor?: boolean;
  postAsAdmin?: boolean;
  onToggleAuthor?: (asAdmin: boolean) => void;
}

export default function CreatePostForm({ 
  onSubmit, 
  authorName, 
  authorNickname, 
  authorAvatar, 
  authorType,
  loading = false,
  canToggleAuthor = false,
  postAsAdmin = true,
  onToggleAuthor
}: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{file: File, preview: string, type: 'image' | 'video'}[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && mediaUrls.length === 0 && mediaFiles.length === 0) return;
    if (isSubmitting) return; // Prevent double submit

    setIsSubmitting(true);

    const postData: CreatePostData = {
      content: content.trim(),
      media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
      media_files: mediaFiles.length > 0 ? mediaFiles : undefined,
      post_type: mediaFiles.some(f => f.type.startsWith('video/')) ? 'video' : 
                 (mediaUrls.length > 0 || mediaFiles.length > 0) ? 'image' : 'text'
    };

    try {
      await onSubmit(postData);
      
      // Reset form only on success
      setContent('');
      setMediaUrls([]);
      setMediaFiles([]);
      filePreviews.forEach(p => URL.revokeObjectURL(p.preview));
      setFilePreviews([]);
      setNewImageUrl('');
      setShowImageInput(false);
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (mediaFiles.length >= 4) return; // Max 4 files
    
    const fileType = file.type.startsWith('image/') ? 'image' : 'video';
    const preview = URL.createObjectURL(file);
    
    setMediaFiles(prev => [...prev, file]);
    setFilePreviews(prev => [...prev, { file, preview, type: fileType }]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index].preview);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addImageUrl = () => {
    if (newImageUrl.trim() && !mediaUrls.includes(newImageUrl.trim())) {
      setMediaUrls([...mediaUrls, newImageUrl.trim()]);
      setNewImageUrl('');
      setShowImageInput(false);
    }
  };

  const removeImageUrl = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const getAuthorInitials = () => {
    return authorName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';
  };

  const isSubmitDisabled = (!content.trim() && mediaUrls.length === 0 && mediaFiles.length === 0) || content.length > 2000 || loading || isSubmitting;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Author info with toggle - ENHANCED */}
      <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg border border-border/30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-primary/20 flex-shrink-0">
            <AvatarImage src={authorAvatar || ''} alt={authorName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm font-medium">
              {getAuthorInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm sm:text-base text-foreground truncate">{authorName}</span>
              {authorNickname && (
                <span className="text-xs sm:text-sm text-muted-foreground truncate">"{authorNickname}"</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Publicando como: <span className="font-medium">
                  {authorType === 'admin' && postAsAdmin ? 'News (Oficial)' : 
                   authorType === 'fighter' ? 'Luchador' : 
                   authorType === 'admin' ? 'Mi Perfil' : 'Usuario'}
                </span>
              </span>
              {authorType === 'admin' && postAsAdmin && (
                <Badge variant="secondary" className="text-xs">Oficial</Badge>
              )}
              {authorType === 'fighter' && (
                <Badge variant="default" className="text-xs">Fighter</Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Toggle for admins with fighter profile */}
        {canToggleAuthor && onToggleAuthor && (
          <div className="flex items-center gap-1 sm:gap-2 text-sm flex-shrink-0">
            <Button
              type="button"
              variant={postAsAdmin ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleAuthor(true)}
              className="h-7 text-xs px-2 sm:px-3"
            >
              News
            </Button>
            <Button
              type="button"
              variant={!postAsAdmin ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleAuthor(false)}
              className="h-7 text-xs px-2 sm:px-3"
            >
              Mi Perfil
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Content textarea */}
        <div className="space-y-2">
          <Textarea
            placeholder="¿Qué está pasando en tu entrenamiento?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] sm:min-h-[100px] resize-none border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 p-0"
            maxLength={2000}
          />
          {content.length > 0 && (
            <div className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </div>
          )}
        </div>

        {/* File previews */}
        {filePreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {filePreviews.map((item, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden border border-border/50">
                {item.type === 'image' ? (
                  <img 
                    src={item.preview} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted flex items-center justify-center">
                    <Video className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white min-h-[32px] touch-manipulation"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Media URLs */}
        {mediaUrls.length > 0 && (
          <div className="space-y-3">
            {mediaUrls.map((url, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden border border-border/50">
                <img
                  src={url}
                  alt="Preview"
                  className="w-full max-h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImageUrl(index)}
                  className="absolute top-1 right-1 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white min-h-[32px] touch-manipulation"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Media upload section - optional */}
        {showMediaUpload && (
          <div className="space-y-3 p-3 sm:p-4 border border-border/50 rounded-lg">
            {/* File upload */}
            {mediaFiles.length < 4 && (
              <div>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  accept="image/*,video/*"
                  maxSize={100}
                  autoResize={true}
                  resizeOptions={{ maxWidth: 1920, maxHeight: 1920, quality: 0.85 }}
                  showResizeInfo={false}
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Máx. 4 archivos • Imágenes hasta 10MB, Videos hasta 100MB
                </p>
              </div>
            )}

            {/* Add image URL */}
            <div className="flex gap-2">
              <Input
                placeholder="O pega una URL de imagen"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
                className="flex-1 text-sm sm:text-base"
              />
              <Button
                type="button"
                onClick={addImageUrl}
                size="sm"
                disabled={!newImageUrl.trim()}
                className="min-h-[44px] touch-manipulation"
              >
                Agregar
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowMediaUpload(false)}
              className="w-full min-h-[44px] touch-manipulation"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/30">
          {!showMediaUpload && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowMediaUpload(true)}
              size="sm"
              className="text-muted-foreground hover:text-foreground justify-start sm:justify-center min-h-[44px] touch-manipulation"
            >
              <ImagePlus className="h-5 w-5 mr-2" />
              Agregar Foto/Video
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            size="sm"
            className="px-6 w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            {loading || isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar'
            )}
          </Button>
        </div>
      </form>
     </div>
  );
}