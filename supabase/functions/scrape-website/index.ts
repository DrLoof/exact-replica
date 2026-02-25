import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Title / Agency Name - extract and clean thoroughly
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      let title = titleMatch[1].trim();
      // Remove common suffixes/prefixes with separators
      title = title.replace(/\s*[-|–—:·•]\s*(Home|Homepage|Welcome|Start|Startsida|Hem|Accueil|Inicio|Startseite).*$/i, "").trim();
      title = title.replace(/\s*[-|–—]\s*$/i, "").trim();

      // If title has a separator, try to extract the brand name (usually the shorter/last part)
      const separators = [' - ', ' | ', ' – ', ' — ', ' · '];
      for (const sep of separators) {
        if (title.includes(sep)) {
          const parts = title.split(sep).map(p => p.trim()).filter(Boolean);
          // The brand name is typically the shortest part or the last part
          // Heuristic: pick the part that looks most like a company name (shorter, fewer common words)
          if (parts.length >= 2) {
            // Sort by length, prefer shorter as brand name
            const sorted = [...parts].sort((a, b) => a.length - b.length);
            // If the shortest part is under 60 chars, use it as the name
            title = sorted[0].length < 60 ? sorted[0] : parts[parts.length - 1];
          }
          break;
        }
      }
      
      result.name = title;
    }

    // OG site_name (often the cleanest brand name)
    const ogSiteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
    if (ogSiteNameMatch) {
      // og:site_name is usually the cleanest brand name, prefer it
      result.name = ogSiteNameMatch[1].trim();
    }

    // Meta description (tagline)
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    if (descMatch) {
      result.tagline = descMatch[1].trim().slice(0, 200);
    }

    // OG title as fallback for name
    if (!result.name) {
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      if (ogTitleMatch) {
        result.name = ogTitleMatch[1].trim();
      }
    }

    // Logo detection — ONLY use transparent-capable formats (SVG, PNG)
    // Only look in the header area (first 5000 chars) to avoid content images
    const urlObj = new URL(targetUrl);
    const resolveUrl = (u: string) => {
      if (!u) return '';
      if (u.startsWith('http')) return u;
      if (u.startsWith('//')) return 'https:' + u;
      if (u.startsWith('/')) return urlObj.origin + u;
      return urlObj.origin + '/' + u;
    };

    // Extract header region for logo search (between <header> tags, or first 5000 chars)
    const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
    const headerHtml = headerMatch ? headerMatch[0] : html.slice(0, 5000);

    const logoImgPatterns = [
      // img with "logo" in src path
      /<img[^>]*src=["']([^"']*logo[^"']*)["']/gi,
      // img inside element with logo class/id (only direct children, no greedy matching)
      /<(?:a|div|span)[^>]*(?:class|id)=["'][^"']*\blogo\b[^"']*["'][^>]*>\s*<img[^>]*src=["']([^"']+)["']/gi,
    ];

    let bestLogo: string | null = null;

    for (const pattern of logoImgPatterns) {
      const matches = [...headerHtml.matchAll(pattern)];
      for (const m of matches) {
        const src = m[1] || m[2];
        if (!src) continue;
        const resolved = resolveUrl(src);
        // Only accept SVG or PNG
        if (resolved.match(/\.svg(\?|$|&)/i)) {
          bestLogo = resolved;
          break;
        }
        if (!bestLogo && resolved.match(/\.png(\?|$|&)/i)) {
          // Additional check: skip if URL looks like a content/hero image (very long hash paths without "logo")
          const urlLower = resolved.toLowerCase();
          if (urlLower.includes('logo') || urlLower.includes('brand') || urlLower.includes('icon')) {
            bestLogo = resolved;
          }
        }
      }
      if (bestLogo?.match(/\.svg(\?|$|&)/i)) break;
    }

    // Check for SVG/PNG favicon as fallback
    if (!bestLogo) {
      const iconLinks = [...html.matchAll(/<link[^>]*rel=["'](?:icon|apple-touch-icon|shortcut icon)["'][^>]*href=["']([^"']+)["'][^>]*/gi)];
      for (const m of iconLinks) {
        const href = resolveUrl(m[1]);
        if (href.match(/\.svg(\?|$|&)/i)) {
          bestLogo = href;
          break;
        }
        if (!bestLogo && href.match(/\.png(\?|$|&)/i)) {
          const sizeMatch = m[0].match(/sizes=["'](\d+)/i);
          if (sizeMatch && parseInt(sizeMatch[1]) >= 128) {
            bestLogo = href;
          }
        }
      }
    }

    // Do NOT fall back to og:image — it's almost never transparent
    if (bestLogo) {
      // Clean up HTML entities in URL
      result.logo_url = bestLogo.replace(/&amp;/g, '&');
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

    // Address - try JSON-LD structured data first
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
          const ld = JSON.parse(jsonStr);
          const obj = Array.isArray(ld) ? ld[0] : ld;
          const addr = obj?.address || obj?.location?.address;
          if (addr) {
            const parts = [
              addr.streetAddress,
              [addr.addressLocality, addr.addressRegion, addr.postalCode].filter(Boolean).join(', '),
              addr.addressCountry,
            ].filter(Boolean);
            if (parts.length > 0) {
              result.address = parts.join('\n');
            }
          }
        } catch (_) { /* invalid JSON-LD */ }
      }
    }

    // Fallback: try to find address in common HTML patterns
    if (!result.address) {
      const addressMatch = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
      if (addressMatch) {
        const addrText = addressMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&nbsp;/g, ' ')
          .trim()
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
          .join('\n');
        if (addrText.length > 5 && addrText.length < 300) {
          result.address = addrText;
        }
      }
    }

    const langMatch = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
    const detectedLang = langMatch ? langMatch[1].split('-')[0].toLowerCase() : null;
    const isNonEnglish = detectedLang && detectedLang !== 'en';

    // Simple translation for common non-English text in name/tagline
    // For non-English sites, try to clean up the name and provide a translated tagline hint
    if (isNonEnglish) {
      result.detected_language = detectedLang;
      
      // If og:description is available in English, prefer it
      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
      if (ogDescMatch) {
        // Sometimes og:description is more concise
        const ogDesc = ogDescMatch[1].trim();
        if (ogDesc.length < (result.tagline?.length || Infinity)) {
          result.tagline = ogDesc;
        }
      }

      // Use Google Translate API (free tier, no key needed for small requests)
      try {
        const textsToTranslate: string[] = [];
        const fieldKeys: string[] = [];

        if (result.tagline) {
          textsToTranslate.push(result.tagline);
          fieldKeys.push('tagline');
        }
        // Only translate name if it looks like a sentence (>3 words), not a brand name
        if (result.name && result.name.split(/\s+/).length > 3) {
          textsToTranslate.push(result.name);
          fieldKeys.push('name');
        }

        if (textsToTranslate.length > 0) {
          const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${detectedLang}&tl=en&dt=t&q=${encodeURIComponent(textsToTranslate.join('\n||||\n'))}`;
          const transResp = await fetch(translateUrl);
          if (transResp.ok) {
            const transData = await transResp.json();
            const translatedText = transData[0]?.map((s: any) => s[0]).join('') || '';
            const translatedParts = translatedText.split('\n||||\n');
            
            for (let i = 0; i < fieldKeys.length; i++) {
              if (translatedParts[i]) {
                result[fieldKeys[i]] = translatedParts[i].trim();
              }
            }
          }
        }
      } catch (_) {
        // Translation failed, keep original text
      }
    }

    // Detect service keywords for auto-selecting groups in Step 2
    const lowerHtml = html.toLowerCase();
    const serviceKeywords: Record<string, string[]> = {
      "Brand & Creative": ["branding", "brand identity", "logo design", "visual identity", "creative", "varumärke", "marque", "marca"],
      "Website & Digital": ["web design", "website", "web development", "ui/ux", "digital", "webbdesign", "webbplats", "webbutveckling"],
      "Content & Copywriting": ["content", "copywriting", "blog", "editorial", "content marketing", "innehåll", "contenu"],
      "SEO & Organic Growth": ["seo", "search engine", "organic", "search optimization", "sökmotoroptimering"],
      "Paid Advertising": ["ppc", "google ads", "paid media", "advertising", "paid search", "paid social", "annonsering", "publicité"],
      "Social Media": ["social media", "instagram", "tiktok", "social management", "sociala medier", "réseaux sociaux"],
      "Email Marketing": ["email marketing", "newsletter", "email automation", "email campaign", "e-postmarknadsföring"],
      "Analytics & Data": ["analytics", "data", "conversion", "tracking", "reporting", "analys", "analyse"],
      "Marketing Strategy": ["strategy", "consulting", "marketing strategy", "growth strategy", "strategi", "stratégie"],
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
