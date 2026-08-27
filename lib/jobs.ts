import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { captureWebsite } from "./capture";
import { createPromoExports } from "./compositor";
import { safeFilename } from "./security";
import { friendlyCaptureError } from "./errors";
import { GENERATION_STAGES, type CaptureSettings, type ExportVariant, type GenerationStage, type JobPublic } from "./types";

type StoredJob = JobPublic & {
  createdAt: number;
  directory?: string;
};

const jobs = new Map<string, StoredJob>();
const JOB_TTL_MS = 24 * 60 * 60 * 1000;

export function createJob() {
  const id = randomUUID();
  const job: StoredJob = {
    id,
    status: "queued",
    stage: GENERATION_STAGES[0],
    stageIndex: 0,
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string) {
  return jobs.get(id);
}

export function publicJob(job: StoredJob): JobPublic {
  return {
    id: job.id,
    status: job.status,
    stage: job.stage,
    stageIndex: job.stageIndex,
    error: job.error,
    result: job.result,
  };
}

function updateStage(job: StoredJob, stage: GenerationStage) {
  job.status = "running";
  job.stage = stage;
  job.stageIndex = GENERATION_STAGES.indexOf(stage);
}

export function startJob(
  job: StoredJob,
  url: URL,
  settings: CaptureSettings,
  overrides: { desktop?: Buffer; mobile?: Buffer },
) {
  void (async () => {
    try {
      const captures = await captureWebsite(url, settings, overrides, (stage) => updateStage(job, stage));
      updateStage(job, "Creating device composite");
      const exports = await createPromoExports(captures.desktop, captures.mobile, url, settings);
      updateStage(job, "Preparing download");
      const directory = join(tmpdir(), "sterling-promo-builder", job.id);
      await mkdir(directory, { recursive: true });
      const filenameBase = safeFilename(url.hostname);
      await Promise.all(
        (Object.entries(exports) as [ExportVariant, Buffer][]).map(([variant, buffer]) => writeFile(join(directory, variant), buffer)),
      );
      job.directory = directory;
      job.result = {
        hostname: url.hostname,
        filenameBase,
        previewUrl: `/api/jobs/${job.id}/download/jpg?preview=1`,
        downloads: {
          jpg: `/api/jobs/${job.id}/download/jpg`,
          jpg2x: `/api/jobs/${job.id}/download/jpg2x`,
        },
      };
      job.status = "complete";
      const cleanupTimer = setTimeout(async () => {
        jobs.delete(job.id);
        await rm(directory, { recursive: true, force: true }).catch(() => undefined);
      }, JOB_TTL_MS);
      cleanupTimer.unref();
    } catch (error) {
      console.error(`[promo-builder:${job.id}] capture failed`, error);
      job.status = "error";
      job.error = friendlyCaptureError(error);
    }
  })();
}
