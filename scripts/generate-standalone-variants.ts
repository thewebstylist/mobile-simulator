import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const sourcePath = resolve(root, "public/index-standalone.html");
const fullPath = resolve(root, "public/index-standalone-full-page.html");
const themePath = resolve(root, "public/index-standalone-theme-embed.html");
const iframePath = resolve(root, "public/index-standalone-iframe.html");
const source = await readFile(sourcePath, "utf8");

const assetsStart = source.indexOf('  <link rel="preconnect"');
const assetsEnd = source.indexOf("</head>");
const bodyStart = source.indexOf("<body");
const bodyOpenEnd = source.indexOf(">", bodyStart) + 1;
const bodyEnd = source.lastIndexOf("</body>");
if (assetsStart < 0 || assetsEnd < 0 || bodyStart < 0 || bodyEnd < 0) throw new Error("Standalone source structure changed.");

const assets = source.slice(assetsStart, assetsEnd).trim();
const body = source.slice(bodyOpenEnd, bodyEnd).trim();
const documentPrefix = source.slice(0, bodyStart);
const bodyOpenTag = source.slice(bodyStart, bodyOpenEnd);
const sharedNote = "Set sterling-api-base below when the capture API uses a different HTTPS origin.";

const fullEmbed = `<!--
  STERLING MOBILE SIMULATOR — WORDPRESS BLANK-PAGE EMBED
  Paste this entire file into one Custom HTML widget on a blank/no-header/no-footer
  WordPress page template. The simulator’s own Sterling header and footer are included.
  ${sharedNote}
-->
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="sterling-api-base" content="" />
${assets}
${body}
`;

const themeBody = body
  .replace(/\s*<header\b[\s\S]*?<\/header>\s*/i, "\n")
  .replace(/\s*<footer\b[\s\S]*?<\/footer>\s*/i, "\n");

const themeEmbed = `<!--
  STERLING MOBILE SIMULATOR — WORDPRESS THEME EMBED
  Paste this entire file into one Custom HTML widget on a page that already uses the
  SterlingCreations.ai theme header and footer. Simulator header/footer are removed.
  ${sharedNote}
-->
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="sterling-api-base" content="" />
${assets}
${themeBody.trim()}
`;

const iframeResizeBridge = `<script>
  (() => {
    const reportHeight = () => window.parent.postMessage({
      type: "sterling-mobile-simulator-height",
      height: Math.ceil(document.documentElement.scrollHeight),
    }, "*");
    window.addEventListener("load", reportHeight);
    new ResizeObserver(reportHeight).observe(document.documentElement);
    window.setTimeout(reportHeight, 500);
  })();
</script>`;

const iframeDocument = `${documentPrefix}${bodyOpenTag}
${themeBody.trim()}
${iframeResizeBridge}
</body>
</html>
`;

await writeFile(fullPath, fullEmbed);
await writeFile(themePath, themeEmbed);
await writeFile(iframePath, iframeDocument);
console.log(fullPath);
console.log(themePath);
console.log(iframePath);
