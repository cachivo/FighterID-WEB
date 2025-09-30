import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { SocialSidebar } from '@/components/social/SocialSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserCheck, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFriends } from '@/hooks/useFriends';
import PostCard from '@/components/social/PostCard';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { toast } from 'sonner';

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  const { friends, sentRequests, sendFriendRequest, removeFriend } = useFriends();
  const { posts, toggleLike, deletePost } = useSocialPosts();

  const isFriend = user ? friends.some(f => f.id === user.id) : false;
  const isPending = user ? sentRequests.some(r => r.receiver_id === user.id) : false;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;

      try {
        setLoading(true);
        
        // Check if viewing own profile
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: currentAppUser } = await supabase
            .from('app_user')
            .select('id')
            .eq('auth_user_id', currentUser.id)
            .single();
          
          setIsOwnProfile(currentAppUser?.id === id);
        }

        // Fetch user profile
        const { data: userData, error } = await supabase
          .from('app_user')
          .select('id, first_name, last_name, avatar_url, bio, country, email')
          .eq('id', id)
          .single();

        if (error) throw error;
        setUser(userData);

        // Fetch user's posts
        const { data: postsData } = await supabase
          .from('social_posts')
          .select('*')
          .eq('author_type', 'user')
          .eq('author_id', userData.id)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (postsData) {
          const enrichedPosts = postsData.map(post => ({
            ...post,
            author_name: userData.first_name && userData.last_name
              ? `${userData.first_name} ${userData.last_name}`
              : userData.email || 'Usuario',
            author_avatar: userData.avatar_url,
            isLiked: false
          }));
          setUserPosts(enrichedPosts);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Cargando..." />
        <div className="flex">
          <SocialSidebar />
          <main className="flex-1 p-6">
            <p className="text-center text-muted-foreground">Cargando perfil...</p>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Usuario no encontrado" />
        <div className="flex">
          <SocialSidebar />
          <main className="flex-1 p-6">
            <p className="text-center text-muted-foreground">El usuario no existe</p>
          </main>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  };

  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.email || 'Usuario';

  const handleFriendAction = async () => {
    if (isFriend) {
      await removeFriend(user.id);
    } else {
      await sendFriendRequest(user.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={`Perfil de ${displayName}`} />
      
      <div className="flex">
        <SocialSidebar />
        
        <main className="flex-1 p-6 max-w-4xl mx-auto">
          <Card className="p-6 mb-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                    {user.email && (
                      <p className="text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                  
                  {!isOwnProfile && (
                    <Button
                      variant={isFriend ? "secondary" : "default"}
                      onClick={handleFriendAction}
                      disabled={isPending}
                    >
                      {isFriend ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Amigos
                        </>
                      ) : isPending ? (
                        'Pendiente'
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Agregar Amigo
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {user.bio && (
                  <p className="text-foreground mb-4">{user.bio}</p>
                )}
                
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{friends.length}</span>
                    <span className="text-muted-foreground">amigos</span>
                  </div>
                  <Badge variant="outline">{user.country || 'País no especificado'}</Badge>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Publicaciones</h2>
            
            {userPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Este usuario aún no ha publicado nada
              </p>
            ) : (
              userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={toggleLike}
                  onDelete={deletePost}
                />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
