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
  author_nickname?: string;
  author_avatar?: string;
  author_record_type?: string;
  author_discipline?: string;
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
      console.log('[COMMENTS] 🔍 Fetching comments for post:', postId);

      // Use RPC function to get comments with author info in one call
      const { data, error } = await supabase
        .rpc('get_post_comments_with_author', { p_post_id: postId });

      console.log('[COMMENTS] 📦 RPC Response:', { data, error });

      if (error) {
        console.error('[COMMENTS] ❌ RPC Error:', error);
        throw error;
      }

      console.log('[COMMENTS] ✅ Raw data from RPC:', data);

      // Map RPC result to Comment interface
      const enriched: Comment[] = (data || []).map((c: any) => {
        console.log('[COMMENTS] 👤 Processing comment:', {
          id: c.id,
          author_name: c.author_name,
          author_nickname: c.author_nickname,
          author_avatar: c.author_avatar,
          author_record_type: c.author_record_type,
          author_discipline: c.author_discipline
        });
        
        return {
          id: c.id,
          post_id: c.post_id,
          user_id: c.user_id,
          content: c.content,
          active: c.active,
          created_at: c.created_at,
          updated_at: c.updated_at,
          author_name: c.author_name,
          author_nickname: c.author_nickname,
          author_avatar: c.author_avatar,
          author_record_type: c.author_record_type,
          author_discipline: c.author_discipline,
        };
      });

      console.log('[COMMENTS] 🎉 Final enriched comments:', enriched);
      setComments(enriched);

    } catch (err: any) {
      console.error('[COMMENTS ERROR] 💥:', err);
      setError(err.message);
      setComments([]);
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
        .eq('auth_user_id', user.id).maybeSingle();

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