import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const DEFAULT_CATEGORIES = [
  "Brand & Creative",
  "Website & Digital",
  "Content & Copywriting",
  "SEO & Organic Growth",
  "Paid Advertising",
  "Social Media",
  "Email Marketing",
  "Analytics & Data",
  "Marketing Strategy",
];

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/').replace(/&nbsp;/g, ' ');
}

function resolveUrl(u: string, baseUrl: string): string {
  if (!u || u.startsWith("data:")) return "";
  if (u.startsWith("http")) return u;
  if (u.startsWith("//")) return "https:" + u;
  if (u.startsWith("/")) return baseUrl + u;
  return baseUrl + "/" + u;
}

/** Extract images from HTML, handling lazy-loading attributes */
function extractImages(html: string, baseUrl: string): { url: string; alt: string }[] {
  const images: { url: string; alt: string }[] = [];
  const seen = new Set<string>();

  // Match all <img> tags and extract all relevant attributes
  const imgTagRegex = /<img\s[^>]*>/gi;
  let tagMatch;
  while ((tagMatch = imgTagRegex.exec(html)) !== null) {
    const tag = tagMatch[0];

    // Try data-src first (lazy loading), then data-srcset, then src
    const dataSrcMatch = tag.match(/data-src=["']([^"']+)["']/i);
    const srcMatch = tag.match(/\ssrc=["']([^"']+)["']/i);
    const dataSrcsetMatch = tag.match(/data-srcset=["']([^"']+)["']/i);
    const srcsetMatch = tag.match(/srcset=["']([^"']+)["']/i);
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);

    let bestSrc = "";

    // Prefer data-src (actual lazy-loaded image)
    if (dataSrcMatch?.[1]) {
      bestSrc = dataSrcMatch[1];
    } else if (srcMatch?.[1] && !srcMatch[1].startsWith("data:")) {
      bestSrc = srcMatch[1];
    }

    // If no direct src, try to get first entry from srcset/data-srcset
    if (!bestSrc) {
      const srcsetVal = dataSrcsetMatch?.[1] || srcsetMatch?.[1];
      if (srcsetVal) {
        const firstEntry = srcsetVal.split(",")[0].trim().split(/\s+/)[0];
        if (firstEntry) bestSrc = firstEntry;
      }
    }

    const resolved = resolveUrl(bestSrc, baseUrl);
    if (!resolved) continue;

    // Filter out icons, trackers, svgs, placeholders
    if (resolved.includes("favicon") || resolved.includes("pixel") || resolved.includes(".svg") || 
        resolved.includes("1x1") || resolved.includes("tracking") || resolved.includes("logo")) continue;

    if (seen.has(resolved)) continue;
    seen.add(resolved);

    const alt = altMatch?.[1] ? decodeHtmlEntities(altMatch[1]) : "";
    images.push({ url: resolved, alt });
  }

  // Also check background images in style attributes
  const bgRegex = /style=["'][^"']*background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
  let bgMatch;
  while ((bgMatch = bgRegex.exec(html)) !== null) {
    const src = resolveUrl(bgMatch[1], baseUrl);
    if (src && !src.includes(".svg") && !seen.has(src)) {
      seen.add(src);
      images.push({ url: src, alt: "" });
    }
  }

  return images;
}

/** Fetch a case study subpage and extract text content */
async function fetchSubpageContent(subpageUrl: string): Promise<string> {
  try {
    const resp = await fetch(subpageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Propopad/1.0)" },
      redirect: "follow",
    });
    if (!resp.ok) return "";
    const html = await resp.text();
    // Strip scripts/styles/nav/footer/header
    const clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "");
    return clean.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);
  } catch {
    return "";
  }
}

