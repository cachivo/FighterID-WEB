import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserPlus, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserCardProps {
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    email: string | null;
  };
  isFriend?: boolean;
  isPending?: boolean;
  onAddFriend?: () => void;
  showBio?: boolean;
}

export const UserCard = ({ 
  user, 
  isFriend = false, 
  isPending = false,
  onAddFriend,
  showBio = true 
}: UserCardProps) => {
  const getInitials = () => {
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  };

  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.email || 'Usuario';

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <Link to={`/social/profile/${user.id}`}>
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatar_url || undefined} alt={displayName} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <Link to={`/social/profile/${user.id}`}>
            <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
              {displayName}
            </h3>
            {user.email && (
              <p className="text-sm text-muted-foreground">{user.email}</p>
            )}
          </Link>
          
          {showBio && user.bio && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>
          )}
        </div>

        {onAddFriend && (
          <Button
            variant={isFriend ? "secondary" : "default"}
            size="sm"
            onClick={onAddFriend}
            disabled={isPending}
          >
            {isFriend ? (
              <>
                <UserCheck className="w-4 h-4 mr-1" />
                Amigos
              </>
            ) : isPending ? (
              'Pendiente'
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                Agregar
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};
