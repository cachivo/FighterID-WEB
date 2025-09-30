import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, FileText } from 'lucide-react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useFriends } from '@/hooks/useFriends';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { UserCard } from './UserCard';
import PostCard from './PostCard';
import { Card, CardContent } from '@/components/ui/card';

export const UnifiedSearch = () => {
  const [query, setQuery] = useState('');
  const { users, loading: loadingUsers, searchUsers } = useUserSearch();
  const { friends, sentRequests, sendFriendRequest } = useFriends();
  const { posts, toggleLike } = useSocialPosts();

  const handleSearch = (value: string) => {
    setQuery(value);
    searchUsers(value);
  };

  const isFriend = (userId: string) => friends.some(f => f.id === userId);
  const isPending = (userId: string) => sentRequests.some(r => r.receiver_id === userId);

  // Filter posts by search query
  const filteredPosts = posts.filter(post => 
    query.length >= 2 && (
      post.content.toLowerCase().includes(query.toLowerCase()) ||
      post.author_name?.toLowerCase().includes(query.toLowerCase()) ||
      post.author_nickname?.toLowerCase().includes(query.toLowerCase())
    )
  );

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar usuarios o publicaciones..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs for Users and Posts */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Usuarios ({users.length})
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <FileText className="w-4 h-4" />
              Publicaciones ({filteredPosts.length})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-4">
            {loadingUsers && (
              <p className="text-center text-muted-foreground py-8">Buscando...</p>
            )}

            {!loadingUsers && query.length >= 2 && users.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No se encontraron usuarios</p>
              </div>
            )}

            {!loadingUsers && query.length < 2 && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Escribe al menos 2 caracteres para buscar</p>
              </div>
            )}

            <div className="space-y-3">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isFriend={isFriend(user.id)}
                  isPending={isPending(user.id)}
                  onAddFriend={() => sendFriendRequest(user.id)}
                  showBio={false}
                />
              ))}
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4 mt-4">
            {query.length >= 2 && filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No se encontraron publicaciones</p>
              </div>
            )}

            {query.length < 2 && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Escribe al menos 2 caracteres para buscar</p>
              </div>
            )}

            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => toggleLike(post.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
