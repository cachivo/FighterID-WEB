import { Card } from '@/components/ui/card';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { LinkPreview as LinkPreviewType } from '@/hooks/useLinkPreview';

interface LinkPreviewProps {
  preview: LinkPreviewType;
  onClick?: () => void;
}

export default function LinkPreview({ preview, onClick }: LinkPreviewProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.open(preview.url, '_blank', 'noopener,noreferrer');
    }
  };

  // YouTube embed
  if (preview.embed_type === 'youtube' && preview.embed_html) {
    return (
      <Card className="overflow-hidden border-border/50 bg-card/50">
        <div
          className="aspect-video w-full"
          dangerouslySetInnerHTML={{ __html: preview.embed_html }}
        />
      </Card>
    );
  }

  // Generic link preview
  return (
    <Card
      className="overflow-hidden border-border/50 bg-card/50 cursor-pointer hover:bg-card/70 transition-colors"
      onClick={handleClick}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        {preview.image_url && (
          <div className="w-full sm:w-32 h-48 sm:h-32 shrink-0 relative bg-muted">
            <img
              src={preview.image_url}
              alt={preview.title || 'Link preview'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 min-w-0">
          <div className="space-y-1 sm:space-y-1.5">
            {preview.site_name && (
              <p className="text-xs text-muted-foreground truncate">
                {preview.site_name}
              </p>
            )}
            {preview.title && (
              <h4 className="font-medium text-sm line-clamp-2 text-foreground">
                {preview.title}
              </h4>
            )}
            {preview.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {preview.description}
              </p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
              <ExternalLink className="h-3 w-3" />
              <span className="truncate">{new URL(preview.url).hostname}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}