import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { createPromoExports, IPHONE_STATUS, PROMO_LAYOUT } from "@/lib/compositor";

const desktop = Buffer.from(`<svg width="1500" height="812"><rect width="1500" height="812" fill="#14325e"/><circle cx="500" cy="380" r="250" fill="#fb7a45"/></svg>`);
const mobile = Buffer.from(`<svg width="430" height="932"><rect width="430" height="932" fill="#f5cf4f"/><rect x="30" y="200" width="370" height="500" rx="30" fill="#145e42"/></svg>`);
const settings = { delaySeconds: 1, desktopScrollY: 0, mobileScrollY: 0, hideSelector: "", backgroundDarkening: 0, phoneShadow: 56, showAddress: true };

describe("locked composite", () => {
  it("keeps the reference phone bounding box immutable", () => {
    expect(PROMO_LAYOUT.phone).toEqual({ x: 1134, y: 111, width: 334, height: 701 });
    expect(Object.isFrozen(PROMO_LAYOUT)).toBe(true);
  });

  it("keeps the approved iPhone status-bar content and safe insets", () => {
    expect(IPHONE_STATUS).toEqual({ time: "11:11", batteryLevel: 100, leftInset: 30, rightInset: 24 });
  });

  it("exports exact standard and master dimensions", async () => {
    const outputs = await createPromoExports(desktop, mobile, new URL("https://example.com"), settings);
    await expect(sharp(outputs.jpg).metadata()).resolves.toMatchObject({ width: 1500, height: 812, format: "jpeg" });
    await expect(sharp(outputs.jpg2x).metadata()).resolves.toMatchObject({ width: 3000, height: 1624, format: "jpeg" });
  });
});
