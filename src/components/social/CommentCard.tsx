import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2 } from 'lucide-react';
import { Comment } from '@/hooks/useComments';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommentCardProps {
  comment: Comment;
  onDelete: (commentId: string) => void;
}

export default function CommentCard({ comment, onDelete }: CommentCardProps) {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      if (!user) return;

      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      setIsOwner(appUser?.id === comment.user_id);
    };

    checkOwnership();
  }, [user, comment.user_id]);

  const getInitials = () => {
    return comment.author_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';
  };

  return (
    <Card className="bg-muted/30 border-border/30">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author_avatar || ''} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-sm truncate">
                  {comment.author_name}
                </span>
                {comment.author_handle && (
                  <span className="text-xs text-muted-foreground truncate">
                    @{comment.author_handle}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  •
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: es
                  })}
                </span>
              </div>

              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(comment.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}