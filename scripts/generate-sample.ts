import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { captureWebsite } from "../lib/capture";
import { createPromoExports } from "../lib/compositor";

process.env.ENABLE_LOCAL_CAPTURE_FOR_TESTS = "true";

const url = new URL(process.env.SAMPLE_URL || "http://127.0.0.1:3000/capture-fixture");
const settings = {
  delaySeconds: 1,
  desktopScrollY: 0,
  mobileScrollY: 0,
  hideSelector: "",
  backgroundDarkening: 0,
  phoneShadow: 56,
  showAddress: true,
};

const captures = await captureWebsite(url, settings, {}, (stage) => process.stdout.write(`${stage}\n`));
const outputs = await createPromoExports(captures.desktop, captures.mobile, url, settings);
const target = resolve("public");
await mkdir(target, { recursive: true });
await Promise.all([
  writeFile(resolve(target, "sample-output.jpg"), outputs.jpg),
]);
process.stdout.write(`Sample written to ${resolve(target, "sample-output.jpg")}\n`);
