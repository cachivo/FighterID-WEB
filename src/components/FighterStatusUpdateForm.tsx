import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageIcon, Send, X } from 'lucide-react';
import { useFighterUpdates } from '@/hooks/useFighterUpdates';

interface FighterUpdateFormProps {
  fighterId: string;
  onUpdateCreated?: () => void;
}

export default function FighterUpdateForm({ fighterId, onUpdateCreated }: FighterUpdateFormProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const { createUpdate, loading } = useFighterUpdates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }

    try {
      await createUpdate(fighterId, {
        content: content.trim(),
        image_url: imageUrl.trim() || undefined
      });
      
      // Reset form
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      
      // Notify parent component
      onUpdateCreated?.();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error creating update:', error);
    }
  };

  const characterCount = content.length;
  const maxCharacters = 500;
  const isOverLimit = characterCount > maxCharacters;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Publicar Actualización
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="¿Qué está pasando en tu entrenamiento? Comparte una actualización con tus fans..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-24 resize-none"
              disabled={loading}
            />
            <div className="flex items-center justify-between text-sm">
              <div className={`text-muted-foreground ${isOverLimit ? 'text-destructive' : ''}`}>
                {characterCount}/{maxCharacters} caracteres
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImageInput(!showImageInput)}
                className="flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                {showImageInput ? 'Ocultar imagen' : 'Agregar imagen'}
              </Button>
            </div>
          </div>

          {showImageInput && (
            <div className="space-y-2">
              <Label htmlFor="image-url">URL de imagen (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setImageUrl('');
                    setShowImageInput(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {imageUrl && (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Vista previa"
                className="w-full max-w-sm h-32 object-cover rounded-md border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || !content.trim() || isOverLimit}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}