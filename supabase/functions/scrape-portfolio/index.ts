import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/').replace(/&nbsp;/g, ' ');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, service_groups } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    console.log("Scraping portfolio URL:", formattedUrl);

    // Fetch the page
    let html: string;
    try {
      const resp = await fetch(formattedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Propopad/1.0)" },
        redirect: "follow",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      html = await resp.text();
    } catch (e) {
      console.error("Fetch failed:", e);
      return new Response(JSON.stringify({ error: "We couldn't access this page. Check the URL and try again." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = new URL(formattedUrl).origin;

    // Resolve relative URLs
    const resolveUrl = (u: string): string => {
      if (!u || u.startsWith("data:")) return "";
      if (u.startsWith("http")) return u;
      if (u.startsWith("//")) return "https:" + u;
      if (u.startsWith("/")) return baseUrl + u;
      return baseUrl + "/" + u;
    };

    // Extract images from the page for context
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
    const pageImages: { url: string; alt: string }[] = [];
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const src = resolveUrl(imgMatch[1]);
      if (!src) continue;
      // Filter out tiny icons, trackers, svgs
      if (src.includes("favicon") || src.includes("pixel") || src.includes(".svg") || src.includes("1x1") || src.includes("tracking")) continue;
      const alt = imgMatch[2] ? decodeHtmlEntities(imgMatch[2]) : "";
      pageImages.push({ url: src, alt });
    }

    // Also check for background images in style attributes
    const bgRegex = /style=["'][^"']*background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
    let bgMatch;
    while ((bgMatch = bgRegex.exec(html)) !== null) {
      const src = resolveUrl(bgMatch[1]);
      if (src && !src.includes(".svg")) {
        pageImages.push({ url: src, alt: "" });
      }
    }

    // Strip scripts/styles for cleaner text extraction
    const cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "");

    const textContent = cleanHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    // Use AI to extract portfolio items
    const serviceGroupList = (service_groups || []).join(", ");
    
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a portfolio page parser. Extract individual portfolio/case study projects from a webpage.

For each project found, extract:
- title: The project name/heading
- description: A 1-3 sentence summary of the project
- category: Try to match to one of these service groups: ${serviceGroupList || "Brand & Creative, Website & Digital, Content & Copywriting, SEO & Organic Growth, Paid Advertising, Social Media, Email Marketing, Analytics & Data, Marketing Strategy"}. If no match, use "Other".
- image_urls: Array of image URLs associated with this project (from the page images list provided)

Rules:
- Only extract REAL projects shown on the page, do NOT invent projects
- If the page doesn't appear to be a portfolio/work page, return an empty array
- Return at most 12 projects
- For images, match them to projects by proximity in the HTML or by alt text relevance
- Return ONLY valid JSON, no other text

Return format:
{
  "projects": [
    {
      "title": "Project Name",
      "description": "Brief description",
      "category": "Matched Category",
      "image_urls": ["https://..."]
    }
  ]
}`
          },
          {
            role: "user",
            content: `Parse this portfolio page for projects.\n\nPage URL: ${formattedUrl}\n\nAvailable images on page (${pageImages.length} total):\n${pageImages.slice(0, 50).map((img, i) => `${i + 1}. ${img.url} (alt: "${img.alt}")`).join("\n")}\n\nPage text content:\n${textContent.slice(0, 12000)}\n\nRelevant HTML structure:\n${cleanHtml.slice(0, 8000)}`
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI request failed:", aiResponse.status);
      return new Response(JSON.stringify({ error: "Failed to analyze page content" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    console.log("AI response length:", content.length);

    let projects: any[] = [];
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        let jsonStr = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
        const parsed = JSON.parse(jsonStr);
        projects = parsed.projects || [];
      } catch (e) {
        console.error("JSON parse failed:", e);
      }
    }

    if (projects.length === 0) {
      return new Response(JSON.stringify({
        projects: [],
        message: "We couldn't detect portfolio items on this page. Try a different URL, or add projects manually."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean up and validate projects
    const cleanProjects = projects.map((p: any, i: number) => ({
      title: decodeHtmlEntities(String(p.title || `Project ${i + 1}`)).trim(),
      description: p.description ? decodeHtmlEntities(String(p.description)).trim() : null,
      category: String(p.category || "Other"),
      image_urls: (p.image_urls || []).filter((u: string) => u && u.startsWith("http")).slice(0, 6),
    }));

    console.log(`Found ${cleanProjects.length} portfolio projects`);

    return new Response(JSON.stringify({ projects: cleanProjects }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Portfolio scrape error:", error);
    return new Response(JSON.stringify({ error: "An error occurred while scanning the portfolio page." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
