import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Newspaper, MessageSquare, Image as ImageIcon, Video, Star, ExternalLink } from 'lucide-react';
import { SocialPost } from '@/hooks/useSocialPosts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import CommentSection from './CommentSection';
import LinkPreview from './LinkPreview';
import { useLinkPreview } from '@/hooks/useLinkPreview';
import { extractLinks, parseContent } from '@/lib/textParser';

interface PostCardProps {
  post: SocialPost;
  onLike: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isOwner?: boolean;
  showFriendBadge?: boolean; // NEW: Show friend badge
}

export default function PostCard({ post, onLike, onDelete, isOwner, showFriendBadge = true }: PostCardProps) {
  const [imageError, setImageError] = useState<Set<string>>(new Set());
  const [mediaFiles, setMediaFiles] = useState<Array<{ url: string; type: 'image' | 'video' }>>([]);
  const [linkPreviews, setLinkPreviews] = useState<Map<string, any>>(new Map());
  const { user } = useAuth();
  const { fetchMultiplePreviews } = useLinkPreview();

  // Load media files from storage
  useEffect(() => {
    const loadMediaFiles = async () => {
      if (post.media_files && Array.isArray(post.media_files)) {
        const files = await Promise.all(
          post.media_files.map(async (file: any) => {
            const { data } = supabase.storage
              .from('social-media')
              .getPublicUrl(file.path);
            
            return {
              url: data.publicUrl,
              type: file.type || 'image'
            };
          })
        );
        setMediaFiles(files);
      }
    };

    loadMediaFiles();
  }, [post.media_files]);

  // Load link previews for URLs in content
  useEffect(() => {
    const loadLinkPreviews = async () => {
      const links = extractLinks(post.content);
      if (links.length > 0) {
        const urls = links.map(l => l.url);
        const previews = await fetchMultiplePreviews(urls);
        setLinkPreviews(previews);
      }
    };

    loadLinkPreviews();
  }, [post.content]);

  const getAuthorInitials = () => {
    return post.author_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';
  };

  const getPostTypeColor = () => {
    switch (post.post_type) {
      case 'news': return 'bg-blue-500';
      case 'image': return 'bg-green-500';
      case 'video': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const handleImageError = (url: string) => {
    setImageError(prev => new Set([...prev, url]));
  };

  // Parse content with mentions, hashtags, and links
  const parseContentWithFormatting = (content: string) => {
    const parsed = parseContent(content);
    const elements: Array<{ type: string; content: string; start: number; end: number }> = [];

    // Collect all special elements
    parsed.mentions.forEach(m => {
      elements.push({ type: 'mention', content: m.username, start: m.startIndex, end: m.endIndex });
    });
    parsed.hashtags.forEach(h => {
      elements.push({ type: 'hashtag', content: h.tag, start: h.startIndex, end: h.endIndex });
    });
    parsed.links.forEach(l => {
      elements.push({ type: 'link', content: l.url, start: l.startIndex, end: l.endIndex });
    });

    // Sort by position
    elements.sort((a, b) => a.start - b.start);

    // Build JSX
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    elements.forEach((element, idx) => {
      // Add text before element
      if (element.start > lastIndex) {
        result.push(content.substring(lastIndex, element.start));
      }

      // Add formatted element
      if (element.type === 'mention') {
        result.push(
          <span key={`mention-${idx}`} className="text-primary font-medium">
            @{element.content}
          </span>
        );
      } else if (element.type === 'hashtag') {
        result.push(
          <span key={`hashtag-${idx}`} className="text-primary font-medium">
            #{element.content}
          </span>
        );
      } else if (element.type === 'link') {
        result.push(
          <a
            key={`link-${idx}`}
            href={element.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline inline-flex items-center gap-1 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {element.content.length > 50 ? `${element.content.slice(0, 50)}...` : element.content}
            <ExternalLink className="h-3 w-3 inline" />
          </a>
        );
      }

      lastIndex = element.end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      result.push(content.substring(lastIndex));
    }

    return result;
  };

  return (
    <Card className="border-border/50 bg-card">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={post.author_avatar || ''} 
                alt={post.author_name}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                {getAuthorInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">
                  {post.author_name}
                </h3>
                {post.author_nickname && (
                  <span className="text-muted-foreground text-sm truncate">
                    @{post.author_nickname}
                  </span>
                )}
                {post.author_type === 'fighter' && showFriendBadge && post.is_friend && (
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                    👥 Amigo
                  </Badge>
                )}
                {post.author_type === 'admin' && (
                  <Badge variant="secondary" className="text-xs">
                    Oficial
                  </Badge>
                )}
                {post.featured && (
                  <Badge variant="default" className="text-xs flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Destacado
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true,
                  locale: es 
                })}
              </p>
            </div>
          </div>

          {(isOwner || user) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </DropdownMenuItem>
                {isOwner && onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(post.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content with mentions, hashtags, and links */}
        <div className="space-y-3">
          <div className="text-foreground leading-relaxed whitespace-pre-wrap">
            {parseContentWithFormatting(post.content)}
          </div>

          {/* Link Previews */}
          {linkPreviews.size > 0 && (
            <div className="space-y-2">
              {Array.from(linkPreviews.values()).map((preview, index) => (
                <LinkPreview key={index} preview={preview} />
              ))}
            </div>
          )}

          {/* Media from uploaded files */}
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border border-border/30">
                  {media.type === 'video' ? (
                    <video
                      src={media.url}
                      controls
                      className="w-full max-h-96 object-cover"
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt={`Media ${index + 1}`}
                      className="w-full max-h-96 object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Media from URLs */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="space-y-2">
              {post.media_urls.map((url, index) => {
                if (imageError.has(url)) return null;
                
                return (
                  <div key={index} className="relative rounded-lg overflow-hidden border border-border/30">
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="w-full max-h-96 object-cover"
                      onError={() => handleImageError(url)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-border/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike(post.id)}
                className={`flex items-center space-x-2 h-8 px-2 ${
                  post.is_liked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Heart 
                  className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} 
                />
                <span className="text-sm">{post.likes_count}</span>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {post.post_type === 'news' && <><Newspaper className="h-3 w-3" /> Noticia</>}
              {post.post_type === 'text' && <><MessageSquare className="h-3 w-3" /> Post</>}
              {post.post_type === 'image' && <><ImageIcon className="h-3 w-3" /> Imagen</>}
              {post.post_type === 'video' && <><Video className="h-3 w-3" /> Video</>}
            </div>
          </div>

          {/* Comments Section */}
          <CommentSection postId={post.id} />
        </div>
      </CardContent>
    </Card>
  );
}