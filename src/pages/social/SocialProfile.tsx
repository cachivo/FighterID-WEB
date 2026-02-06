import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFriends } from '@/hooks/useFriends';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/social/PostCard';
import { SocialSidebar } from '@/components/social/SocialSidebar';
import { UserProfileForm } from '@/components/UserProfileForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Edit, Users, MessageCircle, MapPin, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CreatePostForm from '@/components/social/CreatePostForm';
import { toast } from 'sonner';

export default function SocialProfile() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useUserProfile();
  const { friends } = useFriends();
  const { posts, fetchPosts, toggleLike, deletePost, createPost } = useSocialPosts();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (user && profile) {
        fetchPosts();
        
        // Check admin status
        const { data: adminStatus } = await supabase.rpc('is_admin');
        setIsAdmin(adminStatus || false);
      }
    };

    loadData();
  }, [user, profile, fetchPosts]);

  // Filter posts by current user
  const myPosts = posts.filter(post => post.author_type === 'user' && post.author_id === profile?.id);

  const handleCreatePost = async (postData: any) => {
    if (!user || !profile) {
      toast.error('Debes iniciar sesión para publicar');
      return;
    }

    const authorType = isAdmin && postData.postAsAdmin ? 'admin' : 'user';
    const authorId = profile.id;

    const result = await createPost(postData, authorType, authorId);
    
    if (result) {
      setShowCreatePost(false);
      fetchPosts();
      toast.success('Publicación creada');
    }
  };

  const displayName = profile ? 
    (profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : profile.email?.split('@')[0] || 'Usuario')
    : 'Usuario';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-6">Debes iniciar sesión para ver tu perfil.</p>
            <Button asChild>
              <Link to="/auth">Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    return (profile.first_name?.[0] || '') + (profile.last_name?.[0] || '') || profile.email?.[0] || 'U';
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SocialSidebar />
      
      <div className="flex-1">
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <PageHeader 
              title="Mi Perfil Social"
              subtitle="Gestiona tu información y contenido"
              showBackButton={false}
            />
          </div>
        </div>

        <main className="container mx-auto p-6 max-w-6xl space-y-6">
          {/* Hero Card with Cover */}
          <Card className="overflow-hidden border-2">
            {/* Cover Photo */}
            <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20 relative group">
              {profile.avatar_url && (
                <img 
                  src={profile.avatar_url} 
                  alt="Cover" 
                  className="w-full h-full object-cover opacity-30" 
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-h-[44px] touch-manipulation"
              >
                <Camera className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Cambiar portada</span>
              </Button>
            </div>
            
            <CardContent className="-mt-16 relative">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar with Edit */}
                <div className="flex-shrink-0 relative group">
                  <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                    <AvatarImage 
                      src={profile.avatar_url || undefined} 
                      alt={displayName} 
                    />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">
                          {displayName}
                        </h1>
                        {profile.email && (
                          <p className="text-muted-foreground">{profile.email}</p>
                        )}
                      </div>
                      
                      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="default" size="lg">
                            <Edit className="h-5 w-5 mr-2" />
                            Editar Perfil
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Editar Perfil Social</DialogTitle>
                          </DialogHeader>
                          <UserProfileForm onSuccess={() => {
                            setEditDialogOpen(false);
                            refetchProfile();
                          }} />
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profile.country && (
                        <Badge variant="outline" className="gap-1">
                          <MapPin className="h-3 w-3" />
                          {profile.country}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-foreground text-lg">{profile.bio}</p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{myPosts.length}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        Posts
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-accent">{friends.length}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" />
                        Amigos
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Post Section */}
          {showCreatePost && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Crear Publicación</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowCreatePost(false)}>
                    Cancelar
                  </Button>
                </div>
                <CreatePostForm 
                  onSubmit={handleCreatePost}
                  authorName={displayName}
                  authorAvatar={profile.avatar_url || undefined}
                  authorType={isAdmin ? 'admin' : 'user'}
                  canToggleAuthor={isAdmin}
                  postAsAdmin={false}
                />
              </div>
            </Card>
          )}
          
          {!showCreatePost && (
            <Card className="p-4">
              <Button 
                onClick={() => setShowCreatePost(true)}
                className="w-full"
                variant="outline"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                ¿Qué estás pensando?
              </Button>
            </Card>
          )}

          {/* Content Tabs */}
          <Tabs value="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="posts">Publicaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4 mt-6">
              {myPosts.length > 0 ? (
                myPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={toggleLike}
                    onDelete={deletePost}
                  />
                ))
              ) : (
                <Card className="p-12 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hay publicaciones aún</h3>
                  <p className="text-muted-foreground mb-6">
                    Comparte tu primera publicación con la comunidad
                  </p>
                  <Button onClick={() => setShowCreatePost(true)}>
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Crear Publicación
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
