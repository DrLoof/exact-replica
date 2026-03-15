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

/** Extract the best hero/feature image from a detail page HTML */
function extractHeroImage(html: string, baseUrl: string): string | null {
  // 1. Check og:image meta tag (highest priority — curated by site owner)
  const ogMatch = html.match(/<meta\s[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\s[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogMatch?.[1]) {
    const resolved = resolveUrl(ogMatch[1], baseUrl);
    if (resolved && !resolved.includes(".svg")) return resolved;
  }

  // 2. Check twitter:image
  const twitterMatch = html.match(/<meta\s[^>]*(?:name|property)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\s[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']twitter:image["']/i);
  if (twitterMatch?.[1]) {
    const resolved = resolveUrl(twitterMatch[1], baseUrl);
    if (resolved && !resolved.includes(".svg")) return resolved;
  }

  // 3. Look for the first large image in the main content area
  // Strip nav/header/footer first to focus on content
  const contentHtml = html
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "");

  const imgTagRegex = /<img\s[^>]*>/gi;
  let tagMatch;
  while ((tagMatch = imgTagRegex.exec(contentHtml)) !== null) {
    const tag = tagMatch[0];

    // Check if it has a meaningful width (skip tiny images)
    const widthMatch = tag.match(/width=["']?(\d+)/i);
    if (widthMatch && parseInt(widthMatch[1]) < 200) continue;

    // Skip known non-content images
    if (tag.includes("avatar") || tag.includes("icon") || tag.includes("logo") || 
        tag.includes("gravatar") || tag.includes("emoji") || tag.includes("badge")) continue;

    // Extract best src (data-src > src, skip data: URIs)
    const dataSrcMatch = tag.match(/data-src=["']([^"']+)["']/i);
    const srcMatch = tag.match(/\ssrc=["']([^"']+)["']/i);
    const dataSrcsetMatch = tag.match(/data-srcset=["']([^"']+)["']/i);

    let bestSrc = "";
    if (dataSrcMatch?.[1]) bestSrc = dataSrcMatch[1];
    else if (srcMatch?.[1] && !srcMatch[1].startsWith("data:")) bestSrc = srcMatch[1];
    else if (dataSrcsetMatch?.[1]) {
      bestSrc = dataSrcsetMatch[1].split(",")[0].trim().split(/\s+/)[0];
    }

    const resolved = resolveUrl(bestSrc, baseUrl);
    if (resolved && !resolved.includes(".svg") && !resolved.includes("favicon") && !resolved.includes("pixel")) {
      return resolved;
    }
  }

  // 4. Check for hero background images in inline styles
  const bgMatch = contentHtml.match(/class=["'][^"']*hero[^"']*["'][^>]*style=["'][^"']*background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/i)
    || contentHtml.match(/style=["'][^"']*background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)[^"']*["'][^>]*class=["'][^"']*hero/i);
  if (bgMatch?.[1]) {
    const resolved = resolveUrl(bgMatch[1], baseUrl);
    if (resolved) return resolved;
  }

  return null;
}

interface SubpageData {
  text: string;
  heroImage: string | null;
}

/** Fetch a case study subpage and extract text content + hero image */
async function fetchSubpageData(subpageUrl: string, baseUrl: string): Promise<SubpageData> {
  try {
    const resp = await fetch(subpageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Propopad/1.0)" },
      redirect: "follow",
    });
    if (!resp.ok) return { text: "", heroImage: null };
    const html = await resp.text();

    // Extract hero image before stripping HTML
    const heroImage = extractHeroImage(html, baseUrl);

    // Strip scripts/styles/nav/footer/header for text
    const clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "");
    const text = clean.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);

    return { text, heroImage };
  } catch {
    return { text: "", heroImage: null };
  }
}

/** Extract case study subpage links from the listing page */
function extractCaseStudyLinks(html: string, baseUrl: string): Map<string, string> {
  const links = new Map<string, string>(); // title -> url
  
  const linkRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*(?:title=["']([^"']+)["'])?[^>]*>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const title = match[2] ? decodeHtmlEntities(match[2]) : "";
    if (!href || href === "#" || href.includes("javascript:")) continue;
    
    const resolved = resolveUrl(href, baseUrl);
    if (!resolved || !resolved.startsWith(baseUrl)) continue;
    if (resolved === baseUrl || resolved === baseUrl + "/") continue;
    
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

    // Extract images with lazy-loading support from listing page
    const pageImages = extractImages(html, baseUrl);
    console.log(`Extracted ${pageImages.length} images from listing page`);

    // Extract case study subpage links
    const caseStudyLinks = extractCaseStudyLinks(html, baseUrl);
    console.log(`Found ${caseStudyLinks.size} case study subpage links`);

    // Fetch up to 12 subpages in parallel for descriptions AND hero images
    const subpageEntries = Array.from(caseStudyLinks.entries()).slice(0, 12);
    const subpageResults = new Map<string, SubpageData>();
    if (subpageEntries.length > 0) {
      const fetches = subpageEntries.map(async ([title, spUrl]) => {
        const data = await fetchSubpageData(spUrl, baseUrl);
        if (data.text || data.heroImage) subpageResults.set(title, data);
      });
      await Promise.all(fetches);
      
      const heroCount = Array.from(subpageResults.values()).filter(d => d.heroImage).length;
      console.log(`Fetched ${subpageResults.size} subpages (${heroCount} with hero images)`);
    }

    // Build a map of title -> hero images from subpages (for AI to use)
    const subpageHeroImages: Record<string, string> = {};
    for (const [title, data] of subpageResults) {
      if (data.heroImage) subpageHeroImages[title] = data.heroImage;
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
    if (subpageResults.size > 0) {
      subpageContext = "\n\nCase study subpage content (use for descriptions, category inference, AND image matching):\n";
      for (const [title, data] of subpageResults) {
        subpageContext += `\n--- ${title} ---\n`;
        if (data.heroImage) subpageContext += `Hero image: ${data.heroImage}\n`;
        subpageContext += `${data.text.slice(0, 1500)}\n`;
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
- image_urls: Array of image URLs associated with this project. IMAGE PRIORITY:
  1. If a "Hero image" URL is listed in the subpage content section below, USE IT FIRST — it's the best representation
  2. Then look for images from the listing page that match by alt text or URL containing the project/client name
  3. Include up to 3 images per project, hero image first

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

    // Clean up and validate projects, ensuring hero images from subpages are included
    const cleanProjects = projects.map((p: any, i: number) => {
      const title = decodeHtmlEntities(String(p.title || `Project ${i + 1}`)).trim();
      let imageUrls: string[] = (p.image_urls || []).filter((u: string) => u && u.startsWith("http"));
      
      // If we have a hero image from the subpage for this project, ensure it's first
      const heroImg = subpageHeroImages[title];
      if (heroImg) {
        // Remove if already present, then prepend
        imageUrls = imageUrls.filter((u: string) => u !== heroImg);
        imageUrls.unshift(heroImg);
      }

      // If still no images, try fuzzy matching subpage hero images by title similarity
      if (imageUrls.length === 0) {
        for (const [spTitle, spImg] of Object.entries(subpageHeroImages)) {
          if (spTitle.toLowerCase().includes(title.toLowerCase()) || 
              title.toLowerCase().includes(spTitle.toLowerCase())) {
            imageUrls.push(spImg);
            break;
          }
        }
      }

      return {
        title,
        description: p.description ? decodeHtmlEntities(String(p.description)).trim() : null,
        category: String(p.category || "Other"),
        image_urls: imageUrls.slice(0, 6),
      };
    });

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
