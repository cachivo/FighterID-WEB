import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users } from 'lucide-react';
import { useFriendSuggestions } from '@/hooks/useFriendSuggestions';
import { useFriends } from '@/hooks/useFriends';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function FriendSuggestions() {
  const { suggestions, loading } = useFriendSuggestions();
  const { sendFriendRequest } = useFriends();

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-6">
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Personas que podrías conocer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={suggestion.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {suggestion.first_name?.[0] || suggestion.handle?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {suggestion.first_name && suggestion.last_name
                    ? `${suggestion.first_name} ${suggestion.last_name}`
                    : suggestion.handle || 'Usuario'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.reason}
                  </p>
                  {suggestion.fighter_profile?.gym_name && (
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.fighter_profile.gym_name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => sendFriendRequest(suggestion.id)}
              className="ml-2"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
