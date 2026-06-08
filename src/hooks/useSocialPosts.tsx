import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { parseContent } from '@/lib/textParser';

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
  author_record_type?: string | null;
  author_discipline?: string | null;
  is_liked?: boolean;
  is_friend?: boolean; // NEW: Indicates if the author is a friend
}

export interface CreatePostData {
  content: string;
  media_urls?: string[];
  media_files?: File[];
  post_type?: 'text' | 'image' | 'video' | 'news';
}

// Helper to get display name for user
const getUserDisplayName = (userProfile: any): string => {
  if (userProfile.first_name) {
    return userProfile.last_name 
      ? `${userProfile.first_name} ${userProfile.last_name}` 
      : userProfile.first_name;
  }
  if (userProfile.handle && !userProfile.handle.includes('@')) {
    return userProfile.handle;
  }
  if (userProfile.email) {
    return userProfile.email.split('@')[0];
  }
  return 'Usuario';
};

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
          .maybeSingle();

        if (appUser) {
          const { data: friendships } = await supabase
            .from('friendships')
            .select('friend_id')
            .eq('user_id', appUser.id);

          friendIds = friendships?.map(f => f.friend_id) || [];
          console.log('[SOCIAL POSTS] Friend IDs:', friendIds);
        }
      }
      
      // Get posts first - ordered by newest first
      const { data: postsData, error: postsError } = await supabase
        .from('social_posts')
        .select('*')
        .eq('active', true)
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
          .select('id, first_name, last_name, nickname, avatar_url, record_type, discipline')
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
            ? getUserDisplayName(userProfile)
            : 'News',
          author_nickname: post.author_type === 'fighter' ? fighterProfile?.nickname : userProfile?.handle,
          author_avatar: post.author_type === 'fighter' 
            ? fighterProfile?.avatar_url 
            : post.author_type === 'user'
            ? userProfile?.avatar_url
            : '/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png',
          author_record_type: post.author_type === 'fighter' ? fighterProfile?.record_type : null,
          author_discipline: post.author_type === 'fighter' ? fighterProfile?.discipline : null,
          is_liked: likesData.some(like => like.post_id === post.id),
          is_friend: friendIds.includes(post.author_id) // Check if author is friend
        };
      }) || [];

      console.log(`[SOCIAL POSTS] Enriched ${enrichedPosts.length} posts`);

      // Sort in memory by created_at DESC to ensure consistency
      const sortedPosts = enrichedPosts.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      if (offset === 0) {
        // Preserve optimistic posts, replace with real ones
        setPosts(prev => {
          const optimisticPosts = prev.filter((p: any) => p.isOptimistic);
          console.log(`🔄 [FETCH POSTS] Preserving ${optimisticPosts.length} optimistic posts`);
          
          // Merge: real posts replace optimistic by id, keep optimistic if not found
          const realPostIds = new Set(sortedPosts.map(p => p.id));
          const keptOptimistic = optimisticPosts.filter((p: any) => !realPostIds.has(p.id));
          
          return [...keptOptimistic, ...sortedPosts];
        });
      } else {
        // Deduplicate by id when appending
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = sortedPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
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
        .maybeSingle();

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

      // Parse and save mentions and hashtags
      const parsed = parseContent(postData.content);
      
      // Save mentions
      if (parsed.mentions.length > 0) {
        console.log('💬 [CREATE POST] Saving mentions:', parsed.mentions);
        
        // For each mention, try to find the user
        for (const mention of parsed.mentions) {
          // Check if it's a fighter
          const { data: fighter } = await supabase
            .from('fighter_profiles')
            .select('id, user_id')
            .or(`nickname.ilike.${mention.username}`)
            .single();

          if (fighter) {
            await supabase
              .from('post_mentions')
              .insert({
                post_id: data.id,
                mentioned_user_id: fighter.id,
                mentioned_user_type: 'fighter'
              });
            continue;
          }

          // Check if it's a regular user
          const { data: regularUser } = await supabase
            .from('app_user')
            .select('id')
            .or(`handle.ilike.${mention.username}`)
            .single();

          if (regularUser) {
            await supabase
              .from('post_mentions')
              .insert({
                post_id: data.id,
                mentioned_user_id: regularUser.id,
                mentioned_user_type: 'user'
              });
          }
        }
      }

      // Save hashtags
      if (parsed.hashtags.length > 0) {
        console.log('🏷️ [CREATE POST] Saving hashtags:', parsed.hashtags);
        
        const hashtagRecords = parsed.hashtags.map(h => ({
          post_id: data.id,
          hashtag: h.tag.toLowerCase()
        }));

        await supabase
          .from('post_hashtags')
          .insert(hashtagRecords);
      }

      // Before creating optimistic update, fetch real user/fighter info
      let authorDisplayName = 'Usuario';
      let authorAvatar = null;
      let authorNickname = null;

      if (authorType === 'fighter') {
        const { data: fighter } = await supabase
          .from('fighter_profiles')
          .select('first_name, last_name, nickname, avatar_url')
          .eq('id', authorId)
          .single();
        
        if (fighter) {
          authorDisplayName = `${fighter.first_name} ${fighter.last_name}`.trim();
          authorAvatar = fighter.avatar_url;
          authorNickname = fighter.nickname;
        }
      } else if (authorType === 'user') {
        const { data: userProfile } = await supabase
          .from('app_user')
          .select('id, first_name, last_name, handle, avatar_url, email')
          .eq('id', authorId)
          .single();
        
        if (userProfile) {
          authorDisplayName = getUserDisplayName(userProfile);
          authorAvatar = userProfile.avatar_url;
          authorNickname = userProfile.handle;
        }
      } else if (authorType === 'admin') {
        authorDisplayName = 'News';
        authorAvatar = '/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png';
      }

      // OPTIMISTIC UPDATE: Agregar post localmente de inmediato con flag
      const newPost: SocialPost = {
        ...data,
        author_type: data.author_type as 'fighter' | 'admin' | 'user',
        post_type: data.post_type as 'text' | 'image' | 'video' | 'news',
        media_files: uploadedFiles.length > 0 ? uploadedFiles : null,
        author_name: authorDisplayName,
        author_nickname: authorNickname,
        author_avatar: authorAvatar,
        is_liked: false,
        is_friend: false,
        isOptimistic: true // Flag para identificar posts optimísticos
      } as any;
      
      console.log('✨ [CREATE POST] Adding optimistic post to feed');
      setPosts(prev => [newPost, ...prev]);
      toast.success('¡Post publicado exitosamente!');
      
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
        .eq('auth_user_id', user.id).maybeSingle();

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

  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      console.log('🗑️ [DELETE POST] Attempting to delete post:', postId);
      
      const { error } = await supabase
        .from('social_posts')
        .update({ active: false })
        .eq('id', postId);

      if (error) {
        console.error('❌ [DELETE POST] Database error:', error);
        
        // Check if it's an RLS policy error
        if (error.code === '42501' || error.message?.includes('policy')) {
          toast.error('Error de permisos: No tienes autorización para eliminar este post');
        } else {
          toast.error(`Error al eliminar el post: ${error.message}`);
        }
        
        return false;
      }

      console.log('✅ [DELETE POST] Post deleted successfully');
      
      // Optimistic UI update
      setPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Post eliminado');
      
      return true;
    } catch (err: any) {
      console.error('❌ [DELETE POST] Fatal error:', err);
      toast.error('Error inesperado al eliminar el post');
      return false;
    }
  };

  useEffect(() => {
    fetchPosts();
    // Realtime subscription moved to SocialFeed.tsx page level
  }, []);

  const fetchFriendsPosts = async (limit = 20, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) {
        console.log('[FRIENDS POSTS] No user authenticated');
        setPosts([]);
        return;
      }

      // Get current user's app_user id
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id).maybeSingle();

      if (!appUser) {
        console.log('[FRIENDS POSTS] No app_user found');
        setPosts([]);
        return;
      }

      // Get list of friends app_user IDs
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', appUser.id);

      const friendAppUserIds = friendships?.map(f => f.friend_id) || [];
      
      console.log('[FRIENDS POSTS] Friend app_user IDs:', friendAppUserIds);

      if (friendAppUserIds.length === 0) {
        console.log('[FRIENDS POSTS] No friends found');
        setPosts([]);
        return;
      }

      // Get fighter_profile IDs for friends who are fighters
      const { data: friendFighterProfiles } = await supabase
        .from('fighter_profiles')
        .select('id')
        .in('user_id', friendAppUserIds);

      const friendFighterIds = friendFighterProfiles?.map(fp => fp.id) || [];
      
      console.log('[FRIENDS POSTS] Friend fighter_profile IDs:', friendFighterIds);

      // Combine both app_user IDs and fighter_profile IDs
      const allFriendAuthorIds = [...friendAppUserIds, ...friendFighterIds];
      
      console.log('[FRIENDS POSTS] All friend author IDs:', allFriendAuthorIds);

      // Fetch posts from friends (both user posts and fighter posts)
      const { data: postsData, error: postsError } = await supabase
        .from('social_posts')
        .select('*')
        .eq('active', true)
        .in('author_id', allFriendAuthorIds)
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