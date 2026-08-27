import sharp, { type OverlayOptions } from "sharp";
import { PROMO_LAYOUT, scaledLayout } from "./layout";
import type { CaptureSettings, ExportVariant } from "./types";

export const IPHONE_STATUS = Object.freeze({
  time: "11:11",
  batteryLevel: 100,
  leftInset: 30,
  rightInset: 24,
});

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);
}

function phoneBodySvg(width: number, height: number, scale: number, shadow: number) {
  const radius = 62 * scale;
  const blur = (10 + shadow * 0.25) * scale;
  const opacity = Math.min(0.72, 0.15 + shadow / 130);
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#71747a"/><stop offset="0.17" stop-color="#15161a"/>
          <stop offset="0.55" stop-color="#303238"/><stop offset="0.84" stop-color="#090a0c"/><stop offset="1" stop-color="#8b8e92"/>
        </linearGradient>
        <filter id="shadow" x="-40%" y="-30%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="${blur}"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${opacity} 0"/>
        </filter>
      </defs>
      <rect x="${4 * scale}" y="${10 * scale}" width="${width - 8 * scale}" height="${height - 8 * scale}" rx="${radius}" fill="#000" filter="url(#shadow)"/>
      <rect x="${2 * scale}" y="${2 * scale}" width="${width - 4 * scale}" height="${height - 2 * scale}" rx="${radius}" fill="url(#metal)"/>
      <rect x="${7 * scale}" y="${7 * scale}" width="${width - 14 * scale}" height="${height - 12 * scale}" rx="${radius - 5 * scale}" fill="#050506"/>
      <path d="M ${13 * scale} ${70 * scale} V ${height - 72 * scale}" stroke="#a6a8ab" stroke-opacity=".28" stroke-width="${1 * scale}"/>
      <rect x="0" y="${124 * scale}" width="${4 * scale}" height="${64 * scale}" rx="${2 * scale}" fill="#44464b"/>
      <rect x="0" y="${205 * scale}" width="${4 * scale}" height="${89 * scale}" rx="${2 * scale}" fill="#44464b"/>
      <rect x="${width - 4 * scale}" y="${177 * scale}" width="${4 * scale}" height="${106 * scale}" rx="${2 * scale}" fill="#55575c"/>
    </svg>`);
}

function statusBarSvg(width: number, height: number, scale: number) {
  const islandWidth = 84 * scale;
  const islandX = (width - islandWidth) / 2;
  const batteryWidth = 34 * scale;
  const batteryX = width - (IPHONE_STATUS.rightInset + 38) * scale;
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#050506"/>
      <rect x="${islandX}" y="${6 * scale}" width="${islandWidth}" height="${24 * scale}" rx="${12 * scale}" fill="#000" stroke="#121318" stroke-width="${0.8 * scale}"/>
      <circle cx="${islandX + islandWidth - 15 * scale}" cy="${18 * scale}" r="${2.1 * scale}" fill="#081c12"/>
      <text x="${IPHONE_STATUS.leftInset * scale}" y="${28 * scale}" font-family="Arial, sans-serif" font-weight="700" font-size="${14 * scale}" fill="#fff">${IPHONE_STATUS.time}</text>
      <g fill="#fff">
        <rect x="${width - 107 * scale}" y="${25 * scale}" width="${3.5 * scale}" height="${4 * scale}" rx="${1.2 * scale}"/>
        <rect x="${width - 101 * scale}" y="${21 * scale}" width="${3.5 * scale}" height="${8 * scale}" rx="${1.2 * scale}"/>
        <rect x="${width - 95 * scale}" y="${17 * scale}" width="${3.5 * scale}" height="${12 * scale}" rx="${1.2 * scale}"/>
        <rect x="${width - 89 * scale}" y="${13 * scale}" width="${3.5 * scale}" height="${16 * scale}" rx="${1.2 * scale}"/>
      </g>
      <path d="M${width - 83 * scale} ${18 * scale}q${9 * scale} -${8 * scale} ${18 * scale} 0M${width - 79 * scale} ${22 * scale}q${5 * scale} -${4.5 * scale} ${10 * scale} 0M${width - 75 * scale} ${26 * scale}q${1 * scale} -${1 * scale} ${2 * scale} 0" fill="none" stroke="#fff" stroke-linecap="round" stroke-width="${2.7 * scale}"/>
      <rect x="${batteryX}" y="${11 * scale}" width="${batteryWidth}" height="${20 * scale}" rx="${7 * scale}" fill="#fff"/>
      <rect x="${width - (IPHONE_STATUS.rightInset + 3) * scale}" y="${17 * scale}" width="${2 * scale}" height="${8 * scale}" rx="${1 * scale}" fill="#fff" opacity=".42"/>
      <text x="${batteryX + batteryWidth / 2}" y="${25.5 * scale}" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle" font-size="${10.5 * scale}" fill="#050506">${IPHONE_STATUS.batteryLevel}</text>
    </svg>`);
}

