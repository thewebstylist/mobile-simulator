import { existsSync } from "node:fs";
import { chromium, type BrowserContext, type Page } from "playwright";
import { assertPublicUrl } from "./security";
import type { CaptureSettings, GenerationStage } from "./types";

const CAPTURE_TIMEOUT = 30_000;

function localChromiumExecutable() {
  const configured = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (configured && existsSync(configured)) return configured;
  const bundled = chromium.executablePath();
  if (bundled && existsSync(bundled)) return undefined;
  const candidates =
    process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ]
      : process.platform === "win32"
        ? [
            `${process.env.PROGRAMFILES ?? "C:\\Program Files"}\\Google\\Chrome\\Application\\chrome.exe`,
            `${process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)"}\\Google\\Chrome\\Application\\chrome.exe`,
          ]
        : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  return candidates.find(existsSync);
}

async function preparePage(page: Page, scrollY: number, hideSelector: string, delaySeconds: number) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  }).catch(() => undefined);
  await page.waitForLoadState("networkidle", { timeout: 6_000 }).catch(() => undefined);
  await page.waitForTimeout(delaySeconds * 1_000);
  if (scrollY > 0) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), scrollY);
    await page.waitForTimeout(250);
  }
  if (hideSelector.trim()) {
    await page.evaluate((selector) => {
      try {
        document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
          element.style.setProperty("visibility", "hidden", "important");
        });
      } catch {
        // An invalid optional selector should not ruin the capture.
      }
    }, hideSelector);
  }
  await page.addStyleTag({ content: `
    *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
    ::selection { background: transparent !important; color: inherit !important; }
    html { scroll-behavior: auto !important; }
  ` });
}

async function protectContext(context: BrowserContext) {
  const validatedHosts = new Map<string, Promise<URL>>();
  await context.route("**/*", async (route) => {
    const requestUrl = route.request().url();
    if (!/^https?:/i.test(requestUrl)) return route.continue();
    try {
      const requestTarget = new URL(requestUrl);
      const cacheKey = `${requestTarget.protocol}//${requestTarget.host}`;
      const validation = validatedHosts.get(cacheKey) ?? assertPublicUrl(requestTarget);
      validatedHosts.set(cacheKey, validation);
      await validation;
      await route.continue();
    } catch {
      await route.abort("blockedbyclient");
    }
  });
}

async function captureViewport(
  url: URL,
  mode: "desktop" | "mobile",
  settings: CaptureSettings,
  updateStage: (stage: GenerationStage) => void,
) {
  updateStage(mode === "desktop" ? "Loading desktop homepage" : "Loading mobile homepage");
  const browser = await chromium.launch({
    headless: true,
    executablePath: localChromiumExecutable(),
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });
  let context: BrowserContext | undefined;
  try {
    context = await browser.newContext(
      mode === "desktop"
        ? { viewport: { width: 1500, height: 812 }, deviceScaleFactor: 2, colorScheme: "light" }
        : {
            viewport: { width: 430, height: 932 },
            screen: { width: 430, height: 932 },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            colorScheme: "light",
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          },
    );
    context.setDefaultTimeout(CAPTURE_TIMEOUT);
    context.setDefaultNavigationTimeout(CAPTURE_TIMEOUT);
    await protectContext(context);
    const page = await context.newPage();
    await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: CAPTURE_TIMEOUT });
    await assertPublicUrl(new URL(page.url()));
    await preparePage(
      page,
      mode === "desktop" ? settings.desktopScrollY : settings.mobileScrollY,
      settings.hideSelector,
      settings.delaySeconds,
    );
    updateStage(mode === "desktop" ? "Capturing desktop view" : "Capturing mobile view");
    return await page.screenshot({ type: "png", fullPage: false, animations: "disabled", timeout: CAPTURE_TIMEOUT });
  } finally {
    await context?.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}

export async function captureWebsite(
  url: URL,
  settings: CaptureSettings,
  overrides: { desktop?: Buffer; mobile?: Buffer },
  updateStage: (stage: GenerationStage) => void,
) {
  updateStage("Opening website");
  await assertPublicUrl(url);
  const desktop = overrides.desktop ?? (await captureViewport(url, "desktop", settings, updateStage));
  if (overrides.desktop) updateStage("Capturing desktop view");
  const mobile = overrides.mobile ?? (await captureViewport(url, "mobile", settings, updateStage));
  if (overrides.mobile) updateStage("Capturing mobile view");
  return { desktop, mobile };
}
