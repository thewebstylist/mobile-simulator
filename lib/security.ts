import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
]);

function isBlockedIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isBlockedIp(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  if (isIP(normalized) === 4) return isBlockedIpv4(normalized);
  if (isIP(normalized) !== 6) return true;
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  if (normalized.startsWith("::ffff:")) return isBlockedIpv4(normalized.slice(7));
  return false;
}

export function normalizePublicUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a website URL to continue.");
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Enter a valid public website URL.");
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Only HTTP and HTTPS websites can be captured.");
  if (url.username || url.password) throw new Error("URLs containing credentials are not supported.");
  url.hash = "";
  return url;
}

export async function assertPublicUrl(input: URL | string) {
  const url = typeof input === "string" ? normalizePublicUrl(input) : input;
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const allowTestLocal = process.env.ENABLE_LOCAL_CAPTURE_FOR_TESTS === "true";
  if (!hostname || BLOCKED_HOSTS.has(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    if (!allowTestLocal) throw new Error("Private and local network addresses cannot be captured.");
  }
  if (hostname === "169.254.169.254" || hostname === "[fd00:ec2::254]") throw new Error("Cloud metadata endpoints are blocked.");
  const literal = hostname.replace(/^\[|\]$/g, "");
  if (isIP(literal)) {
    if (isBlockedIp(literal) && !allowTestLocal) throw new Error("Private, reserved, and loopback addresses cannot be captured.");
    return url;
  }
  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("The website hostname could not be resolved.");
  }
  if (!addresses.length || (addresses.some(({ address }) => isBlockedIp(address)) && !allowTestLocal)) {
    throw new Error("This website resolves to a private or reserved network address.");
  }
  return url;
}

export function safeFilename(hostname: string) {
  const value = hostname
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${value || "website"}-mobile-friendly-promo`;
}