function browserToolbarSvg(width: number, height: number, scale: number, hostname: string, secure: boolean) {
  const shownHost = escapeXml(hostname.replace(/^www\./, "").slice(0, 23));
  const circleY = 8 * scale;
  const controlHeight = 47 * scale;
  const centreX = 63 * scale;
  const centreWidth = width - 126 * scale;
  const secureIcon = secure
    ? `<rect x="${centreX + 15 * scale}" y="${circleY + 18 * scale}" width="${10 * scale}" height="${8 * scale}" rx="${2 * scale}" fill="none" stroke="#fff" stroke-width="${1.5 * scale}"/><path d="M${centreX + 17 * scale} ${circleY + 18 * scale}v-${3 * scale}a${3 * scale} ${3 * scale} 0 0 1 ${6 * scale} 0v${3 * scale}" fill="none" stroke="#fff" stroke-width="${1.5 * scale}"/>`
    : "";
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#050506" stop-opacity="0"/><stop offset="1" stop-color="#050506" stop-opacity=".62"/></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="${4 * scale}"/></filter>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#fade)"/>
      <g fill="#191b20" fill-opacity=".9" stroke="#fff" stroke-opacity=".18" stroke-width="${1 * scale}">
        <rect x="${centreX}" y="${circleY}" width="${centreWidth}" height="${controlHeight}" rx="${23.5 * scale}"/>
      </g>
      ${secureIcon}
      <text x="${width / 2}" y="${circleY + 29.5 * scale}" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle" font-size="${10.2 * scale}" fill="#fff">${shownHost}</text>
      <path d="M${centreX + centreWidth - 25 * scale} ${circleY + 18 * scale}a${8 * scale} ${8 * scale} 0 1 1 -${1.4 * scale} ${12 * scale}" fill="none" stroke="#fff" stroke-linecap="round" stroke-width="${2.5 * scale}"/><path d="M${centreX + centreWidth - 25 * scale} ${circleY + 14 * scale}v${7 * scale}h${7 * scale}" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="${2.5 * scale}"/>
      <rect x="${(width - 92 * scale) / 2}" y="${height - 5 * scale}" width="${92 * scale}" height="${3.5 * scale}" rx="${2 * scale}" fill="#fff" fill-opacity=".86"/>
    </svg>`);
}

function phoneDetailsSvg(width: number, height: number, scale: number) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="shine"><stop stop-color="#fff" stop-opacity=".34"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <rect x="${12 * scale}" y="${12 * scale}" width="${310 * scale}" height="${677 * scale}" rx="${47 * scale}" fill="none" stroke="#111216" stroke-width="${2 * scale}"/>
      <path d="M${26 * scale} ${18 * scale} Q${15 * scale} ${29 * scale} ${15 * scale} ${52 * scale}" fill="none" stroke="url(#shine)" stroke-width="${1.2 * scale}"/>
    </svg>`);
}

async function roundedScreen(buffer: Buffer, width: number, height: number, radius: number) {
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="white"/></svg>`);
  return sharp(buffer).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

async function renderScale(
  desktop: Buffer,
  mobile: Buffer,
  url: URL,
  settings: CaptureSettings,
  scale: 1 | 2,
) {
  const layout = scaledLayout(scale);
  const darkening = Math.round((Math.max(0, Math.min(35, settings.backgroundDarkening)) / 100) * 255);
  const base = await sharp(desktop)
    .resize(layout.canvas.width, layout.canvas.height, { fit: "cover", position: "centre" })
    .composite(darkening ? [{ input: { create: { width: layout.canvas.width, height: layout.canvas.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: darkening / 255 } } }, blend: "over" }] : [])
    .png()
    .toBuffer();

  const websiteHeight = layout.screen.height - layout.statusBarHeight;
  const fittedMobile = await sharp(mobile)
    .resize(layout.screen.width, websiteHeight, { fit: "cover", position: "top" })
    .png()
    .toBuffer();
  const screenCanvas = sharp({ create: { width: layout.screen.width, height: layout.screen.height, channels: 4, background: "#050506" } });
  const screenParts: OverlayOptions[] = [
    { input: fittedMobile, left: 0, top: layout.statusBarHeight },
    { input: statusBarSvg(layout.screen.width, layout.statusBarHeight, scale), left: 0, top: 0 },
  ];
  if (settings.showAddress) {
    screenParts.push({
      input: browserToolbarSvg(layout.screen.width, layout.browserToolbarHeight, scale, url.hostname, url.protocol === "https:"),
      left: 0,
      top: layout.screen.height - layout.browserToolbarHeight,
    });
  }
  const screen = await roundedScreen(await screenCanvas.composite(screenParts).png().toBuffer(), layout.screen.width, layout.screen.height, layout.screen.radius);
  const phone = await sharp(phoneBodySvg(layout.phone.width, layout.phone.height, scale, settings.phoneShadow))
    .composite([
      { input: screen, left: layout.screen.x, top: layout.screen.y },
      { input: phoneDetailsSvg(layout.phone.width, layout.phone.height, scale), left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  const composite = sharp(base).composite([{ input: phone, left: layout.phone.x, top: layout.phone.y }]);
  return composite.jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer();
}

export async function createPromoExports(desktop: Buffer, mobile: Buffer, url: URL, settings: CaptureSettings) {
  const entries = await Promise.all([
    renderScale(desktop, mobile, url, settings, 1).then((buffer) => ["jpg", buffer] as const),
    renderScale(desktop, mobile, url, settings, 2).then((buffer) => ["jpg2x", buffer] as const),
  ]);
  return Object.fromEntries(entries) as Record<ExportVariant, Buffer>;
}

export { PROMO_LAYOUT };
