import { describe, expect, it } from "vitest";
import { checkRateLimit, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS } from "@/lib/rate-limit";

describe("generation rate limit", () => {
  it("allows 30 requests per client in a one-hour window", () => {
    const client = `test-${crypto.randomUUID()}`;
    expect(RATE_LIMIT_MAX_ATTEMPTS).toBe(30);
    expect(RATE_LIMIT_WINDOW_MS).toBe(60 * 60 * 1000);
    for (let attempt = 0; attempt < RATE_LIMIT_MAX_ATTEMPTS; attempt += 1) {
      expect(checkRateLimit(client)).toBe(true);
    }
    expect(checkRateLimit(client)).toBe(false);
  });
});
