import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hardcoded API keys for local development
const GEMINI_API_KEYS = [
  'AIzaSyAG2x0duV-k1cnZqSdnsccRIzPeQyUtXIA',
  'AIzaSyD7FZrMq9VmHwWQlhBUqyE4sBlPawckKic'
];

let currentKeyIndex = 0;

function getNextApiKey(): string {
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request body
    const { prompt } = await req.json()
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call Gemini API with retry logic using multiple keys
    const generatedText = await callGeminiWithRetry(prompt)

    // Return the generated content
    return new Response(
      JSON.stringify({ 
        success: true, 
        content: generatedText 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-homily function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function callGeminiWithRetry(prompt: string, maxRetries: number = 3): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = getNextApiKey();
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404) {
          throw new Error(`Gemini API 404 Error: The API endpoint was not found. Please ensure the Generative Language API is enabled.`);
        }
        throw new Error(`Gemini API error: ${response.statusText} (Status: ${response.status}) - ${errorText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('No content generated from Gemini API');
      }

      return generatedText;
    } catch (error) {
      console.warn(`API attempt ${attempt + 1} failed with key ending in ...${apiKey.slice(-4)}:`, error);
      lastError = error as Error;
      
      // If this is a rate limit error or quota exceeded, try the next key immediately
      if (error instanceof Error && (
        error.message.includes('429') || 
        error.message.includes('quota') || 
        error.message.includes('rate limit')
      )) {
        continue;
      }
      
      // For other errors, wait a bit before retrying
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('All API key attempts failed');
}