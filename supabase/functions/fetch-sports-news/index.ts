import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

import { buildCorsHeaders } from "../_shared/cors.ts";
// corsHeaders is now computed per-request via buildCorsHeaders(req)

// RSS Feed sources - Expanded for better coverage
const RSS_FEEDS = [
  // MMA Sources
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
    url: 'https://www.mmafighting.com/rss/index.xml', 
    category: 'mma', 
    source: 'MMA Fighting' 
  },
  { 
    url: 'https://www.sherdog.com/rss/news.xml', 
    category: 'mma', 
    source: 'Sherdog' 
  },
  { 
    url: 'https://www.mmajunkie.usatoday.com/feed', 
    category: 'mma', 
    source: 'MMA Junkie' 
  },
  // Boxing Sources
  { 
    url: 'https://www.boxingscene.com/rss.xml', 
    category: 'boxing', 
    source: 'Boxing Scene' 
  },
  { 
    url: 'https://www.boxingnews24.com/feed/', 
    category: 'boxing', 
    source: 'Boxing News 24' 
  },
  { 
    url: 'https://www.ringtv.com/feed/', 
    category: 'boxing', 
    source: 'The Ring' 
  },
  { 
    url: 'https://www.badlefthook.com/rss/index.xml', 
    category: 'boxing', 
    source: 'Bad Left Hook' 
  }
];

// Extract image from HTML content
function extractImageFromHTML(html: string): string | null {
  const imgMatch = html.match(/<img[^>]+src="([^">]+)"/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  return null;
}

// Scrape Open Graph image from webpage with improved selectors
async function scrapeImageFromWebpage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000) // Increased timeout
    });
    const html = await response.text();
    
    // Try Open Graph image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      console.log('Found OG image');
      return ogImageMatch[1];
    }
    
    // Try Twitter card image
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    if (twitterImageMatch && twitterImageMatch[1]) {
      console.log('Found Twitter image');
      return twitterImageMatch[1];
    }
    
    // ESPN specific - try data-default-src
    const espnMatch = html.match(/<img[^>]+data-default-src=["']([^"']+)["']/i);
    if (espnMatch && espnMatch[1]) {
      console.log('Found ESPN image');
      return espnMatch[1];
    }
    
    // Try data-src (lazy loading)
    const dataSrcMatch = html.match(/<img[^>]+data-src=["']([^"']+)["']/i);
    if (dataSrcMatch && dataSrcMatch[1]) {
      console.log('Found data-src image');
      return dataSrcMatch[1];
    }
    
    // Try srcset attribute
    const srcsetMatch = html.match(/<img[^>]+srcset=["']([^"']+)["']/i);
    if (srcsetMatch && srcsetMatch[1]) {
      const firstSrc = srcsetMatch[1].split(',')[0].trim().split(' ')[0];
      if (firstSrc) {
        console.log('Found srcset image');
        return firstSrc;
      }
    }
    
    // Try to find first large image in content
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imgMatch && imgMatch[1] && !imgMatch[1].includes('logo') && !imgMatch[1].includes('icon')) {
      console.log('Found img tag');
      return imgMatch[1];
    }
  } catch (error) {
    console.log(`Failed to scrape image from ${url}:`, error);
  }
  return null;
}

