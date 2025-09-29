import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Newspaper, MessageSquare, Image as ImageIcon, Video, Star } from 'lucide-react';
import { SocialPost } from '@/hooks/useSocialPosts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface PostCardProps {
  post: SocialPost;
  onLike: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isOwner?: boolean;
}

export default function PostCard({ post, onLike, onDelete, isOwner }: PostCardProps) {
  const [imageError, setImageError] = useState<Set<string>>(new Set());
  const { user } = useAuth();

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

        {/* Content */}
        <div className="space-y-3">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Media */}
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
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
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

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground h-8 px-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{post.comments_count}</span>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {post.post_type === 'news' && <><Newspaper className="h-3 w-3" /> Noticia</>}
            {post.post_type === 'text' && <><MessageSquare className="h-3 w-3" /> Post</>}
            {post.post_type === 'image' && <><ImageIcon className="h-3 w-3" /> Imagen</>}
            {post.post_type === 'video' && <><Video className="h-3 w-3" /> Video</>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}