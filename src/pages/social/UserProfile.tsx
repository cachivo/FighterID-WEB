import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { SocialSidebar } from '@/components/social/SocialSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, UserCheck, Users, Trophy, Target, TrendingUp, Calendar, MapPin, Shield, Sword, Heart, MessageCircle, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFriends } from '@/hooks/useFriends';
import PostCard from '@/components/social/PostCard';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [fighterProfile, setFighterProfile] = useState<any>(null);
  const [fighterHistory, setFighterHistory] = useState<any[]>([]);
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

        // Check if user is a fighter
        const { data: fighterData } = await supabase
          .from('fighter_profiles')
          .select(`
            *,
            primary_license_id,
            fighter_licenses!fighter_profiles_primary_license_id_fkey (
              license_number,
              status,
              license_level
            )
          `)
          .eq('user_id', userData.id)
          .eq('active', true)
          .single();

        if (fighterData) {
          setFighterProfile(fighterData);

          // Fetch fighter's fight history
          const { data: historyData } = await supabase
            .from('fights_history')
            .select('*')
            .or(`red_fighter_id.eq.${fighterData.id},blue_fighter_id.eq.${fighterData.id}`)
            .order('event_date', { ascending: false })
            .limit(10);

          setFighterHistory(historyData || []);
        }

        // Fetch user's posts (both user and fighter posts if applicable)
        const { data: postsData } = await supabase
          .from('social_posts')
          .select('*')
          .or(`and(author_type.eq.user,author_id.eq.${userData.id}),and(author_type.eq.fighter,author_id.eq.${fighterData?.id || '00000000-0000-0000-0000-000000000000'})`)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (postsData) {
          const enrichedPosts = postsData.map(post => ({
            ...post,
            author_name: fighterData 
              ? `${fighterData.first_name} ${fighterData.last_name}`
              : userData.first_name && userData.last_name
              ? `${userData.first_name} ${userData.last_name}`
              : userData.email || 'Usuario',
            author_avatar: fighterData?.avatar_url || userData.avatar_url,
            author_nickname: fighterData?.nickname,
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
      <div className="min-h-screen flex w-full bg-background">
        <SocialSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex w-full bg-background">
        <SocialSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-muted-foreground">El usuario no existe</p>
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

  const totalFights = fighterProfile ? (fighterProfile.record_wins || 0) + (fighterProfile.record_losses || 0) + (fighterProfile.record_draws || 0) : 0;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <SocialSidebar />
      
      <div className="flex-1">
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <PageHeader title={`Perfil de ${displayName}`} showBackButton={true} />
          </div>
        </div>

        <main className="container mx-auto p-6 max-w-6xl space-y-6">
          {/* Hero Card - Fighter or User */}
          <Card className="overflow-hidden border-2">
            {fighterProfile && (
              <div className="h-32 bg-gradient-to-r from-purple-neon-primary/20 to-cyan-neon/20 relative">
                <div className="absolute inset-0 bg-[url('/lovable-uploads/octagon-background.png')] opacity-20 bg-cover bg-center"></div>
              </div>
            )}
            
            <CardContent className={fighterProfile ? "-mt-16 relative" : "pt-8"}>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className={`${fighterProfile ? 'w-32 h-32 border-4' : 'w-24 h-24 border-2'} border-background shadow-xl`}>
                    <AvatarImage 
                      src={fighterProfile?.avatar_url || user.avatar_url || undefined} 
                      alt={displayName} 
                    />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">
                          {fighterProfile ? `${fighterProfile.first_name} ${fighterProfile.last_name}` : displayName}
                        </h1>
                        {fighterProfile?.nickname && (
                          <p className="text-xl text-purple-neon-primary font-semibold">
                            "{fighterProfile.nickname}"
                          </p>
                        )}
                        {user.email && !fighterProfile && (
                          <p className="text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                      
                      {isOwnProfile ? (
                        <Button
                          asChild
                          variant="default"
                          size="lg"
                          className="min-h-[44px] touch-manipulation"
                        >
                          <Link to="/social/profile">
                            <Edit className="w-5 h-5 mr-2" />
                            Editar Perfil
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          variant={isFriend ? "secondary" : "default"}
                          onClick={handleFriendAction}
                          disabled={isPending}
                          size="lg"
                          className="min-h-[44px] touch-manipulation"
                        >
                          {isFriend ? (
                            <>
                              <UserCheck className="w-5 h-5 mr-2" />
                              Amigos
                            </>
                          ) : isPending ? (
                            'Pendiente'
                          ) : (
                            <>
                              <UserPlus className="w-5 h-5 mr-2" />
                              Agregar Amigo
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {fighterProfile ? (
                        <>
                          {fighterProfile.fighter_licenses?.[0]?.license_level && (
                            <Badge variant="default" className="gap-1">
                              <Shield className="h-3 w-3" />
                              {fighterProfile.fighter_licenses[0].license_level}
                            </Badge>
                          )}
                          {fighterProfile.weight_class && (
                            <Badge variant="outline">{fighterProfile.weight_class}</Badge>
                          )}
                          {fighterProfile.country && (
                            <Badge variant="outline" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              {fighterProfile.country}
                            </Badge>
                          )}
                          {fighterProfile.gym_name && (
                            <Badge variant="secondary">{fighterProfile.gym_name}</Badge>
                          )}
                        </>
                      ) : (
                        <>
                          {user.country && (
                            <Badge variant="outline" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              {user.country}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {(fighterProfile?.bio || user.bio) && (
                    <p className="text-foreground text-lg">{fighterProfile?.bio || user.bio}</p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    {fighterProfile ? (
                      <>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold text-primary">
                            {fighterProfile.record_wins || 0}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Victorias
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold text-destructive">
                            {fighterProfile.record_losses || 0}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                            <Target className="h-3 w-3" />
                            Derrotas
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold text-accent">
                            {fighterProfile.record_draws || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Empates</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold text-purple-neon-primary">
                            {totalFights}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Peleas
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold text-primary">{userPosts.length}</div>
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
                      </>
                    )}
                  </div>

                  {/* Fighter Physical Stats */}
                  {fighterProfile && (
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-2 border-t">
                      {fighterProfile.height_cm && (
                        <div>
                          <span className="font-semibold text-foreground">Altura:</span> {fighterProfile.height_cm} cm
                        </div>
                      )}
                      {fighterProfile.weight_kg && (
                        <div>
                          <span className="font-semibold text-foreground">Peso:</span> {fighterProfile.weight_kg} kg
                        </div>
                      )}
                      {fighterProfile.reach_cm && (
                        <div>
                          <span className="font-semibold text-foreground">Alcance:</span> {fighterProfile.reach_cm} cm
                        </div>
                      )}
                      {fighterProfile.fighting_style && (
                        <div>
                          <span className="font-semibold text-foreground">Estilo:</span> {fighterProfile.fighting_style}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Content */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto">
              <TabsTrigger value="posts" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Publicaciones
              </TabsTrigger>
              {fighterProfile && (
                <TabsTrigger value="fights" className="gap-2">
                  <Sword className="h-4 w-4" />
                  Historial de Peleas
                </TabsTrigger>
              )}
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-4 mt-6">
              {userPosts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      {isOwnProfile ? 'No has publicado nada aún' : 'Este usuario aún no ha publicado nada'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                userPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={toggleLike}
                    onDelete={isOwnProfile ? deletePost : undefined}
                  />
                ))
              )}
            </TabsContent>

            {/* Fights History Tab */}
            {fighterProfile && (
              <TabsContent value="fights" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sword className="h-5 w-5" />
                      Historial de Combates ({fighterHistory.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fighterHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <Sword className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No hay peleas registradas</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fighterHistory.map((fight) => {
                          const isRedFighter = fight.red_fighter_id === fighterProfile.id;
                          const wonFight = (isRedFighter && fight.result === 'red_win') || 
                                         (!isRedFighter && fight.result === 'blue_win');
                          const drawFight = fight.result === 'draw';
                          
                          return (
                            <div 
                              key={fight.id} 
                              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    {wonFight ? (
                                      <Badge variant="default" className="bg-green-600">Victoria</Badge>
                                    ) : drawFight ? (
                                      <Badge variant="secondary">Empate</Badge>
                                    ) : (
                                      <Badge variant="destructive">Derrota</Badge>
                                    )}
                                    {fight.event_date && (
                                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(fight.event_date), 'dd MMM yyyy', { locale: es })}
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-semibold text-foreground">{fight.event_name || 'Evento sin nombre'}</p>
                                    {fight.method && (
                                      <p className="text-sm text-muted-foreground">
                                        {fight.method}
                                        {fight.round && ` - Round ${fight.round}`}
                                        {fight.time_in_round && ` - ${fight.time_in_round}`}
                                      </p>
                                    )}
                                    {fight.weight_class && (
                                      <Badge variant="outline" className="text-xs">
                                        {fight.weight_class}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
