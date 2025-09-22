import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, TrendingUp, Users, Star, Plus } from 'lucide-react';
import PostCard from '@/components/social/PostCard';
import CreatePostForm from '@/components/social/CreatePostForm';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useAuth } from '@/hooks/useAuth';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { supabase } from '@/integrations/supabase/client';

export default function SocialFeed() {
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { posts, loading, createPost, toggleLike, deletePost, fetchPosts } = useSocialPosts();
  const { user } = useAuth();
  const { getUserFighterProfile } = useFighterProfiles();
  const [userFighter, setUserFighter] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUserType = async () => {
      if (user) {
        // Check if user is admin
        const { data: appUser } = await supabase
          .from('app_user')
          .select('is_admin')
          .eq('auth_user_id', user.id)
          .single();
        
        setIsAdmin(appUser?.is_admin || false);

        // Check if user has fighter profile
        const fighterProfile = await getUserFighterProfile();
        setUserFighter(fighterProfile);
      }
    };

    checkUserType();
  }, [user]);

  const handleCreatePost = async (postData: any) => {
    if (!user) return;

    if (isAdmin) {
      // Admin post
      const { data: adminUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (adminUser) {
        await createPost(postData, 'admin', adminUser.id);
        setShowCreateForm(false);
      }
    } else if (userFighter) {
      // Fighter post
      await createPost(postData, 'fighter', userFighter.id);
      setShowCreateForm(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'all') return true;
    if (activeTab === 'fighters') return post.author_type === 'fighter';
    if (activeTab === 'news') return post.author_type === 'admin';
    if (activeTab === 'featured') return post.featured;
    return true;
  });

  const canCreatePost = user && (isAdmin || userFighter);

  const getAuthorInfo = () => {
    // Prioritize fighter profile data if exists, even for admins
    if (userFighter) {
      return {
        name: `${userFighter.first_name} ${userFighter.last_name}`,
        nickname: userFighter.nickname,
        avatar: userFighter.avatar_url,
        type: isAdmin ? 'admin' as const : 'fighter' as const
      };
    } else if (isAdmin) {
      return {
        name: 'Batalla de Gallos',
        nickname: undefined,
        avatar: undefined,
        type: 'admin' as const
      };
    }
    return null;
  };

  const authorInfo = getAuthorInfo();

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Feed Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png" 
              alt="Fighter ID"
              className="h-8 w-auto hover:scale-105 hover:opacity-90 transition-all duration-300"
            />
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Feed</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
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

        {/* Filters Tabs */}
        <Card className="border-border/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-muted/30">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="fighters" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Luchadores
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
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
  );
}