/** Extract case study subpage links from the listing page */
function extractCaseStudyLinks(html: string, baseUrl: string): Map<string, string> {
  const links = new Map<string, string>(); // title -> url
  
  // Look for links inside case study containers or portfolio items
  const linkRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*(?:title=["']([^"']+)["'])?[^>]*>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const title = match[2] ? decodeHtmlEntities(match[2]) : "";
    if (!href || href === "#" || href.includes("javascript:")) continue;
    
    // Only include links that look like case study detail pages (not external)
    const resolved = resolveUrl(href, baseUrl);
    if (!resolved) continue;
    
    // Must be same domain and look like a detail page
    if (!resolved.startsWith(baseUrl)) continue;
    if (resolved === baseUrl || resolved === baseUrl + "/") continue;
    
    // Check if it looks like a case study / portfolio detail URL
    const path = new URL(resolved).pathname;
    if (path.split("/").filter(Boolean).length >= 2 && title) {
      links.set(title, resolved);
    }
  }
  
  return links;
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

    // Extract images with lazy-loading support
    const pageImages = extractImages(html, baseUrl);
    console.log(`Extracted ${pageImages.length} images (with lazy-load support)`);

    // Extract case study subpage links
    const caseStudyLinks = extractCaseStudyLinks(html, baseUrl);
    console.log(`Found ${caseStudyLinks.size} case study subpage links`);

    // Fetch up to 12 subpages in parallel for descriptions
    const subpageEntries = Array.from(caseStudyLinks.entries()).slice(0, 12);
    const subpageContents = new Map<string, string>();
    if (subpageEntries.length > 0) {
      const fetches = subpageEntries.map(async ([title, spUrl]) => {
        const content = await fetchSubpageContent(spUrl);
        if (content) subpageContents.set(title, content);
      });
      await Promise.all(fetches);
      console.log(`Fetched ${subpageContents.size} subpage contents for descriptions`);
    }

    // Strip scripts/styles for cleaner text extraction
    const cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "");

    const textContent = cleanHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    // Build subpage context for AI
    let subpageContext = "";
    if (subpageContents.size > 0) {
      subpageContext = "\n\nCase study subpage content (use this for descriptions and category inference):\n";
      for (const [title, content] of subpageContents) {
        subpageContext += `\n--- ${title} ---\n${content.slice(0, 1500)}\n`;
      }
    }

    const categories = (service_groups && service_groups.length > 0) ? service_groups : DEFAULT_CATEGORIES;
    const serviceGroupList = categories.join(", ");
    
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
            content: `You are a portfolio page parser for a marketing agency. Extract individual portfolio/case study projects from a webpage.

For each project found, extract:
- title: The project/client name
- description: A 1-3 sentence summary describing what the agency did for this client. Use subpage content if provided for richer descriptions. If no detail is available, write a brief description based on context clues (client industry, project type visible in images/titles).
- category: Assign the BEST matching category from this list: ${serviceGroupList}. 
  CATEGORY ASSIGNMENT RULES:
  - Analyze the project title, description, subpage content, and any visible tags/labels
  - Consider the TYPE OF WORK done (e.g. if it mentions "social media campaign" → Social Media, "website redesign" → Website & Digital, "SEO" → SEO & Organic Growth, "branding" → Brand & Creative, "email campaign" → Email Marketing, "Google Ads" or "PPC" → Paid Advertising)
  - If the subpage mentions multiple services, pick the primary/most prominent one
  - If the project is about content creation, blog posts, or copywriting → Content & Copywriting
  - If it's about data analysis, reporting, dashboards → Analytics & Data
  - If it's a general marketing engagement or strategic consulting → Marketing Strategy
  - ONLY use "Other" as an absolute last resort when there is truly no signal
- image_urls: Array of image URLs associated with this project from the provided image list. Match by proximity in HTML, alt text relevance, or URL containing the project/client name.

Rules:
- Only extract REAL projects shown on the page, do NOT invent projects
- If the page doesn't appear to be a portfolio/work page, return an empty array
- Return at most 12 projects
- ALWAYS try to assign a real category — "Other" should be rare
- Return ONLY valid JSON, no markdown fences, no other text

Return format:
{
  "projects": [
    {
      "title": "Project Name",
      "description": "Brief description of what was done",
      "category": "Matched Category",
      "image_urls": ["https://..."]
    }
  ]
}`
          },
          {
            role: "user",
            content: `Parse this portfolio page for projects.\n\nPage URL: ${formattedUrl}\n\nAvailable images on page (${pageImages.length} total):\n${pageImages.slice(0, 50).map((img, i) => `${i + 1}. ${img.url} (alt: "${img.alt}")`).join("\n")}\n\nPage text content:\n${textContent.slice(0, 8000)}\n\nRelevant HTML structure:\n${cleanHtml.slice(0, 6000)}${subpageContext.slice(0, 8000)}`
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

    // Log category distribution for debugging
    const catCounts: Record<string, number> = {};
    cleanProjects.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
    console.log(`Found ${cleanProjects.length} portfolio projects. Categories:`, JSON.stringify(catCounts));

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
