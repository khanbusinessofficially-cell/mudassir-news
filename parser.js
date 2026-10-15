const dec = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#0?39;|&apos;/g,"'")
  .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&amp;/g,'&');
const strip = s => dec(s).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const tag = (x,n) => { const m = x.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`,'i')); return m ? m[1] : ''; };
const attr = (x,n,a) => { const m = x.match(new RegExp(`<${n}\\b[^>]*\\b${a}=["']([^"']+)["']`,'i')); return m ? dec(m[1]) : ''; };
const safeUrl = u => { try { const p = new URL(u); return /^https?:$/.test(p.protocol) ? p.href : ''; } catch { return ''; } };

function extractImage(item) {
  const c = [attr(item,'media:content','url'), attr(item,'media:thumbnail','url')];
  const enc = item.match(/<enclosure\b[^>]*>/i); if (enc && /image/i.test(enc[0])) c.push(attr(enc[0],'enclosure','url'));
  const body = dec(tag(item,'content:encoded') + tag(item,'description') + tag(item,'content') + tag(item,'summary'));
  c.push((body.match(/<img[^>]+src=["']([^"']+)["']/i)||[])[1]||'');
  return c.map(safeUrl).find(Boolean) || null;
}

// Parses RSS 2.0 and Atom. Returns articles with the publisher's real pubDate (null if absent/invalid).
function parseFeed(xml, source) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map(b => {
    const link = safeUrl(strip(tag(b,'link')) || attr(b,'link','href') || strip(tag(b,'guid')));
    const title = strip(tag(b,'title'));
    if (!link || !title) return null;
    const d = new Date(strip(tag(b,'pubDate') || tag(b,'published') || tag(b,'updated') || tag(b,'dc:date')));
    return {
      id: Buffer.from(link).toString('base64url').slice(-24) + source.id.length,
      title, url: link, summary: strip(tag(b,'description') || tag(b,'summary')).slice(0,280),
      image: extractImage(b), publisher: source.name, lang: source.lang, categories: source.cats,
      author: strip(tag(b,'dc:creator') || tag(b,'author')) || null,
      publishedAt: isNaN(d) ? null : d.toISOString(),
    };
  }).filter(Boolean);
}

const norm = t => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
// Dedupe by URL (sans query/fragment) and by normalized title; merge categories.
function dedupe(list) {
  const seen = new Map(), out = [];
  for (const a of list) {
    const u = new URL(a.url); const keys = [u.origin+u.pathname, 't:'+norm(a.title)];
    const hit = keys.map(k=>seen.get(k)).find(Boolean);
    if (hit) { hit.categories = [...new Set([...hit.categories, ...a.categories])]; hit.image ||= a.image; hit.publishers = [...new Set([...hit.publishers, a.publisher])]; hit.sourceCount = hit.publishers.length; continue; }
    a.publishers = [a.publisher]; a.sourceCount = 1;
    keys.forEach(k=>seen.set(k,a)); out.push(a);
  }
  return out;
}
module.exports = { parseFeed, dedupe, strip };
