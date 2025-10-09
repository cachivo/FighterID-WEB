import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  embed_type: string;
  embed_html: string | null;
  metadata: any;
}

export function useLinkPreview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async (url: string): Promise<LinkPreview | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('[LINK PREVIEW] Fetching preview for:', url);

      // Check cache first
      const { data: cached } = await supabase
        .from('link_previews')
        .select('*')
        .eq('url', url)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached) {
        console.log('[LINK PREVIEW] Using cached data');
        return cached as LinkPreview;
      }

      // Call edge function to fetch metadata
      const { data, error: funcError } = await supabase.functions.invoke('fetch-link-metadata', {
        body: { url }
      });

      if (funcError) throw funcError;

      console.log('[LINK PREVIEW] Preview fetched successfully');
      return data as LinkPreview;

    } catch (err: any) {
      console.error('[LINK PREVIEW ERROR]:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchMultiplePreviews = async (urls: string[]): Promise<Map<string, LinkPreview>> => {
    const previews = new Map<string, LinkPreview>();

    for (const url of urls) {
      const preview = await fetchPreview(url);
      if (preview) {
        previews.set(url, preview);
      }
    }

    return previews;
  };

  return {
    loading,
    error,
    fetchPreview,
    fetchMultiplePreviews
  };
}