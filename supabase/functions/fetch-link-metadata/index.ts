import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('[LINK METADATA] Fetching metadata for:', url);

    if (!url) {
      throw new Error('URL is required');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cached } = await supabase
      .from('link_previews')
      .select('*')
      .eq('url', url)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      console.log('[LINK METADATA] Returning cached data');
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BatallaDeLosGallos/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Extract metadata
    const metadata: any = {
      url,
      title: extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title') || extractTitle(html),
      description: extractMeta(html, 'og:description') || extractMeta(html, 'twitter:description') || extractMeta(html, 'description'),
      image_url: extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image'),
      site_name: extractMeta(html, 'og:site_name'),
      embed_type: 'generic',
      embed_html: null,
      metadata: {},
    };

    // Detect special embeds
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        metadata.embed_type = 'youtube';
        metadata.embed_html = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        metadata.metadata = { video_id: videoId };
      }
    } else if (url.includes('twitter.com/') || url.includes('x.com/')) {
      metadata.embed_type = 'twitter';
      metadata.metadata = { tweet_url: url };
    } else if (url.includes('instagram.com/')) {
      metadata.embed_type = 'instagram';
      metadata.metadata = { instagram_url: url };
    }

    // Cache the result
    await supabase
      .from('link_previews')
      .upsert({
        ...metadata,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    console.log('[LINK METADATA] Metadata extracted successfully');

    return new Response(JSON.stringify(metadata), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[LINK METADATA ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions
function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}