const test=require('node:test'),assert=require('node:assert');
const {parseFeed,dedupe}=require('../parser');const {server,state,query}=require('../server');
const src={id:'x',name:'Test Pub',lang:'en',cats:['world']};
const rss=`<rss xmlns:media="http://search.yahoo.com/mrss/"><channel>
<item><title><![CDATA[Floods hit &amp; Sindh]]></title><link>https://ex.com/a?utm=1</link><description><![CDATA[<p>Heavy <b>rain</b></p>]]></description><pubDate>Wed, 14 Oct 2026 10:00:00 GMT</pubDate><media:thumbnail url="https://ex.com/i.jpg"/></item>
<item><title>No image item</title><link>https://ex.com/b</link><description>&lt;img src="https://ex.com/inline.png"&gt; text</description><pubDate>garbage</pubDate></item>
<item><title>Bad link</title><link>javascript:alert(1)</link></item></channel></rss>`;
const atom=`<feed><entry><title>Atom story</title><link href="https://ex.com/c"/><updated>2026-10-15T08:00:00Z</updated><summary>S</summary></entry></feed>`;
test('RSS parse: title/summary/image/time',()=>{const a=parseFeed(rss,src);assert.equal(a.length,2);
 assert.equal(a[0].title,'Floods hit & Sindh');assert.equal(a[0].summary,'Heavy rain');assert.equal(a[0].image,'https://ex.com/i.jpg');
 assert.equal(a[0].publishedAt,'2026-10-14T10:00:00.000Z');assert.equal(a[1].image,'https://ex.com/inline.png');assert.equal(a[1].publishedAt,null)});
test('rejects non-http links',()=>assert.ok(!parseFeed(rss,src).some(a=>a.url.startsWith('javascript'))));
test('Atom parse',()=>{const a=parseFeed(atom,src);assert.equal(a[0].url,'https://ex.com/c');assert.equal(a[0].publishedAt,'2026-10-15T08:00:00.000Z')});
test('dedupe by URL and title, merges categories',()=>{const a=parseFeed(rss,src)[0];
 const b={...a,url:'https://ex.com/a?ref=2',categories:['pakistan']};const c={...a,url:'https://other.com/z',title:'FLOODS hit & sindh!'};
 const d=dedupe([a,b,c]);assert.equal(d.length,1);assert.deepEqual(d[0].categories.sort(),['pakistan','world'])});
test('query: category, search, cursor pagination without repeats',()=>{
 state.articles=Array.from({length:45},(_,i)=>({id:'i'+i,title:'Story '+i,summary:i%2?'rain':'sun',url:'https://e.com/'+i,categories:i<20?['world']:['pakistan'],lang:'en',publisher:'P',publishedAt:new Date(2e12-i*1e5).toISOString()}));
 const q=s=>query(new URL('http://x/?'+s));
 assert.equal(q('category=world&limit=50').articles.length,20);assert.equal(q('q=rain&limit=50').articles.length,22);
 const seen=new Set();let cur=null,pages=0;do{const r=q('limit=10'+(cur?'&cursor='+encodeURIComponent(cur):''));r.articles.forEach(a=>{assert.ok(!seen.has(a.id));seen.add(a.id)});cur=r.nextCursor;pages++}while(cur);
 assert.equal(seen.size,45);assert.equal(pages,5)});
test('HTTP: /api/health and static index',async()=>{await new Promise(r=>server.listen(0,r));const p=server.address().port;
 const h=await (await fetch(`http://localhost:${p}/api/health`)).json();assert.equal(h.articles,45);
 const i=await fetch(`http://localhost:${p}/`);assert.match(await i.text(),/Mudassir News/);
 assert.equal((await fetch(`http://localhost:${p}/..%2fserver.js`)).status,404);server.close()});
