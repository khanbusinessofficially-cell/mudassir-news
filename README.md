# Mudassir News — خبر جہاں، وہاں (Khabar Jahan, Wahan)
Node.js RSS aggregator + Urdu-first installable PWA. Zero npm dependencies, $0 to run.

## Run locally
    node server.js            # Node 20+, internet required for live news
    open http://localhost:3000
    npm test                  # 16 tests, no network needed
Env (all optional): `PORT`, `REFRESH_MINUTES` (10), `MYMEMORY_EMAIL` (raises free translation quota), `TRANSLATE_DAILY_CHARS`.

## Verify sources (important)
Feed URLs in `feeds.js` are NOT verified. Start the server, wait ~15 s, open `/api/health`: every source shows `ok` or its `error`. Delete/fix failing ones.

## Urdu translation
`/api/news?translate=ur` machine-translates English titles/summaries via MyMemory's free API (small daily quota). The UI labels them «مشینی ترجمہ» and shows the original headline under them. If quota runs out or a call fails, the original English text is shown.

## Deploy for $0
1. Push this folder to GitHub. 2. render.com > New Web Service > pick repo (uses `render.yaml`, free plan; it sleeps when idle, first load is slow).
3. Same-origin hosting needs no config. If the app is hosted separately, set `API_BASE` in `public/config.js` to the backend URL (CORS is enabled).

## Android APK ($0)
1. Open the deployed https URL in Chrome on Android > menu > Install app (works immediately).
2. For an APK: pwabuilder.com > enter URL > Package for Android > download. Sideload it (enable "install unknown apps"). Play Store needs a $25 developer fee, so sideloading is the free path.
3. Or locally: `npx @bubblewrap/cli init --manifest https://YOURSITE/manifest.json && npx @bubblewrap/cli build` (needs JDK 17+ and Android SDK).
