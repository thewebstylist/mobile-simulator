import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { corsPreflight, withCors } from "@/lib/cors";
import { getJob } from "@/lib/jobs";
import type { ExportVariant } from "@/lib/types";

export const runtime = "nodejs";

const variants = new Set<ExportVariant>(["jpg", "jpg2x"]);

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; variant: string }> }) {
  const { id, variant: rawVariant } = await context.params;
  if (!variants.has(rawVariant as ExportVariant)) return withCors(request, NextResponse.json({ error: "Unknown export format." }, { status: 404 }));
  const variant = rawVariant as ExportVariant;
  const job = getJob(id);
  if (!job?.directory || !job.result || job.status !== "complete") return withCors(request, NextResponse.json({ error: "This export is not ready." }, { status: 404 }));
  try {
    const buffer = await readFile(join(job.directory, variant));
    const isHighResolution = variant.endsWith("2x");
    const filename = `${job.result.filenameBase}${isHighResolution ? "-3000x1624" : ""}.jpg`;
    const preview = request.nextUrl.searchParams.get("preview") === "1";
    return withCors(request, new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    }));
  } catch {
    return withCors(request, NextResponse.json({ error: "The export has expired." }, { status: 410 }));
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}
