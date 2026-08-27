# Sterling Mobile Simulator — Final Web Package

This archive contains the complete web application: the Next.js interface, Playwright capture service, Sharp compositor, standalone HTML, WordPress embed variants, favicon, social-preview image, tests, and Docker deployment files.

## Preview locally

From this folder, run:

```bash
npm install
npx playwright install chromium
npm run dev
```

Then open one of these HTTP URLs:

- `http://localhost:3000/` — React/Next application
- `http://localhost:3000/index-standalone.html` — standalone full document
- `http://localhost:3000/index-standalone-full-page.html` — blank-template WordPress presentation
- `http://localhost:3000/index-standalone-theme-embed.html` — theme-header/footer presentation

Do not open the HTML files with a `file:///` URL. The visual interface will appear, but browser security prevents it from reaching the capture API, so generation will show a connection error.

If port 3000 is already occupied by this project, do not start a second copy. Open the URLs above and hard-refresh the page. A cache-busting URL such as `http://localhost:3000/index-standalone-full-page.html?v=final-20260826` is also safe.

## WordPress use

- Use `public/index-standalone-full-page.html` with a blank/no-header/no-footer template.
- Use `public/index-standalone-theme-embed.html` when retaining the WordPress theme header and footer.
- Paste the chosen file into one Custom HTML or Raw HTML widget.
- Use a full-width/stretch row with zero widget padding, then purge SiteGround and page-builder caches.

The WordPress HTML is the frontend only. Playwright and Sharp require this Node.js application to be deployed on an HTTPS server. After deployment, set the `sterling-api-base` meta tag near the top of the embed file to the deployed API origin. Never point it at a WordPress route unless that route is configured as a reverse proxy for this application.

## Production deployment

The included `render.yaml` and Dockerfile provide a Render Blueprint deployment path. Put the project in a GitHub/GitLab repository, create a Render Blueprint from that repository, and wait for `/api/health` to return JSON with `"ok": true`.

For any Docker host, the equivalent local commands are:

```bash
docker build -t sterling-mobile-simulator .
docker run --rm -p 3000:3000 sterling-mobile-simulator
```

The application allows requests from `https://sterlingcreations.ai` and `https://www.sterlingcreations.ai` by default. Add any other trusted origins through the comma-separated `PROMO_ALLOWED_ORIGINS` environment variable.

After the service is live, copy its HTTPS origin—without a trailing slash—into the WordPress embed:

```html
<meta name="sterling-api-base" content="https://your-live-api-host.example" />
```

Purge SiteGround and WordPress/page-builder caches after saving. Confirm that `https://your-live-api-host.example/api/health` returns JSON before testing Generate.

## Current limits

- 30 generation requests per client per hour
- Generated files and recent-generation thumbnails retained for 24 hours
- JPEG exports at 1500 × 812 and 3000 × 1624

## Metadata approval still required

The included 1200 × 630 social-preview image, Google/search title, and Google/search meta description remain draft handoff items until Sterling explicitly approves them. Indexing is intentionally disabled in the current project metadata.
