// Source registry. ALL URLs are UNVERIFIED until you run the server with internet and check /api/health
// (each source reports ok/error there). Only these URLs are ever fetched (no SSRF). Check each publisher's RSS terms.
const bbc = p => `https://feeds.bbci.co.uk/${p}`;
module.exports = [
  // Pakistan (English)
  { id:'dawn',       name:'Dawn',            url:'https://www.dawn.com/feeds/home',     cats:['pakistan'], lang:'en' },
  { id:'dawn-biz',   name:'Dawn',            url:'https://www.dawn.com/feeds/business', cats:['pakistan','business'], lang:'en' },
  { id:'dawn-sport', name:'Dawn',            url:'https://www.dawn.com/feeds/sport',    cats:['pakistan','sports'], lang:'en' },
  { id:'dawn-tech',  name:'Dawn',            url:'https://www.dawn.com/feeds/tech',     cats:['pakistan','technology'], lang:'en' },
  { id:'tribune',    name:'Express Tribune', url:'https://tribune.com.pk/feed/home',    cats:['pakistan'], lang:'en' },
  { id:'ptoday',     name:'Pakistan Today',  url:'https://www.pakistantoday.com.pk/feed/', cats:['pakistan'], lang:'en' },
  { id:'brecorder',  name:'Business Recorder',url:'https://www.brecorder.com/feeds/latest-news', cats:['pakistan','business'], lang:'en' },
  { id:'ary',        name:'ARY News',        url:'https://arynews.tv/feed/',            cats:['pakistan'], lang:'en' },
  // Urdu
  { id:'bbc-urdu',   name:'BBC Urdu',        url:bbc('urdu/rss.xml'),                    cats:['pakistan','world'], lang:'ur' },
  { id:'dw-urdu',    name:'DW Urdu',         url:'https://rss.dw.com/xml/rss-urdu-all', cats:['world'], lang:'ur' },
  { id:'express-ur', name:'Express News',    url:'https://www.express.pk/feed/',        cats:['pakistan'], lang:'ur' },
  { id:'indep-ur',   name:'Independent Urdu',url:'https://www.independenturdu.com/rss.xml', cats:['pakistan','world'], lang:'ur' },
  // International
  { id:'bbc-world',  name:'BBC News', url:bbc('news/world/rss.xml'), cats:['world'], lang:'en' },
  { id:'bbc-asia',   name:'BBC News', url:bbc('news/world/asia/rss.xml'), cats:['world'], lang:'en' },
  { id:'bbc-africa', name:'BBC News', url:bbc('news/world/africa/rss.xml'), cats:['world'], lang:'en' },
  { id:'bbc-me',     name:'BBC News', url:bbc('news/world/middle_east/rss.xml'), cats:['world'], lang:'en' },
  { id:'bbc-eur',    name:'BBC News', url:bbc('news/world/europe/rss.xml'), cats:['world'], lang:'en' },
  { id:'bbc-us',     name:'BBC News', url:bbc('news/world/us_and_canada/rss.xml'), cats:['world'], lang:'en' },
  { id:'bbc-pol',    name:'BBC News', url:bbc('news/politics/rss.xml'), cats:['politics'], lang:'en' },
  { id:'bbc-biz',    name:'BBC News', url:bbc('news/business/rss.xml'), cats:['business'], lang:'en' },
  { id:'bbc-tech',   name:'BBC News', url:bbc('news/technology/rss.xml'), cats:['technology'], lang:'en' },
  { id:'bbc-sci',    name:'BBC News', url:bbc('news/science_and_environment/rss.xml'), cats:['science','weather'], lang:'en' },
  { id:'bbc-health', name:'BBC News', url:bbc('news/health/rss.xml'), cats:['health'], lang:'en' },
  { id:'bbc-edu',    name:'BBC News', url:bbc('news/education/rss.xml'), cats:['education'], lang:'en' },
  { id:'bbc-ent',    name:'BBC News', url:bbc('news/entertainment_and_arts/rss.xml'), cats:['entertainment'], lang:'en' },
  { id:'bbc-sport',  name:'BBC Sport',url:bbc('sport/rss.xml'), cats:['sports'], lang:'en' },
  { id:'aljazeera',  name:'Al Jazeera', url:'https://www.aljazeera.com/xml/rss/all.xml', cats:['world'], lang:'en' },
  { id:'guardian-w', name:'The Guardian', url:'https://www.theguardian.com/world/rss', cats:['world'], lang:'en' },
  { id:'guardian-ai',name:'The Guardian', url:'https://www.theguardian.com/technology/artificialintelligenceai/rss', cats:['technology'], lang:'en' },
  { id:'guardian-env',name:'The Guardian',url:'https://www.theguardian.com/environment/rss', cats:['weather','science'], lang:'en' },
  { id:'npr',        name:'NPR', url:'https://feeds.npr.org/1001/rss.xml', cats:['world'], lang:'en' },
  { id:'sciencedaily',name:'ScienceDaily', url:'https://www.sciencedaily.com/rss/all.xml', cats:['science'], lang:'en' },
  { id:'smithsonian',name:'Smithsonian Magazine', url:'https://www.smithsonianmag.com/rss/latest_articles/', cats:['interesting','science'], lang:'en' },
  { id:'gnn',        name:'Good News Network', url:'https://www.goodnewsnetwork.org/feed/', cats:['positive'], lang:'en' },
];
