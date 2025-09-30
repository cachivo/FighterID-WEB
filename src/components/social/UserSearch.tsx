import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { UserCard } from './UserCard';
import { useFriends } from '@/hooks/useFriends';

export const UserSearch = () => {
  const [query, setQuery] = useState('');
  const { users, loading, searchUsers } = useUserSearch();
  const { friends, sentRequests, sendFriendRequest } = useFriends();

  const handleSearch = (value: string) => {
    setQuery(value);
    searchUsers(value);
  };

  const isFriend = (userId: string) => friends.some(f => f.id === userId);
  const isPending = (userId: string) => sentRequests.some(r => r.receiver_id === userId);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar usuarios por nombre o email..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <p className="text-center text-muted-foreground py-8">Buscando...</p>
      )}

      {!loading && query.length >= 2 && users.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No se encontraron usuarios
        </p>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            isFriend={isFriend(user.id)}
            isPending={isPending(user.id)}
            onAddFriend={() => sendFriendRequest(user.id)}
          />
        ))}
      </div>
    </div>
  );
};
