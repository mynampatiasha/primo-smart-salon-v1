# Face Analyser AI proxy (Cloudflare Worker)

The site is static (GitHub Pages), so the AI key lives here instead of in the browser.
The Worker receives the photo, asks a vision model for cosmetic suggestions, keeps only
services listed in `../services-catalog.js`, and returns them. Photos are never stored or logged.

## Deploy (one time, ~5 min)
1. Get an API key: https://console.anthropic.com (or set `AI_PROVIDER = "openai"` and use an OpenAI key).
2. From this `api/` folder:
   ```bash
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY
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
