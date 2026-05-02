import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

import { buildCorsHeaders } from "../_shared/cors.ts";
// corsHeaders is now computed per-request via buildCorsHeaders(req)

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [PUBLISH NEWS TO SOCIAL] Starting...');

    // Create Supabase client with SERVICE ROLE key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get recent news from last 24 hours that haven't been posted yet
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const { data: recentNews, error: newsError } = await supabaseAdmin
      .from('sports_news')
      .select('*')
      .gte('published_at', oneDayAgo.toISOString())
      .order('published_at', { ascending: false });

    if (newsError) {
      console.error('❌ Error fetching news:', newsError);
      throw newsError;
    }

    console.log(`📰 Found ${recentNews?.length || 0} news items from last 24h`);

    let postsCreated = 0;

    if (recentNews && recentNews.length > 0) {
      for (const newsItem of recentNews) {
        // Check if post already exists - improved duplicate detection
        // Check by both URL in content AND by title similarity
        const { data: existingPosts } = await supabaseAdmin
          .from('social_posts')
          .select('id, content')
          .eq('post_type', 'news')
          .or(`content.ilike.%${newsItem.url}%,content.ilike.%${newsItem.title.substring(0, 50)}%`)
          .limit(5);

        // More strict duplicate check - if URL appears in any post, skip
        const isDuplicate = existingPosts?.some(post => 
          post.content.includes(newsItem.url) || 
          post.content.includes(newsItem.title)
        );

        if (isDuplicate) {
          console.log(`⏭️ Skipping existing post for: ${newsItem.title.substring(0, 80)}`);
          continue;
        }

        // Decide if we should post this news
        const shouldPost = shouldCreatePost(newsItem);
        
        if (!shouldPost) {
          console.log(`⏭️ Skipping non-relevant news: ${newsItem.title}`);
          continue;
        }

        // Create social post content
        const content = createPostContent(newsItem);

        // Insert post using service role (bypasses RLS)
        const { data: newPost, error: insertError } = await supabaseAdmin
          .from('social_posts')
          .insert([{
            author_id: '00000000-0000-0000-0000-000000000000', // System/Bot ID
            author_type: 'admin',
            content,
            media_urls: newsItem.image_url ? [newsItem.image_url] : [],
            post_type: 'news',
            featured: newsItem.is_featured || false,
            active: true
          }])
          .select()
          .single();

        if (insertError) {
          console.error(`❌ Error inserting post for "${newsItem.title}":`, insertError);
          continue;
        }

        console.log(`✅ Created social post for: ${newsItem.title} (ID: ${newPost.id})`);
        postsCreated++;
      }
    }

    console.log(`✅ [PUBLISH NEWS TO SOCIAL] Completed. Posts created: ${postsCreated}`);

    return new Response(
      JSON.stringify({
        success: true,
        postsCreated,
        message: `Successfully published ${postsCreated} news items to social feed`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ [PUBLISH NEWS TO SOCIAL] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper: Determine if news should be posted
function shouldCreatePost(newsItem: any): boolean {
  // Always post featured news
  if (newsItem.is_featured) return true;
  
  // Post all boxing and MMA news
  if (newsItem.category === 'mma' || newsItem.category === 'boxing') {
    return true;
  }
  
  // Check for relevant keywords
  const relevantKeywords = [
    'championship', 'title', 'ranking', 'knockout', 'fight',
    'match', 'tournament', 'ufc', 'bellator', 'pfl'
  ];
  
  const titleLower = newsItem.title.toLowerCase();
  return relevantKeywords.some(keyword => titleLower.includes(keyword));
}

// Helper: Create post content based on news
function createPostContent(newsItem: any): string {
  return `🔥 ÚLTIMA HORA EN ${newsItem.category.toUpperCase()}

${newsItem.title}

${newsItem.description || ''}

💬 ¿Qué te parece? ¡Comenta tu opinión!

📰 Fuente: ${newsItem.source}
🔗 Leer más: ${newsItem.url}

#${newsItem.category} #CombateSports #MMA #Boxing`;
}
