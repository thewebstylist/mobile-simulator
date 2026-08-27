import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const desktopSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="812"><rect width="1500" height="812" fill="#102e45"/><circle cx="530" cy="420" r="280" fill="#ed7950"/><text x="90" y="170" fill="white" font-size="72" font-family="Arial">DESKTOP WELCOME</text></svg>`);
const mobileSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="430" height="932"><rect width="430" height="932" fill="#102e45"/><circle cx="220" cy="430" r="190" fill="#ed7950"/><text x="35" y="180" fill="white" font-size="38" font-family="Arial">MOBILE</text></svg>`);

async function generateWithOverrides(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Website URL").fill("https://1.1.1.1");
  await page.getByRole("button", { name: /advanced capture settings/i }).click();
  const files = page.locator('input[type="file"]');
  await files.nth(0).setInputFiles({ name: "desktop.svg", mimeType: "image/svg+xml", buffer: desktopSvg });
  await files.nth(1).setInputFiles({ name: "mobile.svg", mimeType: "image/svg+xml", buffer: mobileSvg });
  await page.getByRole("button", { name: /generate promo image/i }).click();
  await expect(page.locator(".preview-ratio img")).toBeVisible({ timeout: 60_000 });
}

test("uploaded screenshot overrides generate preview and exact downloads", async ({ page, request }) => {
  await generateWithOverrides(page);
  await expect(page.locator(".brand-logo")).toBeVisible();
  const preview = page.locator(".preview-ratio img");
  await expect(preview).toBeVisible();
  const standardUrl = await page.getByRole("link", { name: /JPG 1500/ }).getAttribute("href");
  const masterUrl = await page.getByRole("link", { name: /JPG 3000/ }).getAttribute("href");
  const standard = await request.get(standardUrl!);
  const master = await request.get(masterUrl!);
  await expect(sharp(await standard.body()).metadata()).resolves.toMatchObject({ width: 1500, height: 812 });
  await expect(sharp(await master.body()).metadata()).resolves.toMatchObject({ width: 3000, height: 1624 });
  const recentDownload = page.getByRole("link", { name: /Download 1.1.1.1 at 1500 pixels wide/i });
  await page.locator(".recent-card").hover();
  await expect(recentDownload).toHaveAttribute("href", standardUrl!);
  await page.getByRole("button", { name: /Delete 1.1.1.1 from recent generations/i }).click();
  await expect(page.getByRole("button", { name: /Use 1.1.1.1 again/i })).toHaveCount(0);
});

test("phone layout visual regression", async ({ page }) => {
  await generateWithOverrides(page);
  await expect(page.locator(".preview-ratio")).toHaveScreenshot("locked-phone-composite.png");
});

test("invalid URL remains understandable", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Website URL").fill("file:///etc/passwd");
  await page.getByRole("button", { name: /generate promo image/i }).click();
  await expect(page.getByText(/Only HTTP and HTTPS/i)).toBeVisible();
});

test("standalone vanilla page generates and exposes only two JPEG downloads", async ({ page }) => {
  await page.goto("/index-standalone.html");
  await expect(page.getByRole("heading", { name: /The Desktop \+ iPhone Website Capture HERO!/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Sterling Creations Ai/i }).last()).toHaveAttribute("target", "_blank");
  await page.getByLabel("Website URL").fill("https://1.1.1.1");
  await page.getByText("Advanced capture settings").click();
  const files = page.locator('input[type="file"]');
  await files.nth(0).setInputFiles({ name: "desktop.svg", mimeType: "image/svg+xml", buffer: desktopSvg });
  await files.nth(1).setInputFiles({ name: "mobile.svg", mimeType: "image/svg+xml", buffer: mobileSvg });
  await page.getByRole("button", { name: /generate promo image/i }).click();
  await expect(page.locator("#output-image")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("link", { name: /JPG 1500/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /JPG 3000/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /PNG/i })).toHaveCount(0);
});

const hostileThemeCss = `
  img { width: 100% !important; height: auto !important; position: absolute !important; }
  button { background: #119ee9 !important; color: white !important; border-radius: 30px !important; }
  h1 { color: red !important; font-size: 18px !important; text-transform: uppercase !important; }
`;

test("full-page handoff resists hostile WordPress theme rules", async ({ page }) => {
  await page.goto("/index-standalone-full-page.html");
  await page.addStyleTag({ content: hostileThemeCss });
  await expect(page.locator("#sterling-mobile-simulator > header")).toHaveCount(1);
  await expect(page.locator("#sterling-mobile-simulator > footer")).toHaveCount(1);
  const logo = page.locator(".sms-brand-logo");
  await expect(logo).toHaveCSS("position", "static");
  await expect(logo).toHaveCSS("width", "71px");
  await expect(logo).toHaveCSS("height", "70px");
  await expect(page.locator("#generate-button")).toHaveCSS("background-color", "rgb(244, 243, 239)");
  await expect(page.locator("h1")).toHaveCSS("font-size", "64px");
});

test("theme embed omits duplicate chrome and resists button overrides", async ({ page }) => {
  await page.goto("/index-standalone-theme-embed.html");
  await page.addStyleTag({ content: hostileThemeCss });
  await expect(page.locator("#sterling-mobile-simulator > header")).toHaveCount(0);
  await expect(page.locator("#sterling-mobile-simulator > footer")).toHaveCount(0);
  await expect(page.locator(".sms-brand-logo")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /The Desktop \+ iPhone Website Capture HERO!/i })).toBeVisible();
  await expect(page.locator("#generate-button")).toHaveCSS("background-color", "rgb(244, 243, 239)");
});

test("iframe document is complete, theme-friendly, and reports its height", async ({ page }) => {
  await page.goto("/index-standalone-iframe.html");
  await expect(page.locator("#sterling-mobile-simulator > header")).toHaveCount(0);
  await expect(page.locator("#sterling-mobile-simulator > footer")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /The Desktop \+ iPhone Website Capture HERO!/i })).toBeVisible();
  await expect(page.locator('meta[charset="UTF-8"]')).toHaveCount(1);
  await expect(page.locator("body")).toContainText("Generate promo image");
});

test("theme embed explains a missing capture API instead of showing a JSON parse error", async ({ page }) => {
  await page.route("**/api/generate", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>WordPress</title>" });
  });
  await page.goto("/index-standalone-theme-embed.html");
  await page.getByLabel("Website URL").fill("https://example.com");
  await page.getByRole("button", { name: /generate promo image/i }).click();
  await expect(page.getByText(/Capture API is not connected/i)).toBeVisible();
  await expect(page.getByText(/Unexpected token/i)).toHaveCount(0);
});

test("local file preview directs generation through localhost", async ({ page }) => {
  const fileUrl = pathToFileURL(resolve("public/index-standalone-full-page.html")).href;
  await page.goto(fileUrl);
  await page.getByLabel("Website URL").fill("https://example.com");
  await page.getByRole("button", { name: /generate promo image/i }).click();
  await expect(page.getByText(/Local file previews cannot run generation/i)).toBeVisible();
  await expect(page.getByText(/http:\/\/localhost:3000\/index-standalone-full-page\.html/i)).toBeVisible();
  await expect(page.getByText(/screenshot overrides will not bypass it/i)).toBeVisible();
});
