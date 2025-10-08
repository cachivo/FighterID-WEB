import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SocialPost {
  id: string;
  author_id: string;
  author_type: 'fighter' | 'admin' | 'user';
  content: string;
  media_urls: string[] | null;
  media_files?: any[] | null;
  post_type: 'text' | 'image' | 'video' | 'news';
  likes_count: number;
  comments_count: number;
  active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  author_name?: string;
  author_nickname?: string;
  author_avatar?: string;
  is_liked?: boolean;
  is_friend?: boolean; // NEW: Indicates if the author is a friend
}

export interface CreatePostData {
  content: string;
  media_urls?: string[];
  media_files?: File[];
  post_type?: 'text' | 'image' | 'video' | 'news';
}

export function useSocialPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPosts = async (limit = 20, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[SOCIAL POSTS] Fetching posts...');
      
      // Get current user's friends list (if authenticated)
      let friendIds: string[] = [];
      if (user) {
        const { data: appUser } = await supabase
          .from('app_user')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (appUser) {
          const { data: friendships } = await supabase
            .from('friendships')
            .select('friend_id')
            .eq('user_id', appUser.id);

          friendIds = friendships?.map(f => f.friend_id) || [];
          console.log('[SOCIAL POSTS] Friend IDs:', friendIds);
        }
      }
      
      // Get posts first
      const { data: postsData, error: postsError } = await supabase
        .from('social_posts')
        .select('*')
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) throw postsError;
      
      console.log(`[SOCIAL POSTS] Fetched ${postsData?.length || 0} posts`, postsData);

      // Get fighter info for fighter posts
      const fighterPosts = postsData?.filter(p => p.author_type === 'fighter') || [];
      let fighterProfiles: any[] = [];
      
      if (fighterPosts.length > 0) {
        const { data: profiles } = await supabase
          .from('fighter_profiles')
          .select('id, first_name, last_name, nickname, avatar_url')
          .in('id', fighterPosts.map(p => p.author_id));
        
        fighterProfiles = profiles || [];
      }

      // Get user info for user posts
      const userPosts = postsData?.filter(p => p.author_type === 'user') || [];
      let userProfiles: any[] = [];
      
      if (userPosts.length > 0) {
        const { data: profiles } = await supabase
          .from('app_user')
          .select('id, first_name, last_name, handle, avatar_url, email')
          .in('id', userPosts.map(p => p.author_id));
        
        userProfiles = profiles || [];
      }

      // Get likes for current user if authenticated
      let likesData: any[] = [];
      if (user && postsData?.length) {
        const { data: userLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', postsData.map(p => p.id));
        
        likesData = userLikes || [];
      }

      const enrichedPosts: SocialPost[] = postsData?.map(post => {
        const fighterProfile = fighterProfiles.find(fp => fp.id === post.author_id);
        const userProfile = userProfiles.find(up => up.id === post.author_id);
        
        return {
          ...post,
          media_files: post.media_files ? (Array.isArray(post.media_files) ? post.media_files : null) : null,
          author_type: post.author_type as 'fighter' | 'admin' | 'user',
          post_type: post.post_type as 'text' | 'image' | 'video' | 'news',
          author_name: post.author_type === 'fighter' 
            ? `${fighterProfile?.first_name || ''} ${fighterProfile?.last_name || ''}`.trim() || 'Peleador'
            : post.author_type === 'user'
            ? userProfile?.first_name || userProfile?.handle || userProfile?.email?.split('@')[0] || 'Usuario'
            : 'News',
          author_nickname: post.author_type === 'fighter' ? fighterProfile?.nickname : userProfile?.handle,
          author_avatar: post.author_type === 'fighter' 
            ? fighterProfile?.avatar_url 
            : post.author_type === 'user'
            ? userProfile?.avatar_url
            : '/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png',
          is_liked: likesData.some(like => like.post_id === post.id),
          is_friend: friendIds.includes(post.author_id) // Check if author is friend
        };
      }) || [];

      console.log(`[SOCIAL POSTS] Enriched ${enrichedPosts.length} posts`);

      if (offset === 0) {
        setPosts(enrichedPosts);
      } else {
        setPosts(prev => [...prev, ...enrichedPosts]);
      }

    } catch (err) {
      console.error('[SOCIAL POSTS ERROR]:', err);
      setError('Error al cargar los posts');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: CreatePostData, authorType: 'fighter' | 'admin' | 'user', authorId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para crear posts');
      return null;
    }

    console.log('🚀 [CREATE POST] Starting post creation:', { 
      authorType, 
      authorId, 
      user: user.id,
      contentLength: postData.content.length,
      hasMedia: !!postData.media_files?.length || !!postData.media_urls?.length
    });

    try {
      setLoading(true);
      
      // 1. VALIDATE: Check app_user exists
      const { data: appUser, error: userError } = await supabase
        .from('app_user')
        .select('id, is_admin, email')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !appUser) {
        console.error('❌ [CREATE POST] app_user not found:', userError);
        toast.error('Error: No se encontró el perfil de usuario. Por favor, cierra sesión y vuelve a iniciar.');
        return null;
      }

      console.log('✅ [CREATE POST] app_user validated:', appUser);

      // 2. VALIDATE: Check author_id matches expected type
      if (authorType === 'fighter') {
        const { data: fighterProfile, error: fighterError } = await supabase
          .from('fighter_profiles')
          .select('id, first_name, last_name, user_id')
          .eq('id', authorId)
          .single();

        if (fighterError || !fighterProfile) {
          console.error('❌ [CREATE POST] Fighter profile not found:', fighterError);
          toast.error('Error: No se encontró el perfil de luchador');
          return null;
        }

        console.log('✅ [CREATE POST] Fighter profile validated:', fighterProfile);
      } else if (authorType === 'admin') {
        if (!appUser.is_admin) {
          console.error('❌ [CREATE POST] User is not admin');
          toast.error('Error: No tienes permisos de administrador');
          return null;
        }
        console.log('✅ [CREATE POST] Admin status validated');
      } else if (authorType === 'user') {
        if (appUser.id !== authorId) {
          console.error('❌ [CREATE POST] Author ID mismatch:', { appUserId: appUser.id, authorId });
          toast.error('Error: ID de autor no coincide');
          return null;
        }
        console.log('✅ [CREATE POST] User ID validated');
      }

      let uploadedFiles: any[] = [];

      // 3. Upload files to storage if any
      if (postData.media_files && postData.media_files.length > 0) {
        console.log(`📤 [CREATE POST] Uploading ${postData.media_files.length} files...`);

        for (const file of postData.media_files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `${appUser.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('social-media')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          uploadedFiles.push({
            path: filePath,
            type: file.type.startsWith('image/') ? 'image' : 'video'
          });
        }
      }

      // 4. Determine post type
      const postType = postData.post_type || 
        (uploadedFiles.some(f => f.type === 'video') ? 'video' : 
         ((postData.media_urls && postData.media_urls.length > 0) || uploadedFiles.length > 0) ? 'image' : 'text');

      const postPayload = {
        author_id: authorId,
        author_type: authorType,
        content: postData.content,
        media_urls: postData.media_urls || null,
        media_files: uploadedFiles.length > 0 ? uploadedFiles : null,
        post_type: postType
      };

      console.log('📝 [CREATE POST] Inserting post with payload:', postPayload);

      const { data, error } = await supabase
        .from('social_posts')
        .insert([postPayload])
        .select()
        .single();

      if (error) {
        console.error('❌ [CREATE POST] Insert failed:', error);
        
        // Check if it's an RLS policy error
        if (error.code === '42501' || error.message?.includes('policy')) {
          console.error('🔒 [CREATE POST] RLS POLICY ERROR - Details:', {
            code: error.code,
            message: error.message,
            hint: error.hint,
            details: error.details,
            authorType,
            authorId,
            userId: user.id
          });
          
          toast.error(
            'Error de permisos: No tienes autorización para crear este tipo de post. ' +
            'Por favor verifica tu perfil o contacta al administrador.'
          );
        } else {
          toast.error(`Error al crear post: ${error.message}`);
        }
        
        throw error;
      }

      console.log('✅ [CREATE POST] Post created successfully:', data.id);

      // Insert media metadata if files were uploaded
      if (uploadedFiles.length > 0 && data) {
        const mediaRecords = uploadedFiles.map(file => ({
          post_id: data.id,
          file_path: file.path,
          file_type: file.type,
          file_size: 0,
          mime_type: file.type === 'image' ? 'image/jpeg' : 'video/mp4'
        }));

        await supabase
          .from('post_media')
          .insert(mediaRecords);
      }

      toast.success('¡Post publicado exitosamente!');
      fetchPosts(); // Refresh posts
      return data;
    } catch (err: any) {
      console.error('❌ [CREATE POST] Fatal error:', err);
      
      // Only show generic error if we haven't shown specific one
      if (!err.code || err.code !== '42501') {
        toast.error('Error inesperado al crear el post. Revisa la consola para más detalles.');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para dar like');
      return;
    }

    try {
      // Get current user's app_user record
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!appUser) {
        toast.error('Usuario no encontrado');
        return;
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', appUser.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert([{
            post_id: postId,
            user_id: appUser.id
          }]);
      }

      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              likes_count: existingLike ? post.likes_count - 1 : post.likes_count + 1,
              is_liked: !existingLike
            }
          : post
      ));

    } catch (err) {
      console.error('Error toggling like:', err);
      toast.error('Error al dar like');
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('social_posts')
        .update({ active: false })
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Post eliminado');
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Error al eliminar el post');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchFriendsPosts = async (limit = 20, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) {
        console.log('[FRIENDS POSTS] No user authenticated');
        return;
      }

      // Get current user's app_user id
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!appUser) {
        console.log('[FRIENDS POSTS] No app_user found');
        return;
      }

      // Get list of friends IDs
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', appUser.id);

      const friendIds = friendships?.map(f => f.friend_id) || [];
      
      console.log('[FRIENDS POSTS] Friend IDs:', friendIds);

      if (friendIds.length === 0) {
        console.log('[FRIENDS POSTS] No friends found');
        setPosts([]);
        return;
      }

      // Fetch posts from friends
      const { data: postsData, error: postsError } = await supabase
        .from('social_posts')
        .select('*')
        .eq('active', true)
        .in('author_id', friendIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) throw postsError;
      
      console.log(`[FRIENDS POSTS] Fetched ${postsData?.length || 0} posts from friends`);

      // Get fighter info for fighter posts
      const fighterPosts = postsData?.filter(p => p.author_type === 'fighter') || [];
      let fighterProfiles: any[] = [];
      
      if (fighterPosts.length > 0) {
        const { data: profiles } = await supabase
          .from('fighter_profiles')
          .select('id, first_name, last_name, nickname, avatar_url')
          .in('id', fighterPosts.map(p => p.author_id));
        
        fighterProfiles = profiles || [];
      }

      // Get user info for user posts
      const userPosts = postsData?.filter(p => p.author_type === 'user') || [];
      let userProfiles: any[] = [];
      
      if (userPosts.length > 0) {
        const { data: profiles } = await supabase
          .from('app_user')
          .select('id, first_name, last_name, handle, avatar_url, email')
          .in('id', userPosts.map(p => p.author_id));
        
        userProfiles = profiles || [];
      }

      // Get likes for current user
      let likesData: any[] = [];
      if (postsData?.length) {
        const { data: userLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', postsData.map(p => p.id));
        
        likesData = userLikes || [];
      }

      const enrichedPosts: SocialPost[] = postsData?.map(post => {
        const fighterProfile = fighterProfiles.find(fp => fp.id === post.author_id);
        const userProfile = userProfiles.find(up => up.id === post.author_id);
        
        return {
          ...post,
          media_files: post.media_files ? (Array.isArray(post.media_files) ? post.media_files : null) : null,
          author_type: post.author_type as 'fighter' | 'admin' | 'user',
          post_type: post.post_type as 'text' | 'image' | 'video' | 'news',
          author_name: post.author_type === 'fighter' 
            ? `${fighterProfile?.first_name || ''} ${fighterProfile?.last_name || ''}`.trim() || 'Peleador'
            : post.author_type === 'user'
            ? userProfile?.first_name || userProfile?.handle || userProfile?.email?.split('@')[0] || 'Usuario'
            : 'News',
          author_nickname: post.author_type === 'fighter' ? fighterProfile?.nickname : userProfile?.handle,
          author_avatar: post.author_type === 'fighter' 
            ? fighterProfile?.avatar_url 
            : post.author_type === 'user'
            ? userProfile?.avatar_url
            : '/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png',
          is_liked: likesData.some(like => like.post_id === post.id),
          is_friend: true // All posts from this fetch are from friends
        };
      }) || [];

      console.log(`[FRIENDS POSTS] Enriched ${enrichedPosts.length} posts`);

      if (offset === 0) {
        setPosts(enrichedPosts);
      } else {
        setPosts(prev => [...prev, ...enrichedPosts]);
      }

    } catch (err) {
      console.error('[FRIENDS POSTS ERROR]:', err);
      setError('Error al cargar posts de amigos');
    } finally {
      setLoading(false);
    }
  };

  return {
    posts,
    loading,
    error,
    fetchPosts,
    fetchFriendsPosts,
    createPost,
    toggleLike,
    deletePost
  };
}