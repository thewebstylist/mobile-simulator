import { NextRequest, NextResponse } from "next/server";
import { corsPreflight, withCors } from "@/lib/cors";
import { createJob, publicJob, startJob } from "@/lib/jobs";
import { checkRateLimit } from "@/lib/rate-limit";
import { assertPublicUrl, normalizePublicUrl } from "@/lib/security";
import type { CaptureSettings } from "@/lib/types";

export const runtime = "nodejs";

const json = (request: Request, body: object, init?: ResponseInit) => withCors(request, NextResponse.json(body, init));

const numberField = (form: FormData, name: string, fallback: number, min: number, max: number) => {
  const value = Number(form.get(name));
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
};

async function optionalImage(form: FormData, name: string) {
  const entry = form.get(name);
  if (!(entry instanceof File) || entry.size === 0) return undefined;
  if (!entry.type.startsWith("image/")) throw new Error(`${name === "desktopOverride" ? "Desktop" : "Mobile"} override must be an image.`);
  if (entry.size > 12 * 1024 * 1024) throw new Error("Each uploaded screenshot must be smaller than 12 MB.");
  return Buffer.from(await entry.arrayBuffer());
}

export async function POST(request: NextRequest) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!checkRateLimit(client)) return json(request, { error: "Generation limit reached. Try again in a few minutes." }, { status: 429 });
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 25 * 1024 * 1024) {
      return json(request, { error: "The generation request is too large. Upload screenshots smaller than 12 MB each." }, { status: 413 });
    }
    const form = await request.formData();
    const url = normalizePublicUrl(String(form.get("url") ?? ""));
    await assertPublicUrl(url);
    const settings: CaptureSettings = {
      delaySeconds: numberField(form, "delaySeconds", 2.5, 1, 12),
      desktopScrollY: numberField(form, "desktopScrollY", 0, 0, 100_000),
      mobileScrollY: numberField(form, "mobileScrollY", 0, 0, 100_000),
      hideSelector: String(form.get("hideSelector") ?? "").trim().slice(0, 300),
      backgroundDarkening: numberField(form, "backgroundDarkening", 0, 0, 35),
      phoneShadow: numberField(form, "phoneShadow", 56, 0, 100),
      showAddress: form.get("showAddress") !== "false",
    };
    const overrides = {
      desktop: await optionalImage(form, "desktopOverride"),
      mobile: await optionalImage(form, "mobileOverride"),
    };
    const job = createJob();
    startJob(job, url, settings, overrides);
    return json(request, publicJob(job), { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The generation request was invalid.";
    return json(request, { error: message }, { status: 400 });
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}
