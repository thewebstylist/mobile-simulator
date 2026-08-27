import { NextResponse } from "next/server";
import { corsPreflight, withCors } from "@/lib/cors";
import { getJob, publicJob } from "@/lib/jobs";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = getJob(id);
  if (!job) return withCors(request, NextResponse.json({ error: "This generation has expired or does not exist." }, { status: 404 }));
  return withCors(request, NextResponse.json(publicJob(job), { headers: { "Cache-Control": "no-store" } }));
}

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}
