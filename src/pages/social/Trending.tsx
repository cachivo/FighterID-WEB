import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import TrendingPanel from '@/components/social/TrendingPanel';
import PostCard from '@/components/social/PostCard';
import { useHashtags } from '@/hooks/useHashtags';
import { useSocialPosts, SocialPost } from '@/hooks/useSocialPosts';

export default function Trending() {
  const navigate = useNavigate();
  const { searchByHashtag } = useHashtags();
  const { toggleLike, deletePost } = useSocialPosts();
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);

  const handleHashtagClick = async (hashtag: string) => {
    setSelectedHashtag(hashtag);
    setLoading(true);
    const results = await searchByHashtag(hashtag);
    setPosts(results as SocialPost[]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/social-feed')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Tendencias</h1>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trending Panel */}
          <div className="lg:col-span-1">
            <TrendingPanel onHashtagClick={handleHashtagClick} />
          </div>

          {/* Posts */}
          <div className="lg:col-span-2 space-y-4">
            {selectedHashtag && (
              <div className="text-lg font-semibold mb-4">
                Posts con #{selectedHashtag}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando posts...
              </div>
            ) : posts.length > 0 ? (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={toggleLike}
                  onDelete={deletePost}
                />
              ))
            ) : selectedHashtag ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay posts con este hashtag aún.
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Selecciona un hashtag para ver posts relacionados
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}