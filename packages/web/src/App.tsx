import { useCallback, useMemo, useRef, useState } from "react";
import {
  Gauge,
  SlidersHorizontal,
  RefreshCw,
  Download,
  MonitorDown,
} from "lucide-react";

function GitHubMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}
import { PRESETS, getPreset, DEFAULT_PRESET_ID } from "@audio-normalizer/core";
import { processFile, type ProcessResult } from "./lib/processor";
import type { BitDepth } from "./audio/encodeWav";
import { Dropzone } from "./components/Dropzone";
import { FileRow, type FileItem } from "./components/FileRow";
import { Select } from "./components/Select";
import { CopyCommand } from "./components/CopyCommand";
import { DocsView } from "./components/DocsView";
import { usePwaInstall } from "./hooks/usePwaInstall";

const GITHUB_URL = "https://github.com/Riyoway/audio-normalizer";

const BIT_DEPTH_OPTIONS = [
  { value: "16", label: "16-bit PCM · smaller" },
  { value: "24", label: "24-bit PCM · recommended" },
  { value: "32", label: "32-bit float · lossless" },
];

let idCounter = 0;

export function App() {
  const [view, setView] = useState<"app" | "docs">("app");
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [bitDepth, setBitDepth] = useState<BitDepth>(24);
  const [items, setItems] = useState<FileItem[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const preset = useMemo(() => getPreset(presetId)!, [presetId]);
  const { canInstall, promptInstall } = usePwaInstall();

  const readout =
    preset.method === "peak"
      ? { value: (preset.targetPeakDb ?? -1).toFixed(0), unit: "dB PEAK" }
      : { value: (preset.targetLufs ?? -14).toFixed(0), unit: "LUFS" };

  const update = useCallback((id: number, patch: Partial<FileItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const runOne = useCallback(
    async (item: FileItem, p = preset, bd = bitDepth) => {
      update(item.id, { status: "processing", error: undefined });
      try {
        const result: ProcessResult = await processFile(item.file, p, bd);
        update(item.id, { status: "done", result });
      } catch (e) {
        update(item.id, { status: "error", error: (e as Error).message });
      }
    },
    [preset, bitDepth, update],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const audio = files.filter(
        (f) =>
          f.type.startsWith("audio/") ||
          /\.(wav|mp3|flac|m4a|aac|ogg|opus|aiff)$/i.test(f.name),
      );
      const newItems: FileItem[] = audio.map((file) => ({
        id: ++idCounter,
        file,
        status: "pending",
      }));
      setItems((prev) => [...prev, ...newItems]);
      (async () => {
        for (const it of newItems) await runOne(it);
      })();
    },
    [runOne],
  );

  const reprocessAll = useCallback(() => {
    (async () => {
      for (const it of itemsRef.current) await runOne(it, preset, bitDepth);
    })();
  }, [preset, bitDepth, runOne]);

  const downloadOne = (item: FileItem) => {
    if (!item.result) return;
    const url = URL.createObjectURL(item.result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.result.outputName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadAll = () => {
    items
      .filter((it) => it.status === "done")
      .forEach((it, i) => setTimeout(() => downloadOne(it), i * 150));
  };

  const doneCount = items.filter((it) => it.status === "done").length;

  return (
    <div className="app">
      <header className="app-bar">
        <button
          className="app-bar-brand"
          onClick={() => {
            setView("app");
            window.scrollTo({ top: 0 });
          }}
        >
          <img src="/icon-192.png" alt="" className="app-bar-logo" />
          <span className="app-bar-title">
            Audio<b>Norm</b>
          </span>
        </button>
        <nav className="app-bar-nav">
          <button
            className={`nav-link${view === "docs" ? " active" : ""}`}
            onClick={() => {
              setView(view === "docs" ? "app" : "docs");
              window.scrollTo({ top: 0 });
            }}
          >
            Docs
          </button>
          <a className="icon-link" href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub">
            <GitHubMark size={18} />
          </a>
          {canInstall && (
            <button className="btn-install" onClick={promptInstall}>
              <MonitorDown size={16} />
              <span className="btn-install-label">Install</span>
            </button>
          )}
        </nav>
      </header>

      {view === "docs" ? (
        <DocsView onBack={() => setView("app")} />
      ) : (
       <>
      <main className="app-main">
        <section className="hero">
          <span className="eyebrow">Loudness Normalizer · EBU R128</span>
          <h1>
            Make every clip sit at the <em>right volume.</em>
          </h1>
          <p className="hero-sub">
            Free sound effects and UI clicks often blast out at full scale. Drop them
            in, pick a target, and download audio that's measured to a consistent,
            broadcast-grade loudness — entirely in your browser.
          </p>

          <div className="meter" aria-hidden="true">
            <div className="meter-top">
              <span className="eyebrow">Target</span>
              <span className="meter-readout">
                {readout.value}
                <small>{readout.unit}</small>
              </span>
            </div>
            <div className="meter-track">
              <span className="meter-needle" />
            </div>
            <div className="meter-scale">
              <span>−30</span>
              <span>−23</span>
              <span>−16</span>
              <span className="tgt">−14</span>
              <span>−9</span>
              <span>0</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <span className="panel-index">01</span>
            <span className="panel-title">Target</span>
            <span className="panel-note">how loud &amp; what format</span>
          </div>
          <div className="controls">
            <div className="control">
              <label htmlFor="preset">
                <Gauge size={14} />
                Target loudness
              </label>
              <Select
                id="preset"
                ariaLabel="Target loudness"
                value={presetId}
                options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
                onChange={setPresetId}
              />
              <p className="hint">{preset.description}</p>
            </div>
            <div className="control">
              <label htmlFor="bitdepth">
                <SlidersHorizontal size={14} />
                Output format
              </label>
              <Select
                id="bitdepth"
                ariaLabel="Output bit depth"
                value={String(bitDepth)}
                options={BIT_DEPTH_OPTIONS}
                onChange={(v) => setBitDepth(Number(v) as BitDepth)}
              />
              <p className="hint">Lossless WAV. Gain-only — no quality loss.</p>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <span className="panel-index">02</span>
            <span className="panel-title">Source</span>
            <span className="panel-note">nothing is uploaded</span>
          </div>
          <Dropzone onFiles={addFiles} />
        </section>

        {items.length > 0 && (
          <section className="panel">
            <div className="panel-head results-head">
              <span className="panel-index">03</span>
              <span className="panel-title">Output</span>
              <span className="results-count">
                {doneCount}/{items.length} ready
              </span>
              <div className="results-actions">
                <button onClick={reprocessAll} className="btn-secondary">
                  <RefreshCw size={15} />
                  Re-apply
                </button>
                <button
                  onClick={downloadAll}
                  className="btn-primary"
                  disabled={doneCount === 0}
                >
                  <Download size={15} />
                  Download all
                </button>
              </div>
            </div>
            <div className="file-list">
              {items.map((item) => (
                <FileRow key={item.id} item={item} onDownload={downloadOne} />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            Also a CLI — bundles ffmpeg, no install
          </p>
          <CopyCommand command="npx audio-normalizer track.wav" />
          <CopyCommand command="npx audio-normalizer ./sounds -p sfx" />
        </div>
      </footer>
       </>
      )}

      <div className="grain" />
    </div>
  );
}
