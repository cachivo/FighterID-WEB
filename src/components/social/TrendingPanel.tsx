import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Hash } from 'lucide-react';
import { useHashtags } from '@/hooks/useHashtags';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendingPanelProps {
  onHashtagClick?: (hashtag: string) => void;
}

export default function TrendingPanel({ onHashtagClick }: TrendingPanelProps) {
  const { trending, loading } = useHashtags();

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Tendencias del día
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {trending.map((item, index) => (
          <button
            key={item.hashtag}
            onClick={() => onHashtagClick?.(item.hashtag)}
            className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <Hash className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {item.hashtag}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.count} {item.count === 1 ? 'post' : 'posts'}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                <TrendingUp className="h-3 w-3 mr-1" />
                {item.count}
              </Badge>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}