import { describe, expect, it } from "vitest";
import { assertPublicUrl, normalizePublicUrl, safeFilename } from "@/lib/security";
import { friendlyCaptureError } from "@/lib/errors";

describe("URL security", () => {
  it("normalizes hostnames without a scheme", () => {
    expect(normalizePublicUrl("example.com/hello").href).toBe("https://example.com/hello");
  });

  it.each(["http://127.0.0.1", "http://10.0.0.1", "http://169.254.169.254/latest/meta-data", "http://[::1]"])(
    "blocks private or metadata URL %s",
    async (value) => {
      await expect(assertPublicUrl(value)).rejects.toThrow(/Private|metadata|reserved|loopback/i);
    },
  );

  it.each(["file:///etc/passwd", "ftp://example.com", "javascript:alert(1)"])("rejects invalid protocol %s", (value) => {
    expect(() => normalizePublicUrl(value)).toThrow(/HTTP|valid public website URL/);
  });

  it("sanitizes filenames", () => {
    expect(safeFilename("WWW.Example.COM<script>")).toBe("example.com-script-mobile-friendly-promo");
  });

  it("turns timeout internals into a usable recovery message", () => {
    expect(friendlyCaptureError(new Error("page.goto: Timeout 30000ms exceeded"))).toContain("took too long");
  });
});
