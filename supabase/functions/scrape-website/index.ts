// Scrape website edge function v4 — Improved logo, team, and testimonial extraction
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Decode common HTML entities
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

// Extract quotes from HTML with rich patterns
function extractQuotesFromHtml(html: string, pagePath: string): { quote: string; attribution: string; context: string }[] {
  const quotes: { quote: string; attribution: string; context: string }[] = [];

  // Pattern 1: <blockquote> elements
  const blockquoteRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
  let match;
  while ((match = blockquoteRegex.exec(html)) !== null) {
    const quoteText = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (quoteText.length < 15 || quoteText.length > 1000) continue;
    
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
      const quoteMatch = block.match(/<(?:p|blockquote|q|span)[^>]*>([\s\S]*?)<\/(?:p|blockquote|q|span)>/i);
      if (!quoteMatch) continue;
      const quoteText = quoteMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (quoteText.length < 15 || quoteText.length > 1000) continue;
      if (quotes.some(q => q.quote === quoteText)) continue;
      
      const attrMatch = block.match(/<(?:cite|figcaption|span|p|div)[^>]*(?:class=["'][^"']*(?:author|name|credit|source|attribution)[^"']*["'])?[^>]*>([\s\S]*?)<\/(?:cite|figcaption|span|p|div)>/i);
      const attribution = attrMatch ? attrMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
      
      quotes.push({ quote: quoteText, attribution, context: pagePath });
    }
  }

  return quotes;
}

// Extract team members directly from HTML structure
function extractTeamFromHtml(html: string, baseUrl: string): { name: string; title: string; photo_url: string | null; bio: string | null }[] {
  const members: { name: string; title: string; photo_url: string | null; bio: string | null }[] = [];
  const seenNames = new Set<string>();
  
  const resolveUrl = (u: string) => {
    if (!u) return null;
    if (u.startsWith('data:')) return null;
    if (u.startsWith('http')) return u;
    if (u.startsWith('//')) return 'https:' + u;
    if (u.startsWith('/')) return new URL(u, baseUrl).href;
    return new URL(u, baseUrl).href;
  };

  // Pattern 1: Elements with staff/team/member class containing structured data
  const teamBlockPatterns = [
    /<(?:div|article|li)[^>]*class=["'][^"']*(?:team[-_\s]?member|staff|employee|person|member[-_\s]?card|people)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi,
    /<(?:div|article|li)[^>]*class=["'][^"']*(?:child\s+staff|team-card|member-item|team-item)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi,
  ];

  for (const pattern of teamBlockPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const block = match[0]; // Use full match to include wrapper attributes
      
      // Extract name from h2, h3, h4 or .name/.team-member__name
      const nameMatch = block.match(/<h[2-4][^>]*(?:class=["'][^"']*(?:name|title)[^"']*["'])?[^>]*>([^<]+)<\/h[2-4]>/i)
        || block.match(/<(?:span|p|div)[^>]*class=["'][^"']*(?:name|member-name|team-member__name)[^"']*["'][^>]*>([^<]+)<\/(?:span|p|div)>/i);
      if (!nameMatch) continue;
      const name = nameMatch[1].trim();
      if (!name || name.length < 2 || name.length > 60 || seenNames.has(name.toLowerCase())) continue;
      
      // Extract role/title from .role, .position, h4, or separate element
      const roleMatch = block.match(/<(?:p|span|div|h4)[^>]*class=["'][^"']*(?:role|position|job[-_]?title|team-member__position|designation|subtitle)[^"']*["'][^>]*>([^<]+)<\/(?:p|span|div|h4)>/i)
        || block.match(/<h4[^>]*>([^<]+)<\/h4>/i);
      const title = roleMatch ? roleMatch[1].trim() : '';
      
      // Extract photo URL from img src or data-src (for lazy loading)
      const imgMatch = block.match(/<img[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*/i);
      let photoUrl: string | null = null;
      if (imgMatch) {
        // Prefer data-src (lazy loaded actual image) over src (placeholder)
        const dataSrcMatch = block.match(/<img[^>]*data-src=["']([^"']+)["']/i);
        const srcMatch = block.match(/<img[^>]*src=["']([^"']+)["']/i);
        const rawUrl = dataSrcMatch ? dataSrcMatch[1] : (srcMatch ? srcMatch[1] : null);
        if (rawUrl && !rawUrl.startsWith('data:')) {
          photoUrl = resolveUrl(rawUrl);
        }
      }
      
      // Extract bio
      const bioMatch = block.match(/<(?:p|div)[^>]*class=["'][^"']*(?:bio|description|about|excerpt|team-member__bio)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div)>/i);
      let bio: string | null = null;
      if (bioMatch) {
        bio = bioMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (bio.length > 300) bio = bio.slice(0, 297) + '...';
        if (bio.length < 5) bio = null;
      }
      
      seenNames.add(name.toLowerCase());
      members.push({ name, title, photo_url: photoUrl, bio });
    }
  }

  // Pattern 2: Look for repeated grid patterns with headings + images (common team layout)
  // Matches sections that have both an image and a heading nearby
  if (members.length === 0) {
    // Try matching fl-post-grid-post (Beaver Builder) and similar patterns
    const gridPostPattern = /<(?:div|article)[^>]*class=["'][^"']*(?:fl-post-grid-post|wp-block-group|elementor-widget|card)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article)>\s*(?:<\/div>)?\s*(?:<\/div>)?/gi;
    let match;
    while ((match = gridPostPattern.exec(html)) !== null) {
      const block = match[0];
      // Check if this looks like a team member block
      if (!block.match(/(?:team|staff|member|employee|person)/i)) continue;
      
      const nameMatch = block.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/i);
      if (!nameMatch) continue;
      const name = nameMatch[1].trim();
      if (!name || name.length < 2 || seenNames.has(name.toLowerCase())) continue;
      
      const roleMatch = block.match(/<h[3-5][^>]*(?:class=["'][^"']*(?:position|role|title)[^"']*["'])?[^>]*>([^<]+)<\/h[3-5]>/i);
      const title = roleMatch && roleMatch[1].trim() !== name ? roleMatch[1].trim() : '';
      
      const dataSrcMatch = block.match(/<img[^>]*data-src=["']([^"']+)["']/i);
      const srcMatch = block.match(/<img[^>]*src=["']([^"']+)["']/i);
      const rawUrl = dataSrcMatch ? dataSrcMatch[1] : (srcMatch ? srcMatch[1] : null);
      const photoUrl = rawUrl && !rawUrl.startsWith('data:') ? resolveUrl(rawUrl) : null;
      
      seenNames.add(name.toLowerCase());
      members.push({ name, title, photo_url: photoUrl, bio: null });
    }
  }

  return members.slice(0, 12);
}

// Extract logo from HTML with multiple strategies
function extractLogo(html: string, baseUrl: string): string | null {
  const urlObj = new URL(baseUrl);
  const resolveUrl = (u: string) => {
    if (!u) return '';
    u = decodeHtmlEntities(u);
    if (u.startsWith('http')) return u;
    if (u.startsWith('//')) return 'https:' + u;
    if (u.startsWith('/')) return urlObj.origin + u;
    return urlObj.origin + '/' + u;
  };

  let bestLogo: string | null = null;
  let bestScore = 0;

  const scoreLogo = (url: string, context: string, imgTag?: string): number => {
    let score = 1;
    const lower = url.toLowerCase();
    
    // Strong positive signals
    if (lower.includes('logo')) score += 15;
    if (lower.includes('brand')) score += 5;
    
    // Check alt text for logo keyword (very strong signal)
    if (imgTag) {
      const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
      if (altMatch) {
        const alt = altMatch[1].toLowerCase();
        if (alt.includes('logo')) score += 12;
        if (alt.includes('brand')) score += 5;
      }
      // Check class/id on the img itself
      const classMatch = imgTag.match(/class=["']([^"']*)["']/i);
      if (classMatch) {
        const cls = classMatch[1].toLowerCase();
        if (cls.includes('logo')) score += 12;
        if (cls.includes('brand')) score += 5;
        if (cls.includes('hero') || cls.includes('banner') || cls.includes('cover') || cls.includes('featured')) score -= 15;
      }
    }
    
    // Format signals — SVGs are almost always logos
    if (lower.match(/\.svg(\?|$|&)/i)) score += 10;
    if (lower.match(/\.png(\?|$|&)/i)) score += 3;
    
    // Content/hero image penalties
    if (lower.match(/\.webp(\?|$|&)/i)) score -= 3;
    if (lower.match(/\.jpe?g(\?|$|&)/i)) score -= 3;
    if (lower.includes('wp-content/uploads/')) score -= 10;
    if (lower.includes('/uploads/')) score -= 5;
    if (lower.match(/\d{3,4}x\d{3,4}/)) score -= 8;
    if (lower.match(/width=\d{4,}/)) score -= 8;
    if (lower.match(/height=\d{3,}/)) score -= 5;
    if (lower.includes('hero') || lower.includes('banner') || lower.includes('slider') || lower.includes('slide')) score -= 15;
    if (lower.includes('featured') || lower.includes('cover') || lower.includes('background')) score -= 10;
    if (lower.includes('thumbnail') || lower.includes('thumb')) score -= 5;
    if (lower.includes('login') || lower.includes('signin') || lower.includes('sign-in')) score -= 15;
    if (lower.includes('avatar') || lower.includes('profile')) score -= 5;
    if (lower.includes('gravatar')) score -= 10;
    
    // Context
    if (context === 'header') score += 3;
    if (context === 'og:image') score += 1; // low — og:image is often a hero, not logo
    if (context === 'logo-container') score += 8; // high — explicitly in a logo wrapper
    
    // Negative signals
    if (lower.includes('icon') && !lower.includes('logo')) score -= 3;
    if (lower.includes('favicon')) score -= 5;
    if (lower.includes('client') || lower.includes('partner') || lower.includes('sponsor')) score -= 10;
    if (lower.includes('spinner') || lower.includes('loading') || lower.includes('placeholder')) score -= 20;
    
    return score;
  };

  // Strategy 1: Header area images with logo indicators
  const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
  const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
  const headerHtml = headerMatch ? headerMatch[0] : (navMatch ? navMatch[0] : html.slice(0, 8000));

  // Check all imgs in header area
  const headerImgs = [...headerHtml.matchAll(/<img[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*/gi)];
  for (const m of headerImgs) {
    const dataSrc = m[0].match(/data-src=["']([^"']+)["']/i);
    const src = m[0].match(/\bsrc=["']([^"']+)["']/i);
    const url = dataSrc?.[1] || src?.[1];
    if (!url || url.startsWith('data:')) continue;
    const resolved = resolveUrl(url);
    const score = scoreLogo(resolved, 'header', m[0]);
    if (score > bestScore) { bestScore = score; bestLogo = resolved; }
  }

  // Strategy 2: Elements with logo class/id containing images
  const logoContainerPatterns = [
    /<(?:a|div|span|figure)[^>]*(?:class|id)=["'][^"']*\blogo\b[^"']*["'][^>]*>[\s\S]*?(<img[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>)/gi,
    /<(?:a|div|span|figure)[^>]*(?:class|id)=["'][^"']*\bbrand\b[^"']*["'][^>]*>[\s\S]*?(<img[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>)/gi,
  ];
  for (const pattern of logoContainerPatterns) {
    const matches = [...html.matchAll(pattern)];
    for (const m of matches) {
      const imgTag = m[1];
      const url = m[2];
      if (!url || url.startsWith('data:')) continue;
      const resolved = resolveUrl(url);
      const score = scoreLogo(resolved, 'logo-container', imgTag);
      if (score > bestScore) { bestScore = score; bestLogo = resolved; }
    }
  }

  // Strategy 3: Inline SVG in logo containers
  const inlineSvgPattern = /<(?:a|div|span)[^>]*(?:class|id)=["'][^"']*\blogo\b[^"']*["'][^>]*>[\s\S]*?<svg[\s\S]*?<\/svg>/gi;
  // We can't extract an inline SVG as a URL, but we can note it exists

  // Strategy 4: og:image as fallback (often the agency logo or branded image)
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogImageMatch) {
    const resolved = resolveUrl(ogImageMatch[1]);
    const score = scoreLogo(resolved, 'og:image');
    if (score > bestScore) { bestScore = score; bestLogo = resolved; }
  }

  // Strategy 5: Favicon/apple-touch-icon as last resort
  if (!bestLogo || bestScore < 5) {
    const iconLinks = [...html.matchAll(/<link[^>]*rel=["'](?:icon|apple-touch-icon|shortcut icon)["'][^>]*href=["']([^"']+)["'][^>]*/gi)];
    for (const m of iconLinks) {
      const href = resolveUrl(m[1]);
      if (href.match(/\.svg(\?|$|&)/i)) {
        const score = scoreLogo(href, 'favicon');
        if (score > bestScore) { bestScore = score; bestLogo = href; }
      } else if (href.match(/\.png(\?|$|&)/i)) {
        const sizeMatch = m[0].match(/sizes=["'](\d+)/i);
        if (sizeMatch && parseInt(sizeMatch[1]) >= 128) {
          const score = scoreLogo(href, 'favicon');
          if (score > bestScore) { bestScore = score; bestLogo = href; }
        }
      }
    }
  }

  // Strategy 6: First image in the page that contains 'logo' in URL or alt
  if (!bestLogo) {
    const allImgs = [...html.matchAll(/<img[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*/gi)];
    for (const m of allImgs) {
      const url = m[1];
      if (!url || url.startsWith('data:')) continue;
      const resolved = resolveUrl(url);
      if (resolved.toLowerCase().includes('logo')) {
        const altMatch = m[0].match(/alt=["']([^"']*logo[^"']*)['"]/i);
        const score = scoreLogo(resolved, 'body') + (altMatch ? 3 : 0);
        if (score > bestScore) { bestScore = score; bestLogo = resolved; }
        break; // take the first logo-ish image
      }
    }
  }

  console.log(`Logo detection result: score=${bestScore}, url=${bestLogo?.slice(0, 100)}`);
  
  // If best score is very low, it's likely not a real logo
  if (bestScore < 3) return null;
  
  return bestLogo;
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

// Preserve team-relevant HTML structure for AI parsing
function cleanHtmlPreserveTeam(html: string, maxLen = 6000): string {
  // Remove scripts, styles, nav, but keep structural elements for team parsing
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '');
  
  // Preserve img src/data-src, h2-h4 text, and class names that hint at team structure
  cleaned = cleaned
    .replace(/<img[^>]*(?:data-src|src)=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, '[IMG: $1 alt="$2"]')
    .replace(/<img[^>]*(?:data-src|src)=["']([^"']+)["'][^>]*\/?>/gi, '[IMG: $1]')
    .replace(/<h([2-4])[^>]*>([^<]*)<\/h\1>/gi, '[H$1: $2]')
    .replace(/<(?:p|span|div)[^>]*class=["'][^"']*(?:role|position|title|bio|description)[^"']*["'][^>]*>([^<]*)<\/(?:p|span|div)>/gi, '[ROLE: $1]')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned.slice(0, maxLen);
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

    // Step 2: Extract basic meta data from homepage
    const result: Record<string, any> = {};

    // Agency name
    const ogSiteNameMatch = homepageHtml.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
      || homepageHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
    if (ogSiteNameMatch) {
      result.name = decodeHtmlEntities(ogSiteNameMatch[1].trim());
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
        result.name = decodeHtmlEntities(title);
      }
    }

    // Meta description (tagline)
    const descMatch = homepageHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || homepageHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    if (descMatch) result.tagline = decodeHtmlEntities(descMatch[1].trim().slice(0, 200));

    // Logo detection (improved)
    const detectedLogo = extractLogo(homepageHtml, targetUrl);
    if (detectedLogo) result.logo_url = detectedLogo;

    // Logo fallback: probe common logo URLs directly if none found
    if (!result.logo_url) {
      const logoProbeUrls = [
        '/favicon.svg',
        '/logo.svg',
        '/images/logo.svg',
        '/img/logo.svg',
        '/assets/logo.svg',
        '/images/logo.png',
        '/img/logo.png',
        '/assets/logo.png',
      ];
      for (const probePath of logoProbeUrls) {
        try {
          const probeUrl = urlObj.origin + probePath;
          const probeResp = await fetch(probeUrl, {
            method: 'HEAD',
            headers: fetchHeaders,
            signal: AbortSignal.timeout(3000),
          });
          if (probeResp.ok) {
            const ct = probeResp.headers.get('content-type') || '';
            if (ct.includes('svg') || ct.includes('image')) {
              result.logo_url = probeUrl;
              console.log(`Logo found via URL probe: ${probeUrl}`);
              break;
            }
          }
        } catch (_) {}
      }
    }

    // Logo fallback: extract from <link> icon/apple-touch-icon tags
    if (!result.logo_url) {
      const iconLinks = [...homepageHtml.matchAll(/<link[^>]*rel=["'](?:icon|apple-touch-icon|shortcut\s+icon)["'][^>]*href=["']([^"']+)["'][^>]*/gi)];
      let bestIcon: string | null = null;
      let bestIconSize = 0;
      for (const m of iconLinks) {
        const href = resolveUrl(m[1]);
        if (href.match(/\.svg(\?|$)/i)) {
          bestIcon = href;
          break; // SVG favicon is great
        }
        const sizeMatch = m[0].match(/sizes=["'](\d+)/i);
        const size = sizeMatch ? parseInt(sizeMatch[1]) : 0;
        if (size > bestIconSize || (!bestIcon && href)) {
          bestIcon = href;
          bestIconSize = size;
        }
      }
      if (bestIcon) {
        result.logo_url = bestIcon;
        console.log(`Logo found via link icon: ${bestIcon}`);
      }
    }

    // Logo last resort: Google favicon service (returns high-quality site icons)
    if (!result.logo_url) {
      result.logo_url = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
      console.log(`Logo fallback to Google favicon API for ${urlObj.hostname}`);
    }

    // Theme color & detected colors
    const themeColorMatch = homepageHtml.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)
      || homepageHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i);
    if (themeColorMatch) result.brand_color = themeColorMatch[1].trim();
    
    // Extract colors from inline styles and HTML
    const colorMatches = homepageHtml.match(/#[0-9a-fA-F]{6}/g) || [];
    const genericColors = new Set(["#000000", "#ffffff", "#FFFFFF", "#333333", "#666666", "#999999", "#cccccc", "#CCCCCC", "#111111", "#222222", "#444444", "#555555", "#777777", "#888888", "#aaaaaa", "#AAAAAA", "#bbbbbb", "#BBBBBB", "#dddddd", "#DDDDDD", "#eeeeee", "#EEEEEE", "#f0f0f0", "#F0F0F0", "#fafafa", "#FAFAFA", "#f5f5f5", "#F5F5F5", "#e0e0e0", "#E0E0E0"]);
    const uniqueColors = [...new Set(colorMatches)]
      .filter(c => !genericColors.has(c))
      .slice(0, 10);

    // Also try to extract colors from linked CSS stylesheets
    if (!result.brand_color || uniqueColors.length < 2) {
      const cssLinks = [...homepageHtml.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)];
      const mainCssUrls = cssLinks
        .map(m => resolveUrl(m[1]))
        .filter(u => !u.includes('fonts.googleapis') && !u.includes('wp-includes'))
        .slice(0, 3); // Limit to 3 stylesheets
      
      for (const cssUrl of mainCssUrls) {
        try {
          const cssResp = await fetch(cssUrl, {
            headers: fetchHeaders,
            signal: AbortSignal.timeout(4000),
          });
          if (cssResp.ok) {
            const cssText = await cssResp.text();
            
            // Extract CSS custom properties that look like brand colors
            const varMatches = cssText.match(/--(?:primary|brand|main|accent|theme|color-primary|site-color|brand-color)[^:]*:\s*(#[0-9a-fA-F]{3,8})/gi) || [];
            for (const vm of varMatches) {
              const hexMatch = vm.match(/#[0-9a-fA-F]{6}/);
              if (hexMatch && !genericColors.has(hexMatch[0])) {
                if (!result.brand_color) {
                  result.brand_color = hexMatch[0];
                  console.log(`Brand color from CSS variable: ${hexMatch[0]} (from ${cssUrl.slice(-50)})`);
                }
                if (!uniqueColors.includes(hexMatch[0])) uniqueColors.push(hexMatch[0]);
              }
            }
            
            // Extract prominent colors from CSS body/header/nav rules
            const bodyColorMatch = cssText.match(/(?:body|\.site|\.wrapper|header|\.header|nav|\.nav|\.navbar)\s*\{[^}]*?(?:background(?:-color)?|color)\s*:\s*(#[0-9a-fA-F]{3,8})/gi);
            if (bodyColorMatch) {
              for (const bcm of bodyColorMatch) {
                const hexMatch = bcm.match(/#[0-9a-fA-F]{6}/);
                if (hexMatch && !genericColors.has(hexMatch[0]) && !uniqueColors.includes(hexMatch[0])) {
                  uniqueColors.push(hexMatch[0]);
                  if (!result.brand_color) {
                    result.brand_color = hexMatch[0];
                    console.log(`Brand color from CSS rule: ${hexMatch[0]}`);
                  }
                }
              }
            }
          }
        } catch (_) {}
      }
    }

    if (uniqueColors.length > 0) {
      result.detected_colors = uniqueColors.slice(0, 5);
      if (!result.brand_color) result.brand_color = uniqueColors[0];
    }
    
    console.log(`Brand color: ${result.brand_color || 'none'}. Detected colors: ${uniqueColors.join(', ') || 'none'}`);

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

    // Step 3: Discover & fetch internal pages (expanded team paths)
    const pagesToFetch = [
      '/about', '/about-us', '/who-we-are', '/om-oss', '/om',
      '/team', '/team/', '/our-team', '/our-team/', '/people', '/staff', '/meet-the-team',
      '/kontakta/oss', '/kontakta/oss/', '/kontakta-oss',
      '/services', '/what-we-do', '/tjanster', '/tjanster/',
      '/testimonials', '/reviews', '/clients', '/kunder', '/referenser',
      '/work', '/case-studies', '/cases', '/kundcase', '/kundcase/', '/portfolio',
      '/contact', '/kontakt',
      '/references', '/referenties', '/projekte', '/projets',
    ];
    const navLinks = [...homepageHtml.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim().toLowerCase() }))
      .filter(({ href }) => {
        try {
          const hrefUrl = new URL(href, targetUrl);
          return hrefUrl.origin === urlObj.origin && hrefUrl.pathname !== '/';
        } catch { return false; }
      })
      .map(({ href, text }) => {
        try { return { path: new URL(href, targetUrl).pathname, text }; } catch { return null; }
      })
      .filter(Boolean) as { path: string; text: string }[];

    // Prioritize team-related nav links
    const teamKeywords = ['team', 'staff', 'people', 'about', 'om oss', 'kontakt', 'meet', 'our team', 'medarbetare', 'anställda'];
    const teamNavLinks = navLinks.filter(({ text }) => teamKeywords.some(kw => text.includes(kw)));
    const otherNavLinks = navLinks.filter(({ text }) => !teamKeywords.some(kw => text.includes(kw)));
    
    const allPaths = [...new Set([
      ...teamNavLinks.map(l => l.path),
      ...otherNavLinks.slice(0, 15).map(l => l.path),
      ...pagesToFetch
    ])];
    console.log(`Will try ${Math.min(allPaths.length, 20)} paths. Team nav links: ${teamNavLinks.map(l => l.path).join(', ')}. Nav links: ${navLinks.length}`);
    
    const additionalContent: string[] = [];
    const teamContent: { path: string; html: string }[] = [];
    const caseStudyLinks: string[] = [];
    const allExtractedQuotes: { quote: string; attribution: string; context: string }[] = [];
    const allExtractedTeam: { name: string; title: string; photo_url: string | null; bio: string | null }[] = [];
    let detectedPortfolioUrl: string | null = null;
    
    const fetchPromises = allPaths.slice(0, 20).map(async (path) => {
      try {
        const pageUrl = urlObj.origin + path;
        const resp = await fetch(pageUrl, {
          headers: fetchHeaders,
          signal: AbortSignal.timeout(8000),
        });
        if (resp.ok) {
          const text = await resp.text();
          console.log(`Fetched ${path} — ${text.length} chars, status ${resp.status}`);
          
          const normalizedPath = path.replace(/\/$/, '');
          const isCasePage = /\/(kundcase|case-studies|cases|work|portfolio|testimonials|reviews|referencer|references|kunder)\/?$/i.test(path);
          const isTeamPage = /\/(team|our-team|people|staff|meet-the-team|kontakta|medarbetare)\/?/i.test(path)
            || text.toLowerCase().includes('meet the team') || text.toLowerCase().includes('our team')
            || text.toLowerCase().includes('meet our');
          
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
            console.log(`Case listing ${path} found ${subLinks.length} sublinks`);
          }
          
          // Extract team members from HTML directly
          if (isTeamPage) {
            console.log(`Team page detected: ${path}`);
            const teamMembers = extractTeamFromHtml(text, urlObj.origin);
            if (teamMembers.length > 0) {
              allExtractedTeam.push(...teamMembers);
              console.log(`Extracted ${teamMembers.length} team members from ${path}:`, teamMembers.map(m => m.name));
            }
            // Also store for AI parsing
            teamContent.push({ path, html: text });
          }
          
          // Try logo from subpages if not found yet
          if (!result.logo_url) {
            const subLogo = extractLogo(text, urlObj.origin);
            if (subLogo) result.logo_url = subLogo;
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

    // Also extract quotes and team from homepage
    const homepageQuotes = extractQuotesFromHtml(homepageHtml, '/');
    if (homepageQuotes.length > 0) {
      allExtractedQuotes.push(...homepageQuotes);
      console.log(`Extracted ${homepageQuotes.length} quotes from homepage`);
    }
    
    // Try team extraction from homepage too
    const homepageTeam = extractTeamFromHtml(homepageHtml, urlObj.origin);
    if (homepageTeam.length > 0 && allExtractedTeam.length === 0) {
      allExtractedTeam.push(...homepageTeam);
      console.log(`Extracted ${homepageTeam.length} team members from homepage`);
    }

    console.log(`Total extracted quotes: ${allExtractedQuotes.length}`);
    console.log(`Total extracted team members: ${allExtractedTeam.length}`);

    // Clean homepage text
    const homepageText = cleanHtmlToText(homepageHtml, 4000);

    // Step 4: Send everything to AI for structured parsing
    const allContent = `[Homepage]\n${homepageText}\n\n${additionalContent.join('\n\n')}`;
    
    // Add team page content with preserved structure for AI
    let teamSection = '';
    if (teamContent.length > 0) {
      const preservedTeam = teamContent.map(({ path, html }) => 
        `[Team page: ${path}]\n${cleanHtmlPreserveTeam(html, 4000)}`
      ).join('\n\n');
      teamSection = `\n\n--- TEAM PAGE CONTENT (with preserved structure) ---\n${preservedTeam}`;
    }
    
    // Add pre-extracted team for AI validation
    let extractedTeamSection = '';
    if (allExtractedTeam.length > 0) {
      extractedTeamSection = `\n\n--- PRE-EXTRACTED TEAM MEMBERS ---\n${allExtractedTeam.map((m, i) => 
        `${i + 1}. Name: "${m.name}", Title: "${m.title}", Photo: ${m.photo_url || 'none'}, Bio: ${m.bio || 'none'}`
      ).join('\n')}`;
    }

    console.log(`Scraped ${additionalContent.length} additional pages. Total content length: ${allContent.length} chars`);

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
            model: "google/gemini-2.5-flash",
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
      "title": "Job Title (translated to English)",
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
3. ACCEPT quotes where the speaker is clearly from a DIFFERENT company.
4. DO NOT include press releases, blog excerpts, news announcements, or agency self-descriptions.
5. DO NOT include generic company statements or mission descriptions.
6. Only select quotes that explicitly praise or reference the agency's work, results, or collaboration.
7. If a case study page mentions metrics/results near a client quote, include them as metric_value and metric_label.
8. For metric_value: ONLY include if there is a specific number or percentage.
9. If multiple people are attributed the exact same quote text, only include it once.
10. If NO valid client testimonials are found, return an EMPTY testimonials array []. Do NOT fabricate testimonials.
11. Translate all quotes to English while preserving meaning and tone.

I have also pre-extracted quotes from HTML blockquotes and testimonial elements. These are listed in the "EXTRACTED QUOTES" section. Analyze each one carefully — only include those that are genuine client testimonials.

TEAM MEMBER EXTRACTION — CRITICAL RULES:
1. I have pre-extracted team members from HTML structure. They are listed in the "PRE-EXTRACTED TEAM MEMBERS" section. Use these as your primary source — validate and clean them up.
2. If pre-extracted team members have photo_url values, KEEP THEM EXACTLY as provided (they are already absolute URLs).
3. Also check the "TEAM PAGE CONTENT" section for any additional team members the HTML parser may have missed.
4. Look for people with [IMG:...] markers near their names in the team page content — these are photo URLs.
5. Translate job titles to English (e.g. "VD" → "CEO", "Art director" stays "Art Director", "Projektledare" → "Project Manager").
6. Maximum 6 team members. Prioritize leadership and senior roles.
7. If no team data found anywhere, return an empty array. Do NOT fabricate team members.

- For differentiators, ONLY use real data found on the website (mark as "scraped"). Do NOT invent or generate fake stats.
- If data is not found, use null or empty string, don't invent testimonials or stats
- Return ONLY the JSON object, no other text`
              },
              {
                role: "user",
                content: `Parse this agency website content. Agency name: "${agencyName}".\n\n${allContent.slice(0, 18000)}${teamSection}${extractedTeamSection}${quotesSection}`
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
      
      // For team: prefer AI-refined results if available, fall back to HTML-extracted
      if (aiResult.team_members?.length > 0) {
        result.team_members = aiResult.team_members;
      } else if (allExtractedTeam.length > 0) {
        // Use HTML-extracted team directly if AI didn't return any
        result.team_members = allExtractedTeam.slice(0, 6);
      }
    } else if (allExtractedTeam.length > 0) {
      // No AI result at all, use HTML-extracted team
      result.team_members = allExtractedTeam.slice(0, 6);
    }

    // Log results
    console.log(`Logo found: ${result.logo_url || 'none'}`);
    console.log(`Testimonials found: ${result.testimonials?.length || 0}`);
    if (result.testimonials?.length > 0) {
      result.testimonials.forEach((t: any, i: number) => {
        console.log(`  ${i + 1}. "${t.quote?.slice(0, 60)}..." — ${t.client_name}, ${t.client_company || 'unknown'}`);
      });
    }
    console.log(`Team members found: ${result.team_members?.length || 0}`);
    if (result.team_members?.length > 0) {
      result.team_members.forEach((m: any, i: number) => {
        console.log(`  ${i + 1}. ${m.name} — ${m.title} — photo: ${m.photo_url ? 'yes' : 'no'}`);
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
