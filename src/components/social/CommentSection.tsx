import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageCircle } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import CommentCard from './CommentCard';

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { comments, loading, createComment, deleteComment } = useComments(postId);
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await createComment(newComment);
    setNewComment('');
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
  };

  return (
    <div className="space-y-3">
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="w-full justify-start text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {comments.length} {comments.length === 1 ? 'Comentario' : 'Comentarios'}
      </Button>

      {showComments && (
        <div className="space-y-3 pt-2">
          {/* Comment form */}
          {user && (
            <form onSubmit={handleSubmit} className="space-y-2">
              <Textarea
                placeholder="Escribe un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {newComment.length}/500
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    'Comentar'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Comments list */}
          {loading && comments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-2">
              {comments.map(comment => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay comentarios aún. ¡Sé el primero en comentar!
            </p>
          )}
        </div>
      )}
    </div>
  );
}