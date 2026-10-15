const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const SOURCES=require('../feeds'),I18N=require('../public/i18n'),{translateText,translateArticles,_budget}=require('../translator');
const {server,state,query,CATEGORIES}=require('../server'),{dedupe}=require('../parser');
const pub=f=>path.join(__dirname,'../public',f);
const ok=t=>async()=>({ok:true,json:async()=>({responseStatus:200,responseData:{translatedText:t}})});

test('feed config: unique ids, https, known categories, has Urdu + Pakistan + intl sources',()=>{
 assert.equal(new Set(SOURCES.map(s=>s.id)).size,SOURCES.length);
 SOURCES.forEach(s=>{assert.match(s.url,/^https:\/\//);assert.ok(s.name&&['en','ur'].includes(s.lang));s.cats.forEach(c=>assert.ok(CATEGORIES.includes(c),s.id+' bad cat '+c))});
 assert.ok(SOURCES.some(s=>s.lang==='ur'));assert.ok(SOURCES.some(s=>s.cats.includes('pakistan')));assert.ok(SOURCES.some(s=>s.cats.includes('world')));
 ['education','weather','interesting','positive'].forEach(c=>assert.ok(SOURCES.some(s=>s.cats.includes(c)),'no source for '+c))});
test('i18n: ur and en have identical keys; Urdu is RTL; exact taglines',()=>{
 assert.deepEqual(Object.keys(I18N.ur).sort(),Object.keys(I18N.en).sort());assert.equal(I18N.ur.dir,'rtl');assert.equal(I18N.en.dir,'ltr');
 assert.equal(I18N.en.tagline,'Khabar Jahan, Wahan');assert.equal(I18N.ur.all,'تمام خبریں');
 CATEGORIES.forEach(c=>assert.ok(I18N.ur[c]&&I18N.en[c],'missing label '+c))});
test('index.html: Urdu default RTL, tagline hook, config.js loaded, no localhost hardcode',()=>{
 const h=fs.readFileSync(pub('index.html'),'utf8');assert.match(h,/lang="ur" dir="rtl"/);assert.match(h,/ui:LS\.get\('ui','ur'\)/);assert.match(h,/src="\/config\.js"/);assert.ok(!/localhost|127\.0\.0\.1/.test(h));assert.match(h,/cat:'all'/)});
test('manifest: name, start_url, colors, real icon files incl. maskable',()=>{
 const m=JSON.parse(fs.readFileSync(pub('manifest.json'),'utf8'));assert.equal(m.name,'Mudassir News');assert.equal(m.display,'standalone');assert.ok(m.start_url.startsWith('/'));assert.match(m.theme_color,/^#/);
 assert.ok(m.icons.some(i=>i.sizes==='192x192'&&i.purpose==='any'));assert.ok(m.icons.some(i=>i.sizes==='512x512'));assert.ok(m.icons.some(i=>i.purpose==='maskable'));
 m.icons.forEach(i=>assert.ok(fs.existsSync(pub(i.src.slice(1))),i.src+' missing'));
 const png=fs.readFileSync(pub('icon-512.png'));assert.equal(png.readUInt32BE(16),512)});
test('service worker precaches files that exist',()=>{
 const sw=fs.readFileSync(pub('sw.js'),'utf8'),shell=eval(sw.match(/SHELL=(\[.*?\])/)[1]);
 shell.filter(f=>f!=='/').forEach(f=>assert.ok(fs.existsSync(pub(f.slice(1))),f+' missing'));assert.match(sw,/\/api\//)});
test('translator: Urdu result accepted; quota/English/failed responses rejected (fallback to original)',async()=>{
 assert.equal(await translateText('Hello world one',ok('ہیلو دنیا')),'ہیلو دنیا');
 assert.equal(await translateText('Hello two',ok('MYMEMORY WARNING: YOU USED ALL')),null);
 assert.equal(await translateText('Hello three',ok('still english')),null);
 assert.equal(await translateText('Hello four',async()=>{throw new Error('net')}),null);
 assert.equal(await translateText('Hello five',async()=>({ok:false})),null)});
test('translator: daily budget stops requests; articles keep originals; Urdu sources untouched',async()=>{
 const list=[{title:'Budget story',summary:'s',lang:'en'},{title:'اردو خبر',summary:'',lang:'ur'}];
 const out=await translateArticles(list,ok('ترجمہ'));assert.equal(out[0].title,'Budget story');assert.equal(out[0].titleUr,'ترجمہ');assert.equal(out[1].titleUr,undefined);assert.equal(list[0].titleUr,undefined);
 _budget.used=1e9;_budget.day=new Date().toISOString().slice(0,10);let calls=0;
 const o2=await translateArticles([{title:'Over budget x',summary:'',lang:'en'}],async()=>{calls++;return ok('ترجمہ')()});assert.equal(calls,0);assert.equal(o2[0].titleUr,undefined)});
test('All News, Pakistan, World filters and trending (multi-publisher) are correct',()=>{
 const mk=(i,c,pubs)=>({id:'x'+i,title:'T'+i,summary:'',url:'https://e.com/'+i,categories:c,lang:'en',publisher:pubs[0],publishers:pubs,sourceCount:pubs.length,publishedAt:new Date(2e12-i*1e5).toISOString()});
 state.articles=[mk(1,['pakistan'],['Dawn']),mk(2,['world'],['BBC','Al Jazeera']),mk(3,['pakistan','world'],['BBC Urdu']),mk(4,['science'],['NPR'])];
 const q=s=>query(new URL('http://x/?'+s)).articles.map(a=>a.id);
 assert.deepEqual(q('category=all'),['x1','x2','x3','x4']);assert.deepEqual(q('category=pakistan'),['x1','x3']);assert.deepEqual(q('category=world'),['x2','x3']);assert.deepEqual(q('category=trending'),['x2']);assert.deepEqual(q('category=weather'),[])});
test('dedupe counts distinct publishers across feeds',()=>{
 const a=(p,u)=>({title:'Same big story',url:u,categories:['world'],publisher:p,image:null});
 const d=dedupe([a('BBC','https://a.com/1'),a('NPR','https://b.com/2'),a('BBC','https://a.com/3')]);assert.equal(d.length,1);assert.equal(d[0].sourceCount,2)});
test('HTTP: CORS header, /api/categories, config.js served',async()=>{
 await new Promise(r=>server.listen(0,r));const b=`http://localhost:${server.address().port}`;
 const r=await fetch(b+'/api/categories');assert.equal(r.headers.get('access-control-allow-origin'),'*');assert.ok((await r.json()).categories.includes('all'));
 assert.match(await (await fetch(b+'/config.js')).text(),/API_BASE/);
 const n=await (await fetch(b+'/api/news?category=world&translate=ur')).json();assert.ok(Array.isArray(n.articles));server.close()});
