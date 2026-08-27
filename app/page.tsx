"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  ImageUp,
  LockKeyhole,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { GENERATION_STAGES, type JobPublic } from "@/lib/types";

type RecentItem = {
  hostname: string;
  previewUrl: string;
  downloadUrl?: string;
  filename?: string;
  createdAt: number;
};

const defaults = {
  delaySeconds: 2.5,
  desktopScrollY: 0,
  mobileScrollY: 0,
  hideSelector: "",
  backgroundDarkening: 0,
  phoneShadow: 56,
  showAddress: true,
};

const RECENT_TTL_MS = 24 * 60 * 60 * 1000;

function BrandGlobe() {
  return (
    <svg className="url-icon brand-globe" width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="brand-globe-gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F23AFC" />
          <stop offset="0.52" stopColor="#875cff" />
          <stop offset="1" stopColor="#2c8cff" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="url(#brand-globe-gradient)" strokeWidth="1.7" />
      <path d="M3.4 9h17.2M3.4 15h17.2M12 3c2.1 2.45 3.2 5.45 3.2 9S14.1 18.55 12 21c-2.1-2.45-3.2-5.45-3.2-9S9.9 5.45 12 3Z" stroke="url(#brand-globe-gradient)" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function SettingRange({ label, value, min, max, step = 1, suffix = "", onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="range-setting">
      <span>{label}<strong>{value}{suffix}</strong></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [settings, setSettings] = useState(defaults);
  const [job, setJob] = useState<JobPublic | null>(null);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const desktopOverride = useRef<HTMLInputElement>(null);
  const mobileOverride = useRef<HTMLInputElement>(null);

  const isWorking = job?.status === "queued" || job?.status === "running";

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("sterling-promo-recent") || "[]") as RecentItem[];
      const valid = stored.filter((item) => item.hostname && item.previewUrl && item.createdAt && Date.now() - item.createdAt < RECENT_TTL_MS).slice(0, 5);
      setRecent(valid);
      localStorage.setItem("sterling-promo-recent", JSON.stringify(valid));
    } catch {
      setRecent([]);
    }
    const cleanup = window.setInterval(() => {
      setRecent((current) => {
        const valid = current.filter((item) => Date.now() - item.createdAt < RECENT_TTL_MS);
        if (valid.length !== current.length) localStorage.setItem("sterling-promo-recent", JSON.stringify(valid));
        return valid;
      });
    }, 60_000);
    return () => window.clearInterval(cleanup);
  }, []);

  const storeRecent = (completeJob: JobPublic) => {
    if (!completeJob.result) return;
    const item = {
      hostname: completeJob.result.hostname,
      previewUrl: completeJob.result.previewUrl,
      downloadUrl: completeJob.result.downloads.jpg,
      filename: `${completeJob.result.filenameBase}.jpg`,
      createdAt: Date.now(),
    };
    setRecent((current) => {
      const next = [item, ...current.filter((entry) => entry.hostname !== item.hostname)].slice(0, 5);
      localStorage.setItem("sterling-promo-recent", JSON.stringify(next));
      return next;
    });
  };

  const pollJob = async (id: string) => {
    for (;;) {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      const response = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
      const next: JobPublic | { error: string } = await response.json();
      if (!response.ok || !("status" in next)) throw new Error("error" in next ? next.error : "Generation status could not be read.");
      setJob(next);
      if (next.status === "complete") {
        storeRecent(next);
        return;
      }
      if (next.status === "error") throw new Error(next.error || "The website could not be captured.");
    }
  };

  const generate = async (event?: FormEvent) => {
    event?.preventDefault();
    if (isWorking) return;
    setError("");
    setJob(null);
    const form = new FormData();
    form.set("url", url);
    Object.entries(settings).forEach(([key, value]) => form.set(key, String(value)));
    if (desktopOverride.current?.files?.[0]) form.set("desktopOverride", desktopOverride.current.files[0]);
    if (mobileOverride.current?.files?.[0]) form.set("mobileOverride", mobileOverride.current.files[0]);
    try {
      const response = await fetch("/api/generate", { method: "POST", body: form });
      const created: JobPublic | { error: string } = await response.json();
      if (!response.ok || !("status" in created)) throw new Error("error" in created ? created.error : "Generation could not start.");
      setJob(created);
      await pollJob(created.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong while generating the promo.");
    }
  };

  const setSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const removeRecent = (createdAt: number) => {
    setRecent((current) => {
      const next = current.filter((item) => item.createdAt !== createdAt);
      localStorage.setItem("sterling-promo-recent", JSON.stringify(next));
      return next;
    });
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Sterling Creations AI home">
          <i className="energy-dot" aria-hidden="true" />
          <Image className="brand-logo" src="/assets/sterling-creations-ai-logo.png" alt="" width={71} height={70} priority />
          <span>STERLING <b>CREATIONS AI</b></span>
        </a>
        <div className="private-label"><LockKeyhole size={13} /> Private production tool</div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> Mobile presentation system <em>01</em></div>
        <div className="hero-grid">
          <div>
            <h1>
              <span className="title-line">The Desktop + iPhone</span>
              <span className="title-line">Website Capture <b className="hero-accent">HERO!</b></span>
            </h1>
          </div>
          <div className="hero-copy">
            <p>Turn any public homepage into a polished desktop-and-iPhone promotional image, ready to present or publish.</p>
            <div className="output-spec"><i /> 1500 × 812 <span>+</span> 2× master</div>
          </div>
        </div>

        <form className="capture-form" onSubmit={generate}>
          <BrandGlobe />
          <label htmlFor="website-url" className="sr-only">Website URL</label>
          <input
            id="website-url"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="Paste a public website URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={isWorking}
          />
          <button type="submit" disabled={isWorking || !url.trim()}>
            {isWorking ? <RefreshCw className="spin" size={17} /> : <Sparkles size={17} />}
            {isWorking ? "Building composite" : "Generate promo image"}
            {!isWorking && <ArrowRight size={17} />}
          </button>
        </form>

        <button className="advanced-trigger" type="button" onClick={() => setAdvancedOpen((open) => !open)} aria-expanded={advancedOpen}>
          <span><SlidersHorizontal size={15} /> Advanced capture settings</span>
          <ChevronDown size={15} className={advancedOpen ? "rotated" : ""} />
        </button>

        <div className={`advanced-panel ${advancedOpen ? "open" : ""}`}>
          <div className="settings-grid">
            <SettingRange label="Capture delay" value={settings.delaySeconds} min={1} max={12} step={0.5} suffix="s" onChange={(value) => setSetting("delaySeconds", value)} />
            <SettingRange label="Background darkening" value={settings.backgroundDarkening} min={0} max={35} suffix="%" onChange={(value) => setSetting("backgroundDarkening", value)} />
            <SettingRange label="Phone shadow" value={settings.phoneShadow} min={0} max={100} suffix="%" onChange={(value) => setSetting("phoneShadow", value)} />
            <label className="text-setting"><span>Desktop scroll position</span><input type="number" min="0" value={settings.desktopScrollY} onChange={(event) => setSetting("desktopScrollY", Number(event.target.value))} /><em>px</em></label>
            <label className="text-setting"><span>Mobile scroll position</span><input type="number" min="0" value={settings.mobileScrollY} onChange={(event) => setSetting("mobileScrollY", Number(event.target.value))} /><em>px</em></label>
            <label className="text-setting selector"><span>Element to hide <small>optional CSS selector</small></span><input type="text" placeholder=".cookie-banner" value={settings.hideSelector} onChange={(event) => setSetting("hideSelector", event.target.value)} /></label>
          </div>
          <div className="override-row">
            <label className="upload-control"><ImageUp size={17} /><span><strong>Desktop override</strong><small>Upload a screenshot</small></span><input ref={desktopOverride} type="file" accept="image/*" /></label>
            <label className="upload-control"><ImageUp size={17} /><span><strong>Mobile override</strong><small>Upload a screenshot</small></span><input ref={mobileOverride} type="file" accept="image/*" /></label>
            <label className="toggle-control"><span><strong>Website address</strong><small>Show inside phone</small></span><input type="checkbox" checked={settings.showAddress} onChange={(event) => setSetting("showAddress", event.target.checked)} /><i /></label>
          </div>
        </div>
      </section>

      <section className="workspace">
        {(job || error) && (
          <div className={`status-panel ${error ? "error" : ""}`}>
            {error ? (
              <div className="error-message"><CircleAlert size={19} /><div><strong>Capture needs attention</strong><p>{error}</p><small>You can still create the image by uploading desktop and mobile screenshot overrides above.</small></div></div>
            ) : (
              <ol className="stage-list">
                {GENERATION_STAGES.map((stage, index) => {
                  const complete = job?.status === "complete" || index < (job?.stageIndex ?? 0);
                  const active = job?.status !== "complete" && index === job?.stageIndex;
                  return <li key={stage} className={complete ? "complete" : active ? "active" : ""}><span>{complete ? <Check size={12} /> : index + 1}</span><em>{stage}</em></li>;
                })}
              </ol>
            )}
          </div>
        )}

        <div className={`preview-shell ${job?.status === "complete" ? "has-output" : ""}`}>
          <div className="preview-ratio">
            {job?.result ? (
              // Regular img intentionally reflects the short-lived generated file rather than using Next image optimization.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.result.previewUrl} alt={`Desktop and iPhone promotional composite for ${job.result.hostname}`} />
            ) : (
              <div className="empty-preview">
                <div className="empty-grid" />
                <div className="ghost-desktop"><span>DESKTOP CAPTURE</span></div>
                <div className="ghost-phone"><i /><b /></div>
                <p>Your finished welcome-page composite will appear here.</p>
              </div>
            )}
          </div>
          <div className="preview-meta">
            <span>{job?.result ? job.result.filenameBase : "website-mobile-friendly-promo"}</span>
            <em>Fixed composition · iPhone 16 Pro Max · Space Gray</em>
          </div>
        </div>

        {job?.result && (
          <div className="result-actions">
            <button className="recapture" type="button" onClick={() => generate()}><RefreshCw size={16} /> Recapture website</button>
            <div className="download-group">
              <a href={job.result.downloads.jpg}><ArrowDownToLine size={16} /> JPG <span>1500 × 812</span></a>
              <a href={job.result.downloads.jpg2x}><ArrowDownToLine size={16} /> JPG <span>3000 × 1624</span></a>
            </div>
          </div>
        )}
      </section>

      <section className="recent-section">
        <div className="section-label"><span>Recent generations</span><em>Stored in this browser</em></div>
        <div className="recent-strip">
          {recent.length ? recent.map((item) => (
            <article className="recent-card" key={`${item.hostname}-${item.createdAt}`}>
              <button className="recent-main" onClick={() => setUrl(`https://${item.hostname}`)} aria-label={`Use ${item.hostname} again`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewUrl} alt="" />
                <span>{item.hostname.replace(/^www\./, "")}</span>
              </button>
              <div className="recent-actions">
                <a
                  href={item.downloadUrl || item.previewUrl.replace("?preview=1", "")}
                  download={item.filename || `${item.hostname.replace(/^www\./, "")}-mobile-friendly-promo.jpg`}
                  aria-label={`Download ${item.hostname} at 1500 pixels wide`}
                  title="Download 1500 × 812 JPG"
                >
                  <ArrowDownToLine size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => removeRecent(item.createdAt)}
                  aria-label={`Delete ${item.hostname} from recent generations`}
                  title="Delete from recent generations"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          )) : <p>No generations yet. Your latest five will be kept here.</p>}
        </div>
      </section>

      <footer>
        <span>
          Brought to you by ©{new Date().getFullYear()}{" "}
          <a href="https://sterlingcreations.ai" target="_blank" rel="noopener noreferrer">STERLING CREATIONS Ai</a>
        </span>
        <em>Private production tool · Thumbnails and exports expire after 24 hours</em>
      </footer>
    </main>
  );
}
