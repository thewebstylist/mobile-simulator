# Sterling Mobile-Friendly Promo Builder

A private Next.js production tool that captures a public homepage at desktop and iPhone 16 Pro Max viewports, then builds locked 1500×812 and 3000×1624 promotional composites.

## Local setup

Requires Node.js 20+.

```bash
npm install
npx playwright install chromium
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Standalone frontend

[`public/index-standalone.html`](./public/index-standalone.html) is the single-file, vanilla JavaScript + Tailwind Play CDN version. It is available locally at [http://localhost:3000/index-standalone.html](http://localhost:3000/index-standalone.html).

Two WordPress handoff variants are generated from that canonical file:

- `public/index-standalone-full-page.html`: Custom HTML widget fragment with the simulator’s Sterling header and footer, for a WordPress blank/no-header/no-footer page template.
- `public/index-standalone-theme-embed.html`: Custom HTML widget fragment with the simulator header and footer removed, for a page using the existing WordPress theme header and footer.
- `public/index-standalone-iframe.html`: complete, header/footer-free document intended to be served by the deployed container and embedded in WordPress with `public/wordpress-iframe-snippet.txt`. This is the recommended production integration.

The canonical `public/index-standalone.html` remains the complete document for direct hosting or an iframe. Do not paste that complete document into a WordPress widget; use one of the two embed variants instead.

Both disable Tailwind preflight, scope utility specificity under `#sterling-mobile-simulator`, and explicitly protect the logo, buttons, inputs, and generated images from WordPress/WPBakery CSS. Regenerate both files after standalone edits with `node scripts/generate-standalone-variants.ts`.

For Bunny deployment, follow `BUNNY-SETUP-GUIDE.md`. Uploading the source tree to Bunny Storage does not run the API; use Bunny Magic Containers for the Docker application.

The HTML is the presentation layer; automated capture and image compositing still require this Next.js server because browser-only JavaScript cannot run Playwright or Sharp. When the HTML is hosted on `sterlingcreations.ai`, deploy this app as an HTTPS API and set the `sterling-api-base` meta tag in the file to that API origin. Cross-origin requests from `sterlingcreations.ai` and `www.sterlingcreations.ai` are allowed by default. Add extra trusted origins with a comma-separated `PROMO_ALLOWED_ORIGINS` environment variable.

The branded favicon is `public/favicon.svg`; the 1200×630 Open Graph/Twitter preview is `public/sterling-mobile-simulator-og.png`. Regenerate the social image after design changes with `node scripts/generate-brand-assets.ts`.

## Use

1. Enter a public HTTP(S) URL.
2. Optionally adjust capture delay, scroll positions, background, shadow, browser address, hidden selector, or screenshot overrides.
3. Generate, inspect the preview, then download standard or 2× JPEG exports.
4. Use **Recapture website** to keep the same URL and settings.

Live capture rejects local, private, loopback, reserved, and cloud-metadata destinations. Redirects and subresource destinations are validated again. If a site blocks automation, upload desktop and mobile screenshots in Advanced Capture Settings.

## Test

```bash
npm test
npm run test:e2e
```

The suite covers URL blocking, invalid protocols, timeout messaging, screenshot overrides, exact output dimensions, and locked phone visual placement. Refresh the intentional visual baseline only after approving a layout change:

```bash
npm run test:update
```

To generate a live local sample, leave `npm run dev` running in one terminal and run:

```bash
npm run sample
```

## Docker

`render.yaml` is included for a Render Docker Blueprint and uses `/api/health` for deployment health checks. Once deployed, place the service's HTTPS origin in the WordPress embed's `sterling-api-base` meta tag.

```bash
docker build -t sterling-promo-builder .
docker run --rm -p 3000:3000 sterling-promo-builder
```

Generation is limited to 30 requests per client per hour. Generated files and browser-history thumbnails expire after 24 hours. Files are stored in the operating system temp directory; no database or paid service is used.

## Metadata handoff

The current title and description are internal drafts, and indexing is disabled. Before packaging or deployment, Sterling must approve the social preview image (1200×630 by default), Google/search title, and Google/search meta description; those approved values should then be added to page, Open Graph, and Twitter/X metadata.
