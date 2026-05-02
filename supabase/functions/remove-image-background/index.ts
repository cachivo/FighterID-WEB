import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { buildCorsHeaders } from "../_shared/cors.ts";
// corsHeaders is now computed per-request via buildCorsHeaders(req)

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[remove-image-background] Processing image...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "Remove the background from this image completely. Keep only the person/subject with their full body visible. Make the background fully transparent (alpha channel). Output as PNG with transparent background. Do not crop or resize the subject."
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 }
            }
          ]
        }],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[remove-image-background] API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the processed image from the response
    const processedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!processedImage) {
      console.error('[remove-image-background] No image in response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No processed image returned from AI');
    }

    console.log('[remove-image-background] Successfully processed image');

    return new Response(
      JSON.stringify({ 
        processedImage,
        success: true 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[remove-image-background] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
