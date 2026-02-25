import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize URL
    let targetUrl = url;
    if (!targetUrl.startsWith("http")) {
      targetUrl = "https://" + targetUrl;
    }

    // Fetch the website HTML
    let html = "";
    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Propopad/1.0)",
        },
      });
      html = await response.text();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Could not access the website. Please check the URL and try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract data from HTML
    const result: Record<string, any> = {};

    // Title / Agency Name
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      let title = titleMatch[1].trim();
      // Clean common suffixes
      title = title.replace(/\s*[-|–—]\s*(Home|Homepage|Welcome).*$/i, "").trim();
      title = title.replace(/\s*[-|–—]\s*$/i, "").trim();
      result.name = title;
    }

    // Meta description (tagline)
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    if (descMatch) {
      result.tagline = descMatch[1].trim().slice(0, 200);
    }

    // OG Image (logo candidate)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch) {
      let logoUrl = ogImageMatch[1];
      if (logoUrl.startsWith("/")) {
        const urlObj = new URL(targetUrl);
        logoUrl = urlObj.origin + logoUrl;
      }
      result.logo_url = logoUrl;
    }

    // Theme color (brand color)
    const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i);
    if (themeColorMatch) {
      result.brand_color = themeColorMatch[1].trim();
    }

    // Extract colors from inline styles and CSS for suggestions
    const colorMatches = html.match(/#[0-9a-fA-F]{6}/g) || [];
    const uniqueColors = [...new Set(colorMatches)]
      .filter((c) => !["#000000", "#ffffff", "#FFFFFF", "#333333", "#666666", "#999999", "#cccccc", "#CCCCCC"].includes(c))
      .slice(0, 5);
    if (uniqueColors.length > 0) {
      result.detected_colors = uniqueColors;
      if (!result.brand_color) {
        result.brand_color = uniqueColors[0];
      }
    }

    // Email
    const emailMatch = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
      || html.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      result.email = emailMatch[1];
    }

    // Phone
    const phoneMatch = html.match(/tel:([+\d\s\-().]+)/i)
      || html.match(/((?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
    if (phoneMatch) {
      result.phone = phoneMatch[1].trim();
    }

    // Detect service keywords for auto-selecting groups in Step 2
    const lowerHtml = html.toLowerCase();
    const serviceKeywords: Record<string, string[]> = {
      "Brand & Creative": ["branding", "brand identity", "logo design", "visual identity", "creative"],
      "Website & Digital": ["web design", "website", "web development", "ui/ux", "digital"],
      "Content & Copywriting": ["content", "copywriting", "blog", "editorial", "content marketing"],
      "SEO & Organic Growth": ["seo", "search engine", "organic", "search optimization"],
      "Paid Advertising": ["ppc", "google ads", "paid media", "advertising", "paid search", "paid social"],
      "Social Media": ["social media", "instagram", "tiktok", "social management"],
      "Email Marketing": ["email marketing", "newsletter", "email automation", "email campaign"],
      "Analytics & Data": ["analytics", "data", "conversion", "tracking", "reporting"],
      "Marketing Strategy": ["strategy", "consulting", "marketing strategy", "growth strategy"],
    };

    const detectedServices: string[] = [];
    for (const [group, keywords] of Object.entries(serviceKeywords)) {
      if (keywords.some((kw) => lowerHtml.includes(kw))) {
        detectedServices.push(group);
      }
    }
    result.detected_services = detectedServices;

    // Count how many fields were found
    const fieldsFound = ["name", "email", "phone", "brand_color", "logo_url", "tagline"]
      .filter((f) => result[f]).length;
    result.fields_found = fieldsFound;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "An error occurred while scanning the website." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
