import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BackButton } from '@/components/ui/back-button';
import { MessageCircle, TrendingUp, Users, Star, Plus, Globe, Rss, RefreshCw } from 'lucide-react';
import PostCard from '@/components/social/PostCard';
import CreatePostForm from '@/components/social/CreatePostForm';
import { NewsPostGenerator } from '@/components/social/NewsPostGenerator';
import { SocialSidebar } from '@/components/social/SocialSidebar';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useAuth } from '@/hooks/useAuth';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FriendSuggestions } from '@/components/social/FriendSuggestions';

export default function SocialFeed() {
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [postAsAdmin, setPostAsAdmin] = useState(true); // true = News, false = Fighter profile
  const { posts, loading, createPost, toggleLike, deletePost, fetchPosts, fetchFriendsPosts } = useSocialPosts();
  const { user } = useAuth();
  const { getUserFighterProfile } = useFighterProfiles();
  const [userFighter, setUserFighter] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appUser, setAppUser] = useState<any>(null);

  useEffect(() => {
    const checkUserType = async () => {
      if (user) {
        // Get app_user data
        const { data: appUserData } = await supabase
          .from('app_user')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        
        setAppUser(appUserData);
        setIsAdmin(appUserData?.is_admin || false);

        // Check if user has fighter profile
        const fighterProfile = await getUserFighterProfile();
        setUserFighter(fighterProfile);
      }
    };

    checkUserType();
  }, [user]);

  // Load posts based on active tab
  useEffect(() => {
    console.log('🔄 [SOCIAL FEED] Tab changed to:', activeTab);
    if (activeTab === 'friends') {
      fetchFriendsPosts();
    } else {
      fetchPosts();
    }
  }, [activeTab]);

  // Realtime subscription at page level, respects activeTab
  useEffect(() => {
    console.log('🔌 [SOCIAL FEED] Setting up realtime for tab:', activeTab);
    
    const channel = supabase
      .channel('social-posts-page-rt')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_posts'
        },
        (payload) => {
          console.log('📥 [REALTIME] Nuevo post detectado:', payload.new);
          // Refetch según tab actual
          if (activeTab === 'friends') {
            fetchFriendsPosts();
          } else {
            fetchPosts();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'social_posts'
        },
        (payload) => {
          console.log('📝 [REALTIME] Post actualizado:', payload.new);
          if (activeTab === 'friends') {
            fetchFriendsPosts();
          } else {
            fetchPosts();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 [SOCIAL FEED] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [activeTab, fetchPosts, fetchFriendsPosts]);

  const handleCreatePost = async (postData: any) => {
    console.log('🔍 [SOCIAL FEED] handleCreatePost iniciado');
    console.log('🔍 [SOCIAL FEED] user:', user?.id);
    console.log('🔍 [SOCIAL FEED] appUser:', appUser);
    console.log('🔍 [SOCIAL FEED] isAdmin:', isAdmin);
    console.log('🔍 [SOCIAL FEED] userFighter:', userFighter);
    console.log('🔍 [SOCIAL FEED] postAsAdmin:', postAsAdmin);
    
    if (!user || !appUser) {
      console.error('❌ [SOCIAL FEED] No user or appUser');
      toast.error('Debes iniciar sesión para publicar');
      return;
    }

    let authorType: 'admin' | 'fighter' | 'user';
    let authorId: string;

    if (isAdmin && postAsAdmin) {
      authorType = 'admin';
      authorId = appUser.id;
      console.log('📝 [SOCIAL FEED] Posteando como ADMIN:', authorId);
    } else if (userFighter) {
      authorType = 'fighter';
      authorId = userFighter.id;
      console.log('📝 [SOCIAL FEED] Posteando como FIGHTER:', authorId);
    } else {
      authorType = 'user';
      authorId = appUser.id;
      console.log('📝 [SOCIAL FEED] Posteando como USER:', authorId);
    }

    const result = await createPost(postData, authorType, authorId);
    
    if (result) {
      console.log('✅ [SOCIAL FEED] Post creado exitosamente');
      setShowCreateForm(false);
      
      // Refetch explícito basado en tab activo
      console.log('🔄 [SOCIAL FEED] Refetching feed para tab:', activeTab);
      if (activeTab === 'friends') {
        await fetchFriendsPosts();
      } else {
        await fetchPosts();
      }
    } else {
      console.error('❌ [SOCIAL FEED] Fallo al crear post');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'all') return true;
    if (activeTab === 'friends') return true; // Friends tab uses fetchFriendsPosts
    if (activeTab === 'news') return post.author_type === 'admin';
    if (activeTab === 'featured') return post.featured;
    return true;
  });

  const canCreatePost = user && appUser; // Any authenticated user can post

  const getAuthorInfo = () => {
    // Admin with fighter profile can choose
    if (isAdmin && userFighter && !postAsAdmin) {
      return {
        name: `${userFighter.first_name} ${userFighter.last_name}`,
        nickname: userFighter.nickname,
        avatar: userFighter.avatar_url,
        type: 'fighter' as const
      };
    } else if (isAdmin && postAsAdmin) {
      return {
        name: 'News',
        nickname: undefined,
        avatar: '/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png',
        type: 'admin' as const
      };
    } else if (userFighter) {
      return {
        name: `${userFighter.first_name} ${userFighter.last_name}`,
        nickname: userFighter.nickname,
        avatar: userFighter.avatar_url,
        type: 'fighter' as const
      };
    } else if (appUser) {
      // Regular user
      return {
        name: appUser.first_name || appUser.handle || appUser.email?.split('@')[0] || 'Usuario',
        nickname: appUser.handle,
        avatar: appUser.avatar_url,
        type: 'user' as const
      };
    }
    return null;
  };

  const authorInfo = getAuthorInfo();

  return (
    <div className="min-h-screen bg-background">
      {/* Background News Generator */}
      <NewsPostGenerator userType={userFighter ? "fighter" : isAdmin ? "admin" : "fan"} />
      
      {/* Optimized Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <img 
                  src="/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png" 
                  alt="Fighter ID" 
                  className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {userFighter ? 'Red Social de Peleadores' : 
                   isAdmin ? 'Panel Social Administrativo' : 'Comunidad Fighter ID'}
                </h1>
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <Rss className="h-3 w-3" />
                  <span>
                    {userFighter ? 'Noticias automáticas cada 30 min' : 
                     isAdmin ? 'Sistema de noticias inteligente activo' : 'Feed con noticias en tiempo real'}
                  </span>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  fetchPosts();
                  
                  // If admin, also fetch fresh news
                  if (isAdmin) {
                    try {
                      toast.info('Buscando noticias nuevas...');
                      const { error } = await supabase.functions.invoke('fetch-sports-news');
                      
                      if (error) {
                        console.error('Error fetching news:', error);
                        toast.error('Error al buscar noticias');
                      } else {
                        toast.success('Noticias actualizadas exitosamente');
                        // Refresh posts again after news are fetched
                        setTimeout(() => fetchPosts(), 2000);
                      }
                    } catch (err) {
                      console.error('Error invoking fetch-sports-news:', err);
                    }
                  } else {
                    toast.success('Feed actualizado');
                  }
                }}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        <SocialSidebar />
        
        <div className="flex-1 max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Create Post Section */}
        {canCreatePost && (
          <Card className="border-border/50">
            <CardContent className="pt-6">
              {showCreateForm ? (
                <CreatePostForm
                  onSubmit={handleCreatePost}
                  authorName={authorInfo!.name}
                  authorNickname={authorInfo!.nickname}
                  authorAvatar={authorInfo!.avatar}
                  authorType={authorInfo!.type}
                  loading={loading}
                  canToggleAuthor={isAdmin && !!userFighter}
                  postAsAdmin={postAsAdmin}
                  onToggleAuthor={(asAdmin) => setPostAsAdmin(asAdmin)}
                />
              ) : (
                <div 
                  className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={authorInfo!.avatar} alt={authorInfo!.name} />
                    <AvatarFallback>{authorInfo!.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-muted-foreground">
                    ¿Qué está pasando en el ring?
                  </div>
                  <Button size="sm" variant="ghost" className="text-primary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Friend Suggestions (only on Friends tab) */}
        {activeTab === 'friends' && user && <FriendSuggestions />}

        {/* Filters Tabs */}
        <Card className="border-border/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-muted/30">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Amigos
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Rss className="h-4 w-4" />
                Noticias
              </TabsTrigger>
              <TabsTrigger value="featured" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Destacados
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4">
          {loading && posts.length === 0 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <div className="text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No hay posts aún</p>
                  <p className="text-sm">
                  {activeTab === 'all' 
                    ? '¡Sé el primero en compartir algo!'
                    : activeTab === 'friends'
                    ? 'Aún no tienes posts de amigos. ¡Agrega amigos para ver su contenido!'
                    : `No hay posts en la categoría "${activeTab}"`
                  }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={toggleLike}
                  onDelete={canCreatePost ? deletePost : undefined}
                  isOwner={
                    (user && isAdmin && post.author_type === 'admin') ||
                    (user && userFighter && post.author_id === userFighter.id)
                  }
                />
              ))}
              
              {/* Load More */}
              {posts.length > 0 && (
                <div className="flex justify-center pt-6">
                  <Button 
                    onClick={() => fetchPosts(10, posts.length)} 
                    disabled={loading}
                    variant="outline"
                    className="bg-card/50 hover:bg-card border-border/50"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner />
                        Cargando...
                      </>
                    ) : (
                      'Cargar más posts'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}