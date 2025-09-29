import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsPostGeneratorProps {
  userId?: string;
  userType?: 'fighter' | 'fan' | 'admin';
}

export function NewsPostGenerator({ userId, userType = 'fan' }: NewsPostGeneratorProps) {
  const { toast } = useToast();

  useEffect(() => {
    // Listen for real-time news updates and create targeted social posts
    const channel = supabase
      .channel('news-social-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sports_news'
        },
        async (payload) => {
          const newsItem = payload.new;
          
          // Determine if this news should be posted based on user preferences
          const shouldPost = await shouldCreatePostForUser(newsItem, userType);
          
          if (shouldPost) {
            await createSmartSocialPost(newsItem, userType);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userType]);

  const shouldCreatePostForUser = async (newsItem: any, userType: string) => {
    // Smart criteria based on user type and news relevance
    const keywords = {
      fighter: ['championship', 'title', 'ranking', 'license', 'tournament'],
      fan: ['ufc', 'boxing', 'knockout', 'highlight', 'result'],
      admin: ['regulation', 'safety', 'commission', 'policy']
    };

    const userKeywords = keywords[userType as keyof typeof keywords] || keywords.fan;
    const titleLower = newsItem.title.toLowerCase();
    
    return (
      newsItem.is_featured ||
      userKeywords.some(keyword => titleLower.includes(keyword)) ||
      newsItem.category === 'mma' && userType === 'fighter'
    );
  };

  const createSmartSocialPost = async (newsItem: any, userType: string) => {
    try {
      const postTemplates = {
        fighter: `¡Atención luchadores!
        
${newsItem.title}

${newsItem.description}

Esta información podría impactar tu carrera. ¿Qué opinas?

Fuente: ${newsItem.source}
Enlace: ${newsItem.url}

#Fighters #${newsItem.category} #CombateSports`,

        fan: `¡Breaking News en el mundo del combate!

${newsItem.title}

${newsItem.description}

¿Qué te parece esta noticia? ¡Comenta tu opinión!

Fuente: ${newsItem.source}  
Enlace: ${newsItem.url}

#${newsItem.category} #CombateSports #MMA #Boxing`,

        admin: `Actualización importante

${newsItem.title}

${newsItem.description}

Información relevante para la comunidad de combate.

Fuente: ${newsItem.source}
Enlace: ${newsItem.url}

#News #${newsItem.category} #Update`
      };

      const content = postTemplates[userType as keyof typeof postTemplates] || postTemplates.fan;

      const { error } = await supabase
        .from('social_posts')
        .insert([{
          author_id: '00000000-0000-0000-0000-000000000000', // System/Bot ID
          author_type: 'admin',
          content,
          media_urls: newsItem.image_url ? [newsItem.image_url] : [],
          post_type: 'news',
          featured: newsItem.is_featured,
          active: true
        }]);

      if (!error) {
        toast({
          title: "Nueva publicación",
          description: "Se ha agregado una nueva noticia al feed social",
        });
      }
    } catch (error) {
      console.error('Error creating smart social post:', error);
    }
  };

  // Auto-trigger news fetching every 30 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await supabase.functions.invoke('fetch-sports-news');
      } catch (error) {
        console.error('Error auto-fetching news:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, []);

  return null; // This is a background component
}