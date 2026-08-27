/**
 * The one authoritative geometry source for every output size.
 * Values are normalized to the 1500 × 812 standard canvas from Sterling's reference.
 */
export const PROMO_LAYOUT = Object.freeze({
  canvas: { width: 1500, height: 812 },
  master: { width: 3000, height: 1624 },
  phone: { x: 1134, y: 111, width: 334, height: 701 },
  screen: { x: 12, y: 12, width: 310, height: 677, radius: 47 },
  statusBarHeight: 42,
  browserToolbarHeight: 68,
});

export function scaledLayout(scale: 1 | 2) {
  const multiply = <T extends Record<string, number>>(object: T) =>
    Object.fromEntries(Object.entries(object).map(([key, value]) => [key, value * scale])) as T;

  return {
    canvas: multiply(PROMO_LAYOUT.canvas),
    phone: multiply(PROMO_LAYOUT.phone),
    screen: multiply(PROMO_LAYOUT.screen),
    statusBarHeight: PROMO_LAYOUT.statusBarHeight * scale,
    browserToolbarHeight: PROMO_LAYOUT.browserToolbarHeight * scale,
  };
}
