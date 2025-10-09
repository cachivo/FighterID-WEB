import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  author_name?: string;
  author_avatar?: string;
  author_handle?: string;
}

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchComments = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[COMMENTS] Fetching comments for post:', postId);

      // Get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('active', true)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Get author info for each comment
      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        
        const { data: users } = await supabase
          .from('app_user')
          .select('id, first_name, last_name, handle, avatar_url, email')
          .in('id', userIds);

        const enriched: Comment[] = commentsData.map(comment => {
          const author = users?.find(u => u.id === comment.user_id);
          return {
            ...comment,
            author_name: author?.first_name || author?.handle || author?.email?.split('@')[0] || 'Usuario',
            author_avatar: author?.avatar_url,
            author_handle: author?.handle
          };
        });

        setComments(enriched);
      } else {
        setComments([]);
      }

    } catch (err: any) {
      console.error('[COMMENTS ERROR]:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (content: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para comentar');
      return null;
    }

    try {
      // Get user's app_user id
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!appUser) {
        toast.error('Usuario no encontrado');
        return null;
      }

      const { data, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_id: appUser.id,
          content: content.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Comentario publicado');
      await fetchComments(); // Refresh comments
      
      return data;
    } catch (err: any) {
      console.error('[CREATE COMMENT ERROR]:', err);
      toast.error('Error al publicar comentario');
      return null;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ active: false })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comentario eliminado');
    } catch (err: any) {
      console.error('[DELETE COMMENT ERROR]:', err);
      toast.error('Error al eliminar comentario');
    }
  };

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  return {
    comments,
    loading,
    error,
    createComment,
    deleteComment,
    refetch: fetchComments
  };
}