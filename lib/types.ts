export const GENERATION_STAGES = [
  "Opening website",
  "Loading desktop homepage",
  "Capturing desktop view",
  "Loading mobile homepage",
  "Capturing mobile view",
  "Creating device composite",
  "Preparing download",
] as const;

export type GenerationStage = (typeof GENERATION_STAGES)[number];

export type CaptureSettings = {
  delaySeconds: number;
  desktopScrollY: number;
  mobileScrollY: number;
  hideSelector: string;
  backgroundDarkening: number;
  phoneShadow: number;
  showAddress: boolean;
};

export type ExportVariant = "jpg" | "jpg2x";

export type GenerationResult = {
  hostname: string;
  filenameBase: string;
  previewUrl: string;
  downloads: Record<ExportVariant, string>;
};

export type JobPublic = {
  id: string;
  status: "queued" | "running" | "complete" | "error";
  stage: GenerationStage;
  stageIndex: number;
  error?: string;
  result?: GenerationResult;
};
