// Scrape website edge function v3 — Smart multi-page testimonial discovery
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Extract quotes from HTML with rich patterns
function extractQuotesFromHtml(html: string, pagePath: string): { quote: string; attribution: string; context: string }[] {
  const quotes: { quote: string; attribution: string; context: string }[] = [];

  // Pattern 1: <blockquote> elements
  const blockquoteRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
  let match;
  while ((match = blockquoteRegex.exec(html)) !== null) {
    const quoteText = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (quoteText.length < 15 || quoteText.length > 1000) continue;
    
    // Look for attribution nearby (next 500 chars after the blockquote)
    const afterQuote = html.slice(match.index + match[0].length, match.index + match[0].length + 500);
    const attrMatch = afterQuote.match(/<(?:figcaption|cite|p|span|div)[^>]*(?:class=["'][^"']*(?:author|attribution|cite|name|credit|source)[^"']*["'])?[^>]*>([\s\S]*?)<\/(?:figcaption|cite|p|span|div)>/i);
    const attribution = attrMatch ? attrMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    
    quotes.push({ quote: quoteText, attribution, context: pagePath });
  }

  // Pattern 2: Elements with testimonial/quote class names
  const classPatterns = [
    /<(?:div|section|article|figure)[^>]*class=["'][^"']*(?:testimonial|quote|review|client-quote|pullquote|customer-quote|feedback)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|article|figure)>/gi,
  ];
  for (const pattern of classPatterns) {
    while ((match = pattern.exec(html)) !== null) {
      const block = match[1];
      // Extract quote text (look for p, blockquote, or quoted text)
      const quoteMatch = block.match(/<(?:p|blockquote|q|span)[^>]*>([\s\S]*?)<\/(?:p|blockquote|q|span)>/i);
      if (!quoteMatch) continue;
      const quoteText = quoteMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (quoteText.length < 15 || quoteText.length > 1000) continue;
      
      // Check we haven't already captured this quote via blockquote
      if (quotes.some(q => q.quote === quoteText)) continue;
      
      // Look for attribution within the same block
      const attrMatch = block.match(/<(?:cite|figcaption|span|p|div)[^>]*(?:class=["'][^"']*(?:author|name|credit|source|attribution)[^"']*["'])?[^>]*>([\s\S]*?)<\/(?:cite|figcaption|span|p|div)>/i);
      const attribution = attrMatch ? attrMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
      
      quotes.push({ quote: quoteText, attribution, context: pagePath });
    }
  }

  return quotes;
}

// Clean HTML to text with quote/attribution markers for AI fallback
function cleanHtmlToText(html: string, maxLen = 5000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
      const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return ` [QUOTE: "${text}"] `;
    })
    .replace(/<(?:figcaption|cite)[^>]*>([\s\S]*?)<\/(?:figcaption|cite)>/gi, (_, content) => {
      const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return ` [ATTRIBUTION: ${text}] `;
    })
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

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

    const browserUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    const fetchHeaders = {
      "User-Agent": browserUA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    };

    // Step 1: Fetch homepage
    let homepageHtml = "";
    try {
      const response = await fetch(targetUrl, { headers: fetchHeaders });
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

    // Step 3: Discover & fetch internal pages
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

    const allPaths = [...new Set([...navLinks.slice(0, 20), ...pagesToFetch])];
    console.log(`Will try ${Math.min(allPaths.length, 15)} paths. Nav links: ${navLinks.length}. First 15:`, allPaths.slice(0, 15));
    
    const additionalContent: string[] = [];
    const caseStudyLinks: string[] = [];
    const allExtractedQuotes: { quote: string; attribution: string; context: string }[] = [];
    // Store raw HTML of case-study-bearing pages for quote extraction
    const rawPageHtml: Map<string, string> = new Map();
    
    const fetchPromises = allPaths.slice(0, 15).map(async (path) => {
      try {
        const pageUrl = urlObj.origin + path;
        const resp = await fetch(pageUrl, {
          headers: fetchHeaders,
          signal: AbortSignal.timeout(6000),
        });
        if (resp.ok) {
          const text = await resp.text();
          console.log(`Fetched ${path} — ${text.length} chars, status ${resp.status}`);
          
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
            console.log(`Case listing ${path} found ${subLinks.length} sublinks:`, subLinks.slice(0, 5));
          }
          
          // Extract quotes from raw HTML
          const pageQuotes = extractQuotesFromHtml(text, path);
          if (pageQuotes.length > 0) {
            allExtractedQuotes.push(...pageQuotes);
            console.log(`Extracted ${pageQuotes.length} quotes from ${path}`);
          }
          
          const cleaned = cleanHtmlToText(text);
          if (cleaned.length > 50) {
            additionalContent.push(`[Page: ${path}]\n${cleaned}`);
          }
        } else {
          console.log(`Skip ${path} — status ${resp.status}`);
        }
      } catch (e) {
        console.log(`Error fetching ${path}: ${e}`);
      }
    });
    await Promise.all(fetchPromises);

    // Step 3b: Fetch case study subpages (up to 5 for testimonials)
    const uniqueCaseLinks = [...new Set(caseStudyLinks)].slice(0, 5);
    if (uniqueCaseLinks.length > 0) {
      console.log(`Found ${uniqueCaseLinks.length} case study subpages:`, uniqueCaseLinks);
      const casePromises = uniqueCaseLinks.map(async (path) => {
        try {
          const pageUrl = urlObj.origin + path;
          const resp = await fetch(pageUrl, {
            headers: fetchHeaders,
            signal: AbortSignal.timeout(6000),
          });
          if (resp.ok) {
            const text = await resp.text();
            console.log(`Fetched case study ${path} — ${text.length} chars`);
            
            // Extract quotes from raw HTML
            const pageQuotes = extractQuotesFromHtml(text, path);
            if (pageQuotes.length > 0) {
              allExtractedQuotes.push(...pageQuotes);
              console.log(`Extracted ${pageQuotes.length} quotes from case study ${path}`);
            }
            
            const cleaned = cleanHtmlToText(text);
            if (cleaned.length > 50) {
              additionalContent.push(`[Case study: ${path}]\n${cleaned}`);
            }
          }
        } catch (e) {
          console.log(`Error fetching case study ${path}: ${e}`);
        }
      });
      await Promise.all(casePromises);
    }

    // Also extract quotes from homepage
    const homepageQuotes = extractQuotesFromHtml(homepageHtml, '/');
    if (homepageQuotes.length > 0) {
      allExtractedQuotes.push(...homepageQuotes);
      console.log(`Extracted ${homepageQuotes.length} quotes from homepage`);
    }

    console.log(`Total extracted quotes: ${allExtractedQuotes.length}`);

    // Clean homepage text
    const homepageText = cleanHtmlToText(homepageHtml, 4000);

    // Step 4: Send everything to AI for structured parsing
    const allContent = `[Homepage]\n${homepageText}\n\n${additionalContent.join('\n\n')}`;
    console.log(`Scraped ${additionalContent.length} additional pages. Total content length: ${allContent.length} chars`);
    console.log(`Pages scraped: ${additionalContent.map(c => c.split('\n')[0]).join(', ')}`);

    const agencyName = result.name || 'Unknown Agency';

    // Build extracted quotes section for AI
    const quotesSection = allExtractedQuotes.length > 0
      ? `\n\n--- EXTRACTED QUOTES (from blockquotes and testimonial elements) ---\n${allExtractedQuotes.map((q, i) => 
          `Quote ${i + 1} [from ${q.context}]:\n  Text: "${q.quote}"\n  Attribution: "${q.attribution}"`
        ).join('\n\n')}`
      : '';

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
                content: `You are parsing a marketing agency's website content. The agency's name is "${agencyName}". Extract structured data and return ONLY valid JSON (no markdown, no code blocks).

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
      "quote": "exact quote text translated to English",
      "client_name": "name",
      "client_title": "title or null",
      "client_company": "company or null",
      "metric_value": "+200% or null — MUST contain a specific number or percentage (e.g. '+265%', '15,000', '3x'). Do NOT include vague descriptions like 'increased' or 'improved'. Set to null if no specific metric.",
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
  },
  "team_members": [
    {
      "name": "Full Name",
      "title": "Job Title",
      "photo_url": "absolute URL to photo or null",
      "bio": "One sentence bio or null"
    }
  ]
}

Rules:
- CRITICAL: ALL output text MUST be in English, regardless of the language of the source website. Translate ALL scraped content to natural, fluent English.
- For services_detected, use these exact category names when they match: "Brand & Creative", "Website & Digital", "Content & Copywriting", "SEO & Organic Growth", "Paid Advertising", "Social Media", "Email Marketing", "Analytics & Data", "Marketing Strategy"

TESTIMONIAL EXTRACTION — CRITICAL RULES:
The agency's name is "${agencyName}". Use this to distinguish client quotes from staff quotes.

1. A testimonial MUST be a quote FROM A CLIENT — someone OUTSIDE "${agencyName}" — praising the agency's work.
2. REJECT any quote where the speaker works at "${agencyName}" or any variation of the agency name. Check the attribution carefully:
   - If title/role contains "${agencyName}" or a recognizable variation → REJECT (it's a staff quote)
   - If the person is described as owner/CEO/founder/employee of "${agencyName}" → REJECT
   - Examples of INTERNAL quotes to reject: "SEO-specialist på ${agencyName}", "VD ${agencyName}", "Grundare av ${agencyName}"
3. ACCEPT quotes where the speaker is clearly from a DIFFERENT company (their title mentions a different company name).
4. DO NOT include press releases, blog excerpts, news announcements, or agency self-descriptions.
5. DO NOT include generic company statements or mission descriptions.
6. Only select quotes that explicitly praise or reference the agency's work, results, or collaboration. Skip generic statements or industry observations that don't mention the agency or the working relationship, even if spoken by a client.
7. If a case study page mentions metrics/results near a client quote, include them as metric_value and metric_label.
8. For metric_value: ONLY include if there is a specific number or percentage. Examples: "+265%", "15,000", "3x". Do NOT include vague descriptions like "increased traffic" or "improved performance". If no specific metric exists, set metric_value to null.
9. If multiple people are attributed the exact same quote text, only include it once — use the attribution with the most complete information (name + title + company).
10. If NO valid client testimonials are found, return an EMPTY testimonials array []. Do NOT fabricate testimonials.
11. Translate all quotes to English while preserving meaning and tone.

I have also pre-extracted quotes from HTML blockquotes and testimonial elements. These are listed in the "EXTRACTED QUOTES" section. Analyze each one carefully — only include those that are genuine client testimonials.

- For differentiators, ONLY use real data found on the website (mark as "scraped"). Do NOT invent or generate fake stats, KPI numbers, or differentiators. If fewer than 3 are found, return only what you found. Translate all differentiator text to English.
- If data is not found, use null or empty string, don't invent testimonials or stats
- Return ONLY the JSON object, no other text`
              },
              {
                role: "user",
                content: `Parse this agency website content. Agency name: "${agencyName}".\n\n${allContent.slice(0, 22000)}${quotesSection}`
              }
            ],
            temperature: 0.2,
            max_tokens: 5000,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          console.log(`AI response length: ${content.length} chars`);
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            let jsonStr = jsonMatch[0];
            jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
            try {
              aiResult = JSON.parse(jsonStr);
            } catch (parseErr) {
              console.error("JSON parse failed, attempting repair:", parseErr);
              const testMatch = content.match(/"testimonials"\s*:\s*\[([\s\S]*?)\]/);
              if (testMatch) {
                try {
                  const fixedTestimonials = JSON.parse(`[${testMatch[1].replace(/,\s*$/, '')}]`);
                  aiResult = { testimonials: fixedTestimonials };
                  console.log(`Recovered ${fixedTestimonials.length} testimonials from partial JSON`);
                } catch (_) {}
              }
            }
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

    // Log testimonial results
    console.log(`Testimonials found: ${result.testimonials?.length || 0}`);
    if (result.testimonials?.length > 0) {
      result.testimonials.forEach((t: any, i: number) => {
        console.log(`  ${i + 1}. "${t.quote?.slice(0, 60)}..." — ${t.client_name}, ${t.client_company || 'unknown'}`);
      });
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
