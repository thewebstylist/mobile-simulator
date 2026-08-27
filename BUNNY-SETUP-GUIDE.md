# Bunny + WordPress Setup — Sterling Mobile Simulator

## The three systems have different jobs

1. **Bunny Storage/CDN** serves static files only. It does not start the Next.js server or execute Playwright/Sharp.
2. **Bunny Magic Containers** runs the complete Docker application and its `/api/*` routes.
3. **WordPress** keeps the Sterling theme header/footer and embeds the running simulator.

Do not upload the complete source ZIP into Bunny Storage. The `app`, `lib`, `scripts`, `tests`, `Dockerfile`, and package files are source/build inputs for the container—not public CDN assets.

## Recommended final architecture

```text
WordPress /mobile-simulator/
        ↓ iframe
Bunny Magic Container /index-standalone-iframe.html
        ↓ same-origin API requests
Bunny Magic Container /api/generate and /api/jobs/*
```

This keeps WordPress theme CSS away from the simulator and avoids cross-origin configuration mistakes.

## Step 1 — Put the complete app in GitHub

Unzip `sterling-mobile-simulator-web-final.zip` locally. Create a GitHub repository and upload the **contents** of the unzipped folder so `Dockerfile`, `package.json`, `app`, `lib`, and `public` are at the repository root.

The GitHub repository is the source/build location. Bunny Storage is not used for this step.

## Step 2 — Build a linux/amd64 Docker image

Bunny Magic Containers accepts images from Docker Hub or GitHub Container Registry. Build the included Dockerfile for `linux/amd64` and push it to a registry. Bunny's GitHub Actions deployment guide can automate this on each push.

## Step 3 — Deploy in Bunny Magic Containers

In the Bunny dashboard:

1. Open **Magic Containers**, not Storage.
2. Select **Add App** and use a single region with one running instance. The current private tool keeps active job state and temporary exports inside that instance.
3. Add the image from GitHub Container Registry or Docker Hub.
4. Add an HTTPS endpoint for container port `3000`.
5. Add `PROMO_ALLOWED_ORIGINS=https://sterlingcreations.ai,https://www.sterlingcreations.ai` as an environment variable.
6. Deploy and copy the assigned `https://mc-....bunny.run` endpoint.

Verify these two URLs before touching WordPress:

```text
https://YOUR-BUNNY-ENDPOINT/api/health
https://YOUR-BUNNY-ENDPOINT/index-standalone-iframe.html
```

The health URL must return JSON containing `"ok": true`. Generate should work on the iframe page because its API is on the same Bunny container origin.

## Step 4 — Add the simulator to WordPress

Open `public/wordpress-iframe-snippet.txt` in a plain-text editor. Replace `REPLACE-WITH-YOUR-BUNNY-ENDPOINT` with the actual Magic Containers hostname. Paste only that short snippet into one WPBakery Raw HTML/Custom HTML block.

Do not paste page source copied from Chrome. Do not paste `index-standalone-theme-embed.html` when using the iframe method.

Set the WordPress row to full-width/stretch and zero padding. Save, purge SiteGround/WPBakery caches, and hard-refresh.

## Bunny Storage cleanup

The uploaded `mobile-simulator` source folder in Bunny Storage is not used by the working container architecture. It can be removed after the Magic Container is healthy. If you want a static CDN demo, upload only `index-standalone.html`, `favicon.svg`, and `sterling-mobile-simulator-og.png`; generation still requires the Magic Container API URL in the HTML.
