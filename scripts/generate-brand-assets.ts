import { resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const logoPath = resolve(root, "public/assets/sterling-creations-ai-logo.png");
const outputPath = resolve(root, "public/sterling-mobile-simulator-og.png");

const artwork = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="blueGlow" cx="0" cy="0" r="1" gradientTransform="translate(1030 95) rotate(130) scale(420 360)" gradientUnits="userSpaceOnUse"><stop stop-color="#2c8cff" stop-opacity=".18"/><stop offset="1" stop-color="#070709" stop-opacity="0"/></radialGradient>
    <radialGradient id="pinkGlow" cx="0" cy="0" r="1" gradientTransform="translate(110 540) rotate(-40) scale(360 250)" gradientUnits="userSpaceOnUse"><stop stop-color="#F23AFC" stop-opacity=".12"/><stop offset="1" stop-color="#070709" stop-opacity="0"/></radialGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F23AFC"/><stop offset=".52" stop-color="#875cff"/><stop offset="1" stop-color="#2c8cff"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="heroGlow" x="-15%" y="-20%" width="130%" height="140%"><feGaussianBlur stdDeviation="1.25" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1200" height="630" fill="#070709"/>
  <rect width="1200" height="630" fill="url(#blueGlow)"/><rect width="1200" height="630" fill="url(#pinkGlow)"/>
  <rect x="25" y="25" width="1150" height="580" rx="2" fill="none" stroke="#ffffff" stroke-opacity=".13"/>
  <circle cx="52" cy="64" r="4" fill="url(#brand)" filter="url(#glow)"/>
  <text x="183" y="76" fill="#f4f3ef" font-family="Montserrat,Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="3">STERLING <tspan fill="#85858e" font-weight="500">CREATIONS AI</tspan></text>
  <line x1="65" y1="176" x2="112" y2="176" stroke="#F23AFC" stroke-width="2"/>
  <text x="128" y="181" fill="#90909a" font-family="Montserrat,Arial,sans-serif" font-size="12" letter-spacing="3">MOBILE PRESENTATION SYSTEM</text>
  <text x="64" y="275" fill="#f4f3ef" font-family="Montserrat,Arial,sans-serif" font-size="57" font-weight="800" letter-spacing="-3">The Desktop + iPhone</text>
  <text x="64" y="350" fill="#f4f3ef" font-family="Montserrat,Arial,sans-serif" font-size="57" font-weight="800" letter-spacing="-3">Website Capture</text>
  <text x="486" y="350" fill="none" stroke="#2c8cff" stroke-width="2.2" filter="url(#heroGlow)" font-family="Arial Black,Arial,sans-serif" font-size="57" font-weight="900" letter-spacing="1">HERO!</text>
  <text x="66" y="425" fill="#9e9ea7" font-family="Montserrat,Arial,sans-serif" font-size="20">Turn any homepage into a polished desktop-and-iPhone promo.</text>
  <g transform="translate(720 142)">
    <rect width="394" height="254" fill="#0d0d12" stroke="#454550" stroke-width="2"/>
    <rect x="15" y="18" width="364" height="216" fill="#111722"/>
    <rect x="15" y="18" width="364" height="13" fill="#2c8cff"/>
    <circle cx="165" cy="121" r="72" fill="#ff6138" opacity=".8"/>
    <path d="M15 215L158 72l80 79 56-57 85 84v56H15Z" fill="#172c3c" opacity=".82"/>
    <rect x="31" y="48" width="112" height="8" rx="4" fill="#f4f3ef"/><rect x="31" y="65" width="177" height="5" rx="2.5" fill="#90909a"/>
  </g>
  <g transform="translate(986 185)">
    <rect width="142" height="302" rx="29" fill="#171820" stroke="#666975" stroke-width="3"/>
    <rect x="7" y="8" width="128" height="286" rx="23" fill="#0c1119"/>
    <rect x="45" y="14" width="52" height="12" rx="6" fill="#020204"/>
    <rect x="13" y="41" width="116" height="8" fill="#2c8cff"/>
    <circle cx="77" cy="142" r="48" fill="#ff6138" opacity=".7"/>
    <path d="M13 236l50-70 35 33 31-35v95H13Z" fill="#173044"/>
    <rect x="27" y="77" width="85" height="7" rx="3.5" fill="#f4f3ef"/><rect x="34" y="91" width="71" height="5" rx="2.5" fill="#d3d3d8"/>
    <rect x="52" y="276" width="38" height="4" rx="2" fill="#f4f3ef" opacity=".85"/>
  </g>
  <rect x="65" y="505" width="286" height="52" fill="#f4f3ef"/>
  <text x="92" y="537" fill="#09090c" font-family="Montserrat,Arial,sans-serif" font-size="12" font-weight="800" letter-spacing="1.3">BUILD THE WELCOME SCREEN</text>
  <circle cx="1102" cy="546" r="5" fill="#F23AFC" filter="url(#glow)"/>
  <text x="1118" y="551" fill="#92929b" font-family="Montserrat,Arial,sans-serif" font-size="11" text-anchor="end">1500 × 812 + 2× master</text>
</svg>`;

const logo = await sharp(logoPath).resize(94, 93, { fit: "contain" }).png().toBuffer();
await sharp(Buffer.from(artwork))
  .composite([{ input: logo, left: 72, top: 39 }])
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log(outputPath);
