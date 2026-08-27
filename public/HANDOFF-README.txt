STERLING MOBILE SIMULATOR — HANDOFF

FILES

RECOMMENDED PRODUCTION METHOD

Deploy the complete application with Bunny Magic Containers (not Bunny
Storage), then use wordpress-iframe-snippet.txt in WordPress. The iframe loads
index-standalone-iframe.html from the running container, so the API is connected
automatically and WordPress theme CSS cannot override the simulator.

1. index-standalone-full-page.html
   Paste the entire file into one WordPress Custom HTML/Raw HTML widget on a
   blank/no-header/no-footer page template. Includes the simulator's branded
   header and footer.

2. index-standalone-theme-embed.html
   Paste the entire file into one WordPress Custom HTML/Raw HTML widget when
   using the SterlingCreations.ai theme header and footer. The simulator's
   duplicate header and footer are removed.

3. index-standalone.html
   Complete standalone HTML document for direct hosting or an iframe. Do not
   paste this complete document into a WordPress widget.

4. favicon.svg
   Branded browser favicon.

5. sterling-mobile-simulator-og.png
   1200 x 630 Open Graph and social-sharing preview image.

6. index-standalone-iframe.html
   Complete header/footer-free document served by the running container.

7. wordpress-iframe-snippet.txt
   Short recommended WordPress embed. Replace the placeholder with the Bunny
   Magic Containers HTTPS endpoint before pasting it into a Raw HTML widget.

WORDPRESS SETUP

- Use one Custom HTML/Raw HTML widget for the selected embed file.
- Set the containing row to full-width/stretch with zero widget padding.
- Purge SG Cache and hard-refresh after replacing the code.
- If the capture API is on another HTTPS origin, update this line near the top:
  <meta name="sterling-api-base" content="https://your-api-domain.com" />

CAPTURE API REQUIREMENT

The HTML widget is the visual frontend only. Website capture and JPEG creation
use Playwright and Sharp, which cannot run inside WordPress or browser-only
JavaScript. Deploy the included Next.js/Docker application on an HTTPS Node.js
server, then place that server origin in sterling-api-base. Leaving the value
blank makes the widget request /api/generate from WordPress; without a reverse
proxy, WordPress returns an HTML page and generation cannot start.

LOCAL PREVIEW

Do not test generation by double-clicking an HTML file or using a file:/// URL.
With npm run dev running, open one of these instead:

  http://localhost:3000/index-standalone.html
  http://localhost:3000/index-standalone-full-page.html
  http://localhost:3000/index-standalone-theme-embed.html

METADATA STATUS

The social preview is included. The Google/search title and meta description
remain drafts until Sterling provides or approves the final wording.
