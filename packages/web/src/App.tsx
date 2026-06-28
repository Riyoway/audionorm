import { useCallback, useMemo, useRef, useState } from "react";
import {
  ShieldCheck,
  Gauge,
  SlidersHorizontal,
  RefreshCw,
  Download,
  MonitorDown,
  CloudOff,
} from "lucide-react";
import { PRESETS, getPreset, DEFAULT_PRESET_ID } from "@audio-normalizer/core";
import { processFile, type ProcessResult } from "./lib/processor";
import type { BitDepth } from "./audio/encodeWav";
import { Dropzone } from "./components/Dropzone";
import { FileRow, type FileItem } from "./components/FileRow";
import { Select } from "./components/Select";
import { usePwaInstall } from "./hooks/usePwaInstall";

const BIT_DEPTH_OPTIONS = [
  { value: "16", label: "16-bit PCM (smaller)" },
  { value: "24", label: "24-bit PCM (recommended)" },
  { value: "32", label: "32-bit float (lossless)" },
];

let idCounter = 0;

export function App() {
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [bitDepth, setBitDepth] = useState<BitDepth>(24);
  const [items, setItems] = useState<FileItem[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const preset = useMemo(() => getPreset(presetId)!, [presetId]);
  const { canInstall, promptInstall } = usePwaInstall();

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
        (f) => f.type.startsWith("audio/") || /\.(wav|mp3|flac|m4a|aac|ogg|opus|aiff)$/i.test(f.name),
      );
      const newItems: FileItem[] = audio.map((file) => ({
        id: ++idCounter,
        file,
        status: "pending",
      }));
      setItems((prev) => [...prev, ...newItems]);
      // Process sequentially to keep the UI responsive on large batches.
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
    items.filter((it) => it.status === "done").forEach((it, i) => {
      setTimeout(() => downloadOne(it), i * 150);
    });
  };

  const doneCount = items.filter((it) => it.status === "done").length;

  return (
    <div className={`app${items.length > 0 ? " has-action-bar" : ""}`}>
      <header className="app-bar">
        <div className="app-bar-brand">
          <img src="/icon-192.png" alt="" className="app-bar-logo" />
          <span className="app-bar-title">Audio Normalizer</span>
        </div>
        {canInstall && (
          <button className="btn-install" onClick={promptInstall}>
            <MonitorDown size={16} />
            <span className="btn-install-label">Install</span>
          </button>
        )}
      </header>

      <main className="app-main">
        <section className="hero">
          <p className="tagline">
            Bring every clip to a consistent, optimal volume. Great for taming
            too-loud free sound effects and UI/button sounds.
          </p>
          <div className="header-badges">
            <span className="privacy">
              <ShieldCheck size={15} />
              Nothing is uploaded
            </span>
            <span className="badge-offline">
              <CloudOff size={15} />
              Works offline
            </span>
          </div>
        </section>

      <section className="controls">
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
            Output (WAV)
          </label>
          <Select
            id="bitdepth"
            ariaLabel="Output bit depth"
            value={String(bitDepth)}
            options={BIT_DEPTH_OPTIONS}
            onChange={(v) => setBitDepth(Number(v) as BitDepth)}
          />
          <p className="hint">Lossless WAV keeps quality. Gain-only processing.</p>
        </div>
      </section>

      <Dropzone onFiles={addFiles} />

      {items.length > 0 && (
        <section className="results">
          <div className="results-bar">
            <span>
              {doneCount}/{items.length} processed
            </span>
          </div>
          <div className="file-list">
            {items.map((item) => (
              <FileRow key={item.id} item={item} onDownload={downloadOne} />
            ))}
          </div>
        </section>
      )}

        <footer className="footer">
          <p>
            Also available as a CLI: <code>npx audio-normalizer ./sounds -p sfx</code>
          </p>
        </footer>
      </main>

      {items.length > 0 && (
        <div className="action-bar">
          <button onClick={reprocessAll} className="btn-secondary">
            <RefreshCw size={15} />
            Re-apply
          </button>
          <button onClick={downloadAll} className="btn-primary" disabled={doneCount === 0}>
            <Download size={15} />
            Download all ({doneCount})
          </button>
        </div>
      )}
    </div>
  );
}
