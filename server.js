const http = require('http'), fs = require('fs'), path = require('path');
const SOURCES = require('./feeds'); const { parseFeed, dedupe } = require('./parser'); const { translateArticles } = require('./translator');
const CATEGORIES = ['all','pakistan','world','politics','business','sports','technology','entertainment','science','health','education','weather','interesting','positive','trending'];
const PORT = +process.env.PORT || 3000, REFRESH_MS = +process.env.REFRESH_MINUTES*60000 || 10*60000;
const state = { articles: [], sources: {}, lastRun: null };

async function fetchSource(s) {
  const st = state.sources[s.id] = { name:s.name, url:s.url, ok:false, count:0, error:null, at:null };
  try {
    const r = await fetch(s.url, { signal: AbortSignal.timeout(10000), headers:{'User-Agent':'MudassirNews/1.0 (RSS reader)','Accept':'application/rss+xml,application/xml,text/xml'} });
    if (!r.ok) throw new Error('HTTP '+r.status);
    const items = parseFeed(await r.text(), s);
    Object.assign(st,{ ok:true, count:items.length, at:new Date().toISOString() });
    return items;
  } catch (e) { st.error = String(e.message||e); st.at = new Date().toISOString(); return null; } // a failed source never crashes the run
}
async function refresh() {
  const results = await Promise.all(SOURCESconst results = await Promise.all(SOURCES.map(fetchSource));
console.log('[DEBUG] Refresh results:', results.map((r, i) => ({
  source: SOURCES[i].id,
  count: Array.isArray(r) ? r.length : 0,
  failed: r === null
})));.map(fetchSource));
  const fresh = results.flat().filter(Boolean);
  const fetchedAt = new Date().toISOString();
  fresh.forEach(a => a.fetchedAt = fetchedAt);
  // keep previously cached articles from sources that failed this round
  const failed = new Set(SOURCES.filter((_,i)=>!results[i]).map(s=>s.name));
  const kept = state.articles.filter(a => failed.has(a.publisher) && !fresh.some(f=>f.url===a.url));
  const cutoff = Date.now() - 7*864e5;
  state.articles = dedupe([...fresh, ...kept])
    .filter(a => !a.publishedAt || Date.parse(a.publishedAt) > cutoff)
    .sort((a,b) => (Date.parse(b.publishedAt)||0) - (Date.parse(a.publishedAt)||0)).slice(0, 1500);
  state.lastRun = fetchedAt;
  console.log(`[refresh] ${state.articles.length} articles; ${results.filter(Boolean).length}/${SOURCES.length} sources ok`);
}

function query(u) {
  const cat = u.searchParams.get('category'), q = (u.searchParams.get('q')||'').toLowerCase().trim().slice(0,100);
  const lang = u.searchParams.get('lang'), pub = u.searchParams.get('publisher');
  const limit = Math.min(Math.max(+u.searchParams.get('limit')||20,1),50);
  let list = state.articles;
  if (cat==='trending') list = list.filter(a => a.sourceCount>=2); // trending = same story reported by 2+ publishers (derived, not invented)
  else if (cat && cat!=='all' && cat!=='top') list = list.filter(a => a.categories.includes(cat));
  if (lang) list = list.filter(a => a.lang===lang);
  if (pub) list = list.filter(a => a.publisher===pub);
  if (q) list = list.filter(a => (a.title+' '+a.summary).toLowerCase().includes(q));
  const cur = u.searchParams.get('cursor'); // cursor = "<publishedAt>|<id>" of the last item seen
  if (cur) { const i = list.findIndex(a => (a.publishedAt||'')+'|'+a.id === cur); list = i>=0 ? list.slice(i+1) : []; }
  const page = list.slice(0,limit), last = page[page.length-1];
  return { articles: page, nextCursor: list.length>limit && last ? (last.publishedAt||'')+'|'+last.id : null, lastRefresh: state.lastRun };
}

const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png'};
const server = http.createServer((req,res) => {
  const u = new URL(req.url,'http://x'); const send=(c,b,t='application/json')=>{res.writeHead(c,{'Access-Control-Allow-Origin':'*','Content-Type':t+'; charset=utf-8','Cache-Control':t==='application/json'?'public, max-age=30':'no-cache'});res.end(typeof b==='string'?b:JSON.stringify(b));};
  if (req.method!=='GET') return send(405,{error:'method not allowed'});
  if (u.pathname==='/api/categories') return send(200,{categories:CATEGORIES});
  if (u.pathname==='/api/news') { const r = query(u); if (u.searchParams.get('translate')!=='ur') return send(200,r);
    return translateArticles(r.articles).then(a=>send(200,{...r,articles:a,translation:'machine (MyMemory)'})).catch(()=>send(200,r)); }
  if (u.pathname==='/api/health') return send(200,{ok:state.articles.length>0,articles:state.articles.length,lastRefresh:state.lastRun,sources:state.sources});
  const f = path.join(__dirname,'public', u.pathname==='/'?'index.html':u.pathname);
  if (!f.startsWith(path.join(__dirname,'public'))) return send(403,{error:'forbidden'});
  fs.readFile(f,(e,d)=>e?send(404,{error:'not found'}):(res.writeHead(200,{'Content-Type':(MIME[path.extname(f)]||'application/octet-stream')+'; charset=utf-8'}),res.end(d)));
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Mudassir News listening on port ${PORT}`);

    const runRefresh = async () => {
      try {
        await refresh();
      } catch (err) {
        console.error('[refresh error]', err);
      }
    };

    runRefresh();
    setInterval(runRefresh, REFRESH_MS);
  });
}

module.exports = { server, query, state, CATEGORIES };
