import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingHashtag {
  hashtag: string;
  count: number;
  period: string;
}

export function useHashtags() {
  const [trending, setTrending] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrending = async (limit = 10) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('trending_hashtags')
        .select('*')
        .eq('period', new Date().toISOString().split('T')[0])
        .order('count', { ascending: false })
        .limit(limit);

      if (data) {
        setTrending(data);
      }
    } catch (err) {
      console.error('[TRENDING HASHTAGS ERROR]:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchByHashtag = async (hashtag: string) => {
    try {
      // Get posts with this hashtag
      const { data: hashtagPosts } = await supabase
        .from('post_hashtags')
        .select('post_id')
        .eq('hashtag', hashtag.toLowerCase());

      if (!hashtagPosts || hashtagPosts.length === 0) {
        return [];
      }

      const postIds = hashtagPosts.map(h => h.post_id);

      // Get full post data
      const { data: posts } = await supabase
        .from('social_posts')
        .select('*')
        .in('id', postIds)
        .eq('active', true)
        .order('created_at', { ascending: false });

      return posts || [];
    } catch (err) {
      console.error('[SEARCH HASHTAG ERROR]:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchTrending();

    // Subscribe to trending updates
    const channel = supabase
      .channel('trending-hashtags')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trending_hashtags'
        },
        () => {
          fetchTrending();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    trending,
    loading,
    searchByHashtag,
    refetch: fetchTrending
  };
}