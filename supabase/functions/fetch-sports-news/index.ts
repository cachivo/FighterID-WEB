import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RSS Feed sources
const RSS_FEEDS = [
  { 
    url: 'https://www.ufc.com/rss/news', 
    category: 'mma', 
    source: 'UFC News' 
  },
  { 
    url: 'https://www.espn.com/espn/rss/mma/news', 
    category: 'mma', 
    source: 'ESPN MMA' 
  },
  { 
    url: 'https://www.boxingscene.com/rss.xml', 
    category: 'boxing', 
    source: 'Boxing Scene' 
  },
  { 
    url: 'https://www.mmafighting.com/rss/index.xml', 
    category: 'mma', 
    source: 'MMA Fighting' 
  },
  { 
    url: 'https://www.boxingnews24.com/feed/', 
    category: 'boxing', 
    source: 'Boxing News 24' 
  }
];

async function parseRSSFeed(feedUrl: string, category: string, source: string) {
  try {
    const response = await fetch(feedUrl);
    const xmlText = await response.text();
    
    // Parse XML manually (simplified RSS parser)
    const items: any[] = [];
    const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    
    if (itemMatches) {
      for (let i = 0; i < Math.min(itemMatches.length, 10); i++) {
        const item = itemMatches[i];
        
        const title = item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i);
        const description = item.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/i);
        const link = item.match(/<link[^>]*>(.*?)<\/link>/i);
        const pubDate = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
        const enclosure = item.match(/<enclosure[^>]*url="([^"]*)"[^>]*\/?>|<media:content[^>]*url="([^"]*)"[^>]*\/?>/i);
        
        if (title && link) {
          let imageUrl = null;
          
          // Try to extract image from enclosure or media content
          if (enclosure) {
            imageUrl = enclosure[1] || enclosure[2];
          }
          
          // Fallback images by category
          if (!imageUrl) {
            const fallbackImages = {
              mma: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=200&fit=crop',
              boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=200&fit=crop',
              muay_thai: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=200&fit=crop'
            };
            imageUrl = fallbackImages[category as keyof typeof fallbackImages] || fallbackImages.mma;
          }
          
          const publishedAt = pubDate ? new Date(pubDate[1]).toISOString() : new Date().toISOString();
          
          items.push({
            title: (title[1] || title[2]).replace(/<[^>]*>/g, '').trim().substring(0, 100),
            description: description ? (description[1] || description[2]).replace(/<[^>]*>/g, '').trim().substring(0, 200) : '',
            url: link[1].trim(),
            image_url: imageUrl,
            source,
            category,
            published_at: publishedAt,
            is_featured: Math.random() > 0.7 // Random featured selection
          });
        }
      }
    }
    
    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${feedUrl}:`, error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch news from all RSS feeds
    const allNewsItems: any[] = [];
    
    for (const feed of RSS_FEEDS) {
      console.log(`Fetching RSS feed: ${feed.url}`);
      const items = await parseRSSFeed(feed.url, feed.category, feed.source);
      allNewsItems.push(...items);
    }

    // Remove old news (older than 48 hours to keep more content)
    await supabase
      .from('sports_news')
      .delete()
      .lt('published_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    // Insert new news, avoiding duplicates by URL
    let insertedCount = 0;
    
    for (const newsItem of allNewsItems) {
      const { data: existing } = await supabase
        .from('sports_news')
        .select('id')
        .eq('url', newsItem.url)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('sports_news')
          .insert([newsItem]);
        
        if (!error) {
          insertedCount++;
        } else {
          console.error('Error inserting news item:', error);
        }
      }
    }

    console.log(`✅ Sports news updated successfully - ${insertedCount} new items inserted from ${allNewsItems.length} total items`);

    return new Response(JSON.stringify({ 
      success: true,
      processed: allNewsItems.length,
      inserted: insertedCount,
      message: `Sports news updated successfully - ${insertedCount} new items`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-sports-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});