// Generate image with AI - Improved prompts for combat sports
async function generateImageWithAI(title: string, description: string, category: string): Promise<string | null> {
  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.log('LOVABLE_API_KEY not found, skipping AI image generation');
      return null;
    }

    // Create detailed prompts based on category and content
    const categoryPrompts: Record<string, string> = {
      'mma': 'UFC octagon, mixed martial arts fighters in action, dramatic sports photography',
      'boxing': 'boxing ring, professional boxers throwing punches, intense boxing match',
      'muay_thai': 'Muay Thai fighters, traditional Thai boxing, knee strikes and clinch work',
      'kickboxing': 'kickboxing match, high kicks and punches, dynamic combat sports',
    };

    const basePrompt = categoryPrompts[category] || 'combat sports action';
    
    // Extract key terms from title for more specific imagery
    const lowerTitle = title.toLowerCase();
    let specificDetails = '';
    
    if (lowerTitle.includes('knockout') || lowerTitle.includes('ko')) {
      specificDetails = ', dramatic knockout moment, fighter celebrating victory';
    } else if (lowerTitle.includes('champion') || lowerTitle.includes('title')) {
      specificDetails = ', champion with belt, victory celebration, spotlights';
    } else if (lowerTitle.includes('training') || lowerTitle.includes('camp')) {
      specificDetails = ', intense training scene, gym equipment, focused athlete';
    } else if (lowerTitle.includes('weigh-in') || lowerTitle.includes('weight')) {
      specificDetails = ', professional weigh-in ceremony, face-off between fighters';
    } else if (lowerTitle.includes('injury') || lowerTitle.includes('suspended')) {
      specificDetails = ', concerned medical staff, injury scene (respectful)';
    } else if (lowerTitle.includes('announcement') || lowerTitle.includes('fight card')) {
      specificDetails = ', promotional poster style, fighter portraits, event branding';
    }

    const prompt = `Create a high-quality, photorealistic sports image for ${category.toUpperCase()} news. 
Context: ${title}
Style: ${basePrompt}${specificDetails}
Requirements: Professional sports photography, dramatic lighting, 16:9 aspect ratio, suitable for news thumbnail, NO TEXT on image, action-focused, high contrast, vibrant colors.`;

    console.log(`🎨 Generating AI image for "${title.substring(0, 50)}..." (${category})`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      console.error('AI image generation failed:', await response.text());
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl) {
      console.log('✅ AI-generated image created successfully');
      return imageUrl;
    }
  } catch (error) {
    console.error('Error generating AI image:', error);
  }
  return null;
}

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
        const content = item.match(/<content:encoded[^>]*><!\[CDATA\[(.*?)\]\]><\/content:encoded>/i);
        const link = item.match(/<link[^>]*>(.*?)<\/link>/i);
        const pubDate = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
        
        if (title && link) {
          let imageUrl: string | null = null;
          // Clean CDATA tags from URLs
          const articleUrl = link[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          const articleTitle = (title[1] || title[2]).replace(/<[^>]*>/g, '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          const articleDesc = description ? (description[1] || description[2]).replace(/<[^>]*>/g, '').replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
          
          // 1. Try enclosure tag
          const enclosure = item.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*\/?>/i);
          if (enclosure && enclosure[1]) {
            imageUrl = enclosure[1];
          }
          
          // 2. Try media:content
          if (!imageUrl) {
            const mediaContent = item.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*\/?>/i);
            if (mediaContent && mediaContent[1]) {
              imageUrl = mediaContent[1];
            }
          }
          
          // 3. Try media:thumbnail
          if (!imageUrl) {
            const mediaThumbnail = item.match(/<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*\/?>/i);
            if (mediaThumbnail && mediaThumbnail[1]) {
              imageUrl = mediaThumbnail[1];
            }
          }
          
          // 4. Try to extract from content or description HTML
          if (!imageUrl && content) {
            imageUrl = extractImageFromHTML(content[1]);
          }
          if (!imageUrl && description) {
            imageUrl = extractImageFromHTML(description[1] || description[2]);
          }
          
          // 5. Try web scraping (Open Graph)
          if (!imageUrl) {
            console.log(`No RSS image found for "${articleTitle}", attempting web scraping...`);
            imageUrl = await scrapeImageFromWebpage(articleUrl);
            if (imageUrl) {
              console.log(`✅ Found image via web scraping: ${imageUrl.substring(0, 50)}...`);
            }
          }
          
          // 6. AI generation priority logic
          const isFeatured = Math.random() > 0.7;
          
          // Force AI generation for Boxing News 24 (they rarely have images)
          const shouldForceAI = source === 'Boxing News 24' || (!imageUrl && (isFeatured || category === 'boxing'));
          
          if (shouldForceAI && !imageUrl) {
            console.log(`🎨 Generating AI image for ${source}: "${articleTitle}"`);
            imageUrl = await generateImageWithAI(articleTitle, articleDesc, category);
          }
          
          // For any remaining articles without images, try AI generation
          if (!imageUrl) {
            console.log(`🎨 Final AI attempt for: "${articleTitle}"`);
            imageUrl = await generateImageWithAI(articleTitle, articleDesc, category);
          }
          
          // If AI generation fails completely, skip image (no generic fallback)
          if (!imageUrl) {
            console.log(`⚠️ No image available for: "${articleTitle}" - will display without image`);
          }
          
          const publishedAt = pubDate ? new Date(pubDate[1]).toISOString() : new Date().toISOString();
          
          items.push({
            title: articleTitle.substring(0, 100),
            description: articleDesc.substring(0, 200),
            url: articleUrl,
            image_url: imageUrl,
            source,
            category,
            published_at: publishedAt,
            is_featured: isFeatured
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
  const corsHeaders = buildCorsHeaders(req);
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
      // Check for duplicates by both URL and title (more robust)
      const { data: existing } = await supabase
        .from('sports_news')
        .select('id')
        .or(`url.eq.${newsItem.url},title.eq.${newsItem.title}`)
        .maybeSingle();

      if (!existing) {
        const { data: insertedNews, error } = await supabase
          .from('sports_news')
          .insert([newsItem])
          .select()
          .single();
        
        if (!error && insertedNews) {
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