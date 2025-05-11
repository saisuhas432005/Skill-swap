
// AI Proxy Edge Function to handle CORS issues
import { corsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the target endpoint from the URL path
    const url = new URL(req.url);
    const target = url.pathname.split("/").pop();
    
    if (!target) {
      throw new Error("Missing target endpoint");
    }
    
    // Forward the request to the actual AI API
    const targetUrl = `https://skill-ai-api-1.onrender.com/${target}`;
    
    const headers = new Headers(req.headers);
    headers.set("Origin", "https://skill-ai-api-1.onrender.com");
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.blob() : undefined,
    });
    
    // Return the API response with CORS headers
    const body = await response.blob();
    
    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });
    
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error in AI proxy:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
