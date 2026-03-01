import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

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

    let targetUrl = url;
    if (!targetUrl.startsWith("http")) {
      targetUrl = "https://" + targetUrl;
    }

    const urlObj = new URL(targetUrl);
    const resolveUrl = (u: string) => {
      if (!u) return '';
      if (u.startsWith('http')) return u;
      if (u.startsWith('//')) return 'https:' + u;
      if (u.startsWith('/')) return urlObj.origin + u;
      return urlObj.origin + '/' + u;
    };

    // Step 1: Fetch homepage
    let homepageHtml = "";
    try {
      const response = await fetch(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Propopad/1.0)" },
      });
      homepageHtml = await response.text();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Could not access the website. Please check the URL and try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Extract basic meta data from homepage (fast, no AI needed)
    const result: Record<string, any> = {};

    // Agency name
    const ogSiteNameMatch = homepageHtml.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
      || homepageHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
    if (ogSiteNameMatch) {
      result.name = ogSiteNameMatch[1].trim();
    } else {
      const titleMatch = homepageHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        let title = titleMatch[1].trim();
        title = title.replace(/\s*[-|–—:·•]\s*(Home|Homepage|Welcome|Start|Startsida|Hem|Accueil|Inicio|Startseite).*$/i, "").trim();
        const separators = [' - ', ' | ', ' – ', ' — ', ' · '];
        for (const sep of separators) {
          if (title.includes(sep)) {
            const parts = title.split(sep).map(p => p.trim()).filter(Boolean);
            if (parts.length >= 2) {
              const sorted = [...parts].sort((a, b) => a.length - b.length);
              title = sorted[0].length < 60 ? sorted[0] : parts[parts.length - 1];
            }
            break;
          }
        }
        result.name = title;
      }
    }

    // Meta description (tagline)
    const descMatch = homepageHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || homepageHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    if (descMatch) result.tagline = descMatch[1].trim().slice(0, 200);

    // Logo detection
    const headerMatch = homepageHtml.match(/<header[\s\S]*?<\/header>/i);
    const headerHtml = headerMatch ? headerMatch[0] : homepageHtml.slice(0, 5000);
    const logoImgPatterns = [
      /<img[^>]*src=["']([^"']*logo[^"']*)["']/gi,
      /<(?:a|div|span)[^>]*(?:class|id)=["'][^"']*\blogo\b[^"']*["'][^>]*>\s*<img[^>]*src=["']([^"']+)["']/gi,
    ];
    let bestLogo: string | null = null;
    for (const pattern of logoImgPatterns) {
      const matches = [...headerHtml.matchAll(pattern)];
      for (const m of matches) {
        const src = m[1] || m[2];
        if (!src) continue;
        const resolved = resolveUrl(src);
        if (resolved.match(/\.svg(\?|$|&)/i)) { bestLogo = resolved; break; }
        if (!bestLogo && resolved.match(/\.png(\?|$|&)/i)) {
          const urlLower = resolved.toLowerCase();
          if (urlLower.includes('logo') || urlLower.includes('brand') || urlLower.includes('icon')) bestLogo = resolved;
        }
      }
      if (bestLogo?.match(/\.svg(\?|$|&)/i)) break;
    }
    if (!bestLogo) {
      const iconLinks = [...homepageHtml.matchAll(/<link[^>]*rel=["'](?:icon|apple-touch-icon|shortcut icon)["'][^>]*href=["']([^"']+)["'][^>]*/gi)];
      for (const m of iconLinks) {
        const href = resolveUrl(m[1]);
        if (href.match(/\.svg(\?|$|&)/i)) { bestLogo = href; break; }
        if (!bestLogo && href.match(/\.png(\?|$|&)/i)) {
          const sizeMatch = m[0].match(/sizes=["'](\d+)/i);
          if (sizeMatch && parseInt(sizeMatch[1]) >= 128) bestLogo = href;
        }
      }
    }
    if (bestLogo) result.logo_url = bestLogo.replace(/&amp;/g, '&');

    // Theme color & detected colors
    const themeColorMatch = homepageHtml.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)
      || homepageHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i);
    if (themeColorMatch) result.brand_color = themeColorMatch[1].trim();
    
    const colorMatches = homepageHtml.match(/#[0-9a-fA-F]{6}/g) || [];
    const uniqueColors = [...new Set(colorMatches)]
      .filter(c => !["#000000", "#ffffff", "#FFFFFF", "#333333", "#666666", "#999999", "#cccccc", "#CCCCCC"].includes(c))
      .slice(0, 5);
    if (uniqueColors.length > 0) {
      result.detected_colors = uniqueColors;
      if (!result.brand_color) result.brand_color = uniqueColors[0];
    }

    // Email & Phone
    const emailMatch = homepageHtml.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
      || homepageHtml.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) result.email = emailMatch[1];

    const phoneMatch = homepageHtml.match(/tel:([+\d\s\-().]+)/i)
      || homepageHtml.match(/((?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
    if (phoneMatch) result.phone = phoneMatch[1].trim();

    // Address from JSON-LD
    const jsonLdMatches = homepageHtml.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
          const ld = JSON.parse(jsonStr);
          const obj = Array.isArray(ld) ? ld[0] : ld;
          const addr = obj?.address || obj?.location?.address;
          if (addr) {
            const parts = [addr.streetAddress, [addr.addressLocality, addr.addressRegion, addr.postalCode].filter(Boolean).join(', '), addr.addressCountry].filter(Boolean);
            if (parts.length > 0) result.address = parts.join('\n');
          }
        } catch (_) {}
      }
    }
    if (!result.address) {
      const addressMatch = homepageHtml.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
      if (addressMatch) {
        const addrText = addressMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim().split('\n').map(l => l.trim()).filter(Boolean).join('\n');
        if (addrText.length > 5 && addrText.length < 300) result.address = addrText;
      }
    }

    // Step 3: Detect internal pages and fetch them
    // Include common paths in multiple languages (EN, SE, DE, etc.)
    const pagesToFetch = [
      '/about', '/about-us', '/who-we-are', '/om-oss', '/om',
      '/services', '/what-we-do', '/tjanster', '/tjanster/',
      '/testimonials', '/reviews', '/clients', '/kunder', '/referenser',
      '/work', '/case-studies', '/cases', '/kundcase', '/kundcase/', '/portfolio',
      '/contact', '/kontakt', '/kontakta-oss',
      '/references', '/referenties', '/projekte', '/projets',
    ];
    const navLinks = [...homepageHtml.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map(m => m[1])
      .filter(href => {
        try {
          const hrefUrl = new URL(href, targetUrl);
          return hrefUrl.origin === urlObj.origin && hrefUrl.pathname !== '/';
        } catch { return false; }
      })
      .map(href => {
        try { return new URL(href, targetUrl).pathname; } catch { return null; }
      })
      .filter(Boolean) as string[];

    const allPaths = [...new Set([...pagesToFetch, ...navLinks.slice(0, 15)])];
    
    // Fetch additional pages in parallel (limit to 12 for better coverage)
    const additionalContent: string[] = [];
    const caseStudyLinks: string[] = [];
    
    const fetchPromises = allPaths.slice(0, 12).map(async (path) => {
      try {
        const pageUrl = urlObj.origin + path;
        const resp = await fetch(pageUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; Propopad/1.0)" },
          signal: AbortSignal.timeout(5000),
        });
        if (resp.ok) {
          const text = await resp.text();
          
          // Check if this is a case study / portfolio listing page — extract subpage links
          const normalizedPath = path.replace(/\/$/, '');
          const isCasePage = /\/(kundcase|case-studies|cases|work|portfolio|testimonials|reviews|referenser|references|kunder)\/?$/i.test(path);
          if (isCasePage) {
            const subLinks = [...text.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi)]
              .map(m => {
                try { return new URL(m[1], urlObj.origin).pathname; } catch { return null; }
              })
              .filter(Boolean)
              .filter(p => {
                const norm = p!.replace(/\/$/, '');
                return norm.startsWith(normalizedPath) && norm !== normalizedPath && norm.length > normalizedPath.length + 1;
              }) as string[];
            caseStudyLinks.push(...subLinks);
          }
          
          // Strip HTML but preserve blockquote content with markers
          const cleaned = text
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[\s\S]*?<\/header>/gi, '')
            // Preserve blockquotes as quotes
            .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
              const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              return ` [QUOTE: "${text}"] `;
            })
            // Preserve figcaption / cite as attribution
            .replace(/<(?:figcaption|cite)[^>]*>([\s\S]*?)<\/(?:figcaption|cite)>/gi, (_, content) => {
              const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              return ` [ATTRIBUTION: ${text}] `;
            })
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000);
          if (cleaned.length > 50) {
            additionalContent.push(`[Page: ${path}]\n${cleaned}`);
          }
        }
      } catch (_) {}
    });
    await Promise.all(fetchPromises);

    // Step 3b: Fetch case study subpages for testimonials (up to 10)
    const uniqueCaseLinks = [...new Set(caseStudyLinks)].slice(0, 10);
    if (uniqueCaseLinks.length > 0) {
      console.log(`Found ${uniqueCaseLinks.length} case study subpages:`, uniqueCaseLinks);
      const casePromises = uniqueCaseLinks.map(async (path) => {
        try {
          const pageUrl = urlObj.origin + path;
          const resp = await fetch(pageUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; Propopad/1.0)" },
            signal: AbortSignal.timeout(5000),
          });
          if (resp.ok) {
            const text = await resp.text();
            const cleaned = text
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<nav[\s\S]*?<\/nav>/gi, '')
              .replace(/<footer[\s\S]*?<\/footer>/gi, '')
              .replace(/<header[\s\S]*?<\/header>/gi, '')
              .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
                const t = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                return ` [QUOTE: "${t}"] `;
              })
              .replace(/<(?:figcaption|cite)[^>]*>([\s\S]*?)<\/(?:figcaption|cite)>/gi, (_, content) => {
                const t = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                return ` [ATTRIBUTION: ${t}] `;
              })
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 5000);
            if (cleaned.length > 50) {
              additionalContent.push(`[Case study: ${path}]\n${cleaned}`);
            }
          }
        } catch (_) {}
      });
      await Promise.all(casePromises);
    }

    // Clean homepage text too
    const homepageText = homepageHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);

    // Step 4: Send everything to AI for structured parsing
    const allContent = `[Homepage]\n${homepageText}\n\n${additionalContent.join('\n\n')}`;
    console.log(`Scraped ${additionalContent.length} additional pages. Total content length: ${allContent.length} chars`);
    console.log(`Pages scraped: ${additionalContent.map(c => c.split('\n')[0]).join(', ')}`);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    let aiResult: any = null;

    if (apiKey) {
      try {
        const aiResponse = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `You are parsing a marketing agency's website content. Extract structured data and return ONLY valid JSON (no markdown, no code blocks).

Return this exact JSON structure:
{
  "agency": {
    "about_text": "2-3 sentence description of the agency",
    "years_in_business": null or number,
    "team_size": null or string like "5-10",
    "client_count": null or string like "50+"
  },
  "services_detected": ["keyword1", "keyword2"],
  "testimonials": [
    {
      "quote": "exact quote text",
      "client_name": "name",
      "client_title": "title or null",
      "client_company": "company or null",
      "metric_value": "+200% or null",
      "metric_label": "Organic Traffic or null"
    }
  ],
  "differentiators": {
    "intro": "One paragraph about why clients should choose this agency, based on what the website actually says",
    "cards": [
      {
        "title": "short title",
        "description": "one sentence",
        "stat_value": "value found on the site or empty string if not found",
        "stat_label": "label found on the site or empty string",
        "source": "scraped"
      }
    ]
  }
}

Rules:
- CRITICAL: ALL output text MUST be in English, regardless of the language of the source website. Translate ALL scraped content to natural, fluent English — including about_text, testimonial quotes, differentiator titles/descriptions/stat_labels/stat_values, intro paragraphs, and any other text fields. Do NOT leave any Swedish, German, French, Spanish, or other non-English text in the output.
- For services_detected, use these exact category names when they match: "Brand & Creative", "Website & Digital", "Content & Copywriting", "SEO & Organic Growth", "Paid Advertising", "Social Media", "Email Marketing", "Analytics & Data", "Marketing Strategy"
- TESTIMONIALS ARE CRITICAL: Extract ALL testimonials/client quotes you can find across ALL pages, especially case study pages. Look for:
  * Text marked with [QUOTE: "..."] — these are blockquotes from the HTML
  * Text near [ATTRIBUTION: ...] — these identify who said the quote
  * Any text that appears to be a client quote (first-person statements about working with the agency, often near a person's name and title/company)
  * Metrics/stats shown on case study pages (like "+265% ROAS") should be included as metric_value/metric_label on the corresponding testimonial
  * Translate all quotes to English while preserving meaning and tone
- For differentiators, ONLY use real data found on the website (mark as "scraped"). Do NOT invent or generate fake stats, KPI numbers, or differentiators. If fewer than 3 are found, that's fine — return only what you found. Translate all differentiator text to English.
- If data is not found, use null or empty string, don't invent testimonials or stats
- Return ONLY the JSON object, no other text`
              },
              {
                role: "user",
                content: `Parse this agency website content and extract ALL testimonials:\n\n${allContent.slice(0, 25000)}`
              }
            ],
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          // Try to parse JSON from response (handle markdown code blocks)
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiResult = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error("AI parsing failed:", e);
      }
    }

    // Step 5: Merge AI results with meta-extracted data
    if (aiResult) {
      if (aiResult.agency?.about_text) result.about_text = aiResult.agency.about_text;
      if (aiResult.agency?.years_in_business) result.years_in_business = aiResult.agency.years_in_business;
      if (aiResult.agency?.team_size) result.team_size = aiResult.agency.team_size;
      if (aiResult.agency?.client_count) result.client_count = aiResult.agency.client_count;
      if (aiResult.services_detected?.length > 0) result.detected_services = aiResult.services_detected;
      if (aiResult.testimonials?.length > 0) result.testimonials = aiResult.testimonials;
      if (aiResult.differentiators) result.differentiators = aiResult.differentiators;
    }

    // Fallback: detect services from keywords if AI didn't find them
    if (!result.detected_services?.length) {
      const lowerHtml = homepageHtml.toLowerCase();
      const serviceKeywords: Record<string, string[]> = {
        "Brand & Creative": ["branding", "brand identity", "logo design", "visual identity", "creative"],
        "Website & Digital": ["web design", "website", "web development", "ui/ux", "digital"],
        "Content & Copywriting": ["content", "copywriting", "blog", "editorial", "content marketing"],
        "SEO & Organic Growth": ["seo", "search engine", "organic", "search optimization", "sökmotoroptimering"],
        "Paid Advertising": ["ppc", "google ads", "paid media", "advertising", "paid search", "paid social", "annonsering", "ads"],
        "Social Media": ["social media", "instagram", "tiktok", "social management", "sociala medier"],
        "Email Marketing": ["email marketing", "newsletter", "email automation"],
        "Analytics & Data": ["analytics", "data", "conversion", "tracking", "reporting"],
        "Marketing Strategy": ["strategy", "consulting", "marketing strategy", "growth strategy", "tillväxt"],
      };
      const detected: string[] = [];
      for (const [group, keywords] of Object.entries(serviceKeywords)) {
        if (keywords.some(kw => lowerHtml.includes(kw))) detected.push(group);
      }
      result.detected_services = detected;
    }

    // Detect language
    const langMatch = homepageHtml.match(/<html[^>]*\slang=["']([^"']+)["']/i);
    if (langMatch) result.detected_language = langMatch[1].split('-')[0].toLowerCase();

    // Auto-detect currency from TLD
    const tld = urlObj.hostname.split('.').pop()?.toLowerCase();
    const tldCurrencyMap: Record<string, { code: string; symbol: string }> = {
      'se': { code: 'SEK', symbol: 'kr' },
      'uk': { code: 'GBP', symbol: '£' },
      'de': { code: 'EUR', symbol: '€' },
      'fr': { code: 'EUR', symbol: '€' },
      'nl': { code: 'EUR', symbol: '€' },
      'au': { code: 'AUD', symbol: 'A$' },
      'ca': { code: 'CAD', symbol: 'C$' },
    };
    if (tld && tldCurrencyMap[tld]) {
      result.detected_currency = tldCurrencyMap[tld];
    }

    // Count fields found
    const fieldsFound = ["name", "email", "phone", "brand_color", "logo_url", "tagline", "about_text"]
      .filter(f => result[f]).length;
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
