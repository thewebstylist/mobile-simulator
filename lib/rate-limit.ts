const attempts = new Map<string, number[]>();
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const RATE_LIMIT_MAX_ATTEMPTS = 30;

export function checkRateLimit(key: string) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_ATTEMPTS) return false;
  recent.push(now);
  attempts.set(key, recent);
  return true;
}
