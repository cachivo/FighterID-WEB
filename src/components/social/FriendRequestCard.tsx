import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FriendRequestCardProps {
  request: {
    id: string;
    sender?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      email: string | null;
    };
  };
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export const FriendRequestCard = ({ request, onAccept, onReject }: FriendRequestCardProps) => {
  if (!request.sender) return null;

  const getInitials = () => {
    const first = request.sender?.first_name?.[0] || '';
    const last = request.sender?.last_name?.[0] || '';
    return (first + last).toUpperCase() || request.sender?.email?.[0]?.toUpperCase() || 'U';
  };

  const displayName = request.sender.first_name && request.sender.last_name
    ? `${request.sender.first_name} ${request.sender.last_name}`
    : request.sender.email || 'Usuario';

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Link to={`/social/profile/${request.sender.id}`}>
          <Avatar className="w-12 h-12">
            <AvatarImage src={request.sender.avatar_url || undefined} alt={displayName} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <Link to={`/social/profile/${request.sender.id}`}>
            <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
              {displayName}
            </h3>
            {request.sender.email && (
              <p className="text-sm text-muted-foreground">{request.sender.email}</p>
            )}
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            Te envió una solicitud de amistad
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onAccept(request.id)}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(request.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
