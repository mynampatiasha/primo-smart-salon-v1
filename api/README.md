# Face Analyser AI proxy (Cloudflare Worker)

The site is static (GitHub Pages), so the AI key lives here instead of in the browser.
The Worker receives the photo, asks a vision model for cosmetic suggestions, keeps only
services listed in `../services-catalog.js`, and returns them. Photos are never stored or logged.

## Easiest: deploy from the Cloudflare website (no install)
1. https://dash.cloudflare.com → sign up / log in → **Workers & Pages** → **Create** → **Create Worker** → name it `primo-face-analyser` → **Deploy**.
2. **Edit code** → delete everything → paste the whole of `api/worker.bundle.js` → **Deploy**.
3. Worker → **Settings → Variables and Secrets** → add:
   - `XAI_API_KEY` — type **Secret** — your Grok key
   - `AI_PROVIDER` — Text — `xai`
   - `ALLOWED_ORIGINS` — Text — `https://mynampatiasha.github.io`
4. Copy the Worker URL (`https://primo-face-analyser.<you>.workers.dev`) into
   `face-analyser.html` → `window.PRIMO_ANALYZER_ENDPOINT`.

## Or deploy with the CLI
1. Get a Grok API key at https://console.x.ai (API Keys). Anthropic/OpenAI also work: change `AI_PROVIDER` in `wrangler.toml`.
2. From this `api/` folder:
   ```bash
   npx wrangler login
   npx wrangler secret put XAI_API_KEY      # paste the key when asked
   npx wrangler deploy
   ```
3. Copy the URL it prints (e.g. `https://primo-face-analyser.<you>.workers.dev`) into
   `face-analyser.html` → `window.PRIMO_ANALYZER_ENDPOINT`.
4. If the site moves to a custom domain, add it to `ALLOWED_ORIGINS` in `wrangler.toml` and redeploy.

## Recommended
- Add a Cloudflare rate-limiting rule on the Worker route (e.g. 10 requests/min per IP) to cap API cost.
- Check your AI provider's data-retention terms for API inputs and enable zero-retention if offered,
  so the page's privacy notice stays accurate.

## Updating services
Edit `../services-catalog.js`, then redeploy the Worker (`npx wrangler deploy`) so both sides match.
