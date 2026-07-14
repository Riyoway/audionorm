import { useCallback, useMemo, useRef, useState } from "react";
import {
  Gauge,
  SlidersHorizontal,
  RefreshCw,
  Download,
  MonitorDown,
  ShieldCheck,
  CloudOff,
  Zap,
  ArrowUpRight,
  Trash2,
  Upload,
} from "lucide-react";
import {
  getPreset,
  DEFAULT_PRESET_ID,
  presetsByCategory,
  type Preset,
} from "@audio-normalizer/core";
import { processFile, type ProcessResult } from "./lib/processor";
import type { BitDepth } from "./audio/encodeWav";
import { Dropzone } from "./components/Dropzone";
import { FileRow, type FileItem } from "./components/FileRow";
import { Select } from "./components/Select";
import { CopyCommand } from "./components/CopyCommand";
import { DocsView } from "./components/DocsView";
import { LanguageMenu } from "./components/LanguageMenu";
import { ServiceMarquee } from "./components/ServiceMarquee";
import { FaqSection } from "./components/FaqSection";
import SoftAurora from "./components/SoftAurora";
import { iconUrlForService } from "./lib/serviceIcons";
import { usePwaInstall } from "./hooks/usePwaInstall";
import { useI18n } from "./i18n";

function GitHubMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}

const GITHUB_URL = "https://github.com/Riyoway/audionorm";

let idCounter = 0;

export function App() {
  const { t, lang } = useI18n();
  const [view, setView] = useState<"app" | "docs">("app");
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  // Kept as a string so an empty / partial ("-") field never coerces to 0.
  const [customLufs, setCustomLufs] = useState<string>("-14");
  const [bitDepth, setBitDepth] = useState<BitDepth>(24);
  const [items, setItems] = useState<FileItem[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const heroInputRef = useRef<HTMLInputElement>(null);
  // Skip the animated WebGL backdrop when the user prefers reduced motion.
  const [showAurora] = useState(
    () =>
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // The active preset. "custom" builds a LUFS preset from the entered value.
  const preset = useMemo<Preset>(() => {
    if (presetId === "custom") {
      // Empty, "-", positive or absurd values fall back / clamp to a sane target.
      const parsed = parseFloat(customLufs);
      const v = Number.isFinite(parsed) && parsed < 0 ? Math.max(-60, parsed) : -14;
      return {
        id: "custom",
        label: `Custom (${v} LUFS)`,
        description: "",
        method: "lufs",
        targetLufs: v,
        truePeak: -1,
        category: "Custom",
      };
    }
    return getPreset(presetId) ?? getPreset(DEFAULT_PRESET_ID)!;
  }, [presetId, customLufs]);

  const { canInstall, promptInstall } = usePwaInstall();
  const year = new Date().getFullYear();

  const bitDepthOptions = [
    { value: "16", label: t("fmt.16") },
    { value: "24", label: t("fmt.24") },
    { value: "32", label: t("fmt.32") },
  ];

  // Grouped, searchable target list: general presets + per-service targets.
  const targetOptions = useMemo(() => {
    const opts: { value: string; label: string; group: string; icon?: string }[] = [];
    for (const { category, presets } of presetsByCategory()) {
      const group = t(`cat.${category}`, undefined, category);
      for (const p of presets) {
        opts.push({
          value: p.id,
          label: t(`preset.${p.id}.label`, undefined, p.label),
          group,
          icon: iconUrlForService(p.id),
        });
      }
    }
    opts.push({ value: "custom", label: t("target.custom"), group: t("cat.Custom", undefined, "Custom") });
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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

  const removeItem = useCallback(
    (id: number) => setItems((prev) => prev.filter((it) => it.id !== id)),
    [],
  );

  const clearAll = useCallback(() => setItems([]), []);

  const doneCount = items.filter((it) => it.status === "done").length;

  const goto = (v: "app" | "docs") => {
    setView(v);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="app">
      <header className="app-bar">
        <button className="app-bar-brand" onClick={() => goto("app")}>
          <img src="/icon-192.png" alt="" className="app-bar-logo" />
          <span className="app-bar-title">
            Audio<b>Norm</b>
          </span>
        </button>
        <nav className="app-bar-nav">
          <button
            className={`nav-link${view === "docs" ? " active" : ""}`}
            onClick={() => goto(view === "docs" ? "app" : "docs")}
          >
            {t("nav.docs")}
          </button>
          <LanguageMenu />
          <a className="icon-link" href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub">
            <GitHubMark size={18} />
          </a>
          {canInstall && (
            <button className="btn-install" onClick={promptInstall}>
              <MonitorDown size={16} />
              <span className="btn-install-label">{t("btn.install")}</span>
            </button>
          )}
        </nav>
      </header>

      {view === "docs" ? (
        <DocsView onBack={() => goto("app")} />
      ) : (
        <main className="app-main">
          <section className="hero">
            {showAurora && (
              <div className="hero-aurora" aria-hidden="true">
                <SoftAurora
                  color1="#eef0fa"
                  color2="#3d9bff"
                  brightness={0.75}
                  speed={0.5}
                  scale={1.4}
                  bandHeight={0.5}
                  bandSpread={0.95}
                  colorSpeed={0.7}
                  enableMouseInteraction={false}
                />
              </div>
            )}
            <h1>{t("hero.title")}</h1>
            <p className="hero-sub">{t("hero.sub")}</p>
            <div className="hero-cta">
              <button
                className="btn-primary btn-lg"
                onClick={() => heroInputRef.current?.click()}
              >
                <Upload size={17} />
                {t("cta.choose")}
              </button>
              <span className="hero-cta-hint">{t("cta.hint")}</span>
            </div>
            <input
              ref={heroInputRef}
              type="file"
              accept="audio/*,.wav,.mp3,.flac,.m4a,.aac,.ogg,.opus,.aiff"
              multiple
              hidden
              onChange={(e) => {
                const fs = Array.from(e.target.files ?? []);
                if (fs.length) {
                  addFiles(fs);
                  document
                    .getElementById("tool")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                e.target.value = "";
              }}
            />
          </section>

          <section className="proof" aria-label="Supported services">
            <p className="proof-label">
              {t("proof.pre")} <b>{t("proof.count")}</b> {t("proof.suffix")}
            </p>
            <ServiceMarquee />
            <p className="proof-disclaimer">{t("proof.disclaimer")}</p>
          </section>

          <section className="panel" id="tool">
            <div className="panel-head">
              <span className="panel-index">1</span>
              <span className="panel-title">{t("panel.source.title")}</span>
              <span className="panel-note">{t("panel.source.note")}</span>
            </div>
            <Dropzone onFiles={addFiles} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <span className="panel-index">2</span>
              <span className="panel-title">{t("panel.target.title")}</span>
              <span className="panel-note">{t("panel.target.note")}</span>
            </div>
            <div className="controls">
              <div className="control">
                <label htmlFor="preset">
                  <Gauge size={14} />
                  {t("control.loudness")}
                </label>
                <div className="target-row">
                  <Select
                    id="preset"
                    ariaLabel={t("control.loudness")}
                    value={presetId}
                    options={targetOptions}
                    onChange={setPresetId}
                    searchable
                  />
                  {presetId === "custom" && (
                    <input
                      className="text-input"
                      type="number"
                      min={-40}
                      max={0}
                      step={0.5}
                      value={customLufs}
                      aria-label={t("target.customAria")}
                      placeholder={t("target.customPlaceholder")}
                      onChange={(e) => setCustomLufs(e.target.value)}
                    />
                  )}
                </div>
                <p className="hint">
                  {presetId === "custom"
                    ? t("hint.custom")
                    : t(`preset.${preset.id}.desc`, undefined, preset.description)}
                  {preset.sourceUrl && (
                    <>
                      {" · "}
                      <a
                        className="hint-src"
                        href={preset.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("word.source")} ↗
                      </a>
                    </>
                  )}
                </p>
              </div>
              <div className="control">
                <label htmlFor="bitdepth">
                  <SlidersHorizontal size={14} />
                  {t("control.format")}
                </label>
                <Select
                  id="bitdepth"
                  ariaLabel={t("control.format")}
                  value={String(bitDepth)}
                  options={bitDepthOptions}
                  onChange={(v) => setBitDepth(Number(v) as BitDepth)}
                />
                <p className="hint">{t("hint.format")}</p>
              </div>
            </div>
          </section>

          {items.length > 0 && (
            <section className="panel">
              <div className="panel-head results-head">
                <span className="panel-index">3</span>
                <span className="panel-title">{t("panel.output.title")}</span>
                <span className="results-count">
                  {t("output.ready", { done: doneCount, total: items.length })}
                </span>
                <div className="results-actions">
                  <button onClick={clearAll} className="btn-ghost">
                    <Trash2 size={15} />
                    {t("btn.clear")}
                  </button>
                  <button onClick={reprocessAll} className="btn-secondary">
                    <RefreshCw size={15} />
                    {t("btn.reapply")}
                  </button>
                  <button
                    onClick={downloadAll}
                    className="btn-primary"
                    disabled={doneCount === 0}
                  >
                    <Download size={15} />
                    {t("btn.downloadAll")}
                  </button>
                </div>
              </div>
              <div className="file-list">
                {items.map((item) => (
                  <FileRow
                    key={item.id}
                    item={item}
                    onDownload={downloadOne}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </section>
          )}

          <FaqSection />
        </main>
      )}

      <footer className="site-footer">
        <div className="site-footer-inner footer-grid">
          <div className="footer-brand">
            <div className="footer-brand-row">
              <img src="/icon-192.png" alt="" className="footer-logo" />
              <span className="footer-name">
                Audio<b>Norm</b>
              </span>
            </div>
            <p className="footer-tag">{t("footer.tag")}</p>
            <div className="footer-chips">
              <span>
                <ShieldCheck size={13} /> {t("footer.chip.noupload")}
              </span>
              <span>
                <CloudOff size={13} /> {t("footer.chip.offline")}
              </span>
              <span>
                <Zap size={13} /> {t("footer.chip.free")}
              </span>
            </div>
          </div>

          <nav className="footer-col">
            <h4>{t("footer.col.app")}</h4>
            <button className="footer-link" onClick={() => goto("app")}>
              {t("footer.link.normalizer")}
            </button>
            <button className="footer-link" onClick={() => goto("docs")}>
              {t("nav.docs")}
            </button>
            {canInstall && (
              <button className="footer-link" onClick={promptInstall}>
                {t("footer.link.install")}
              </button>
            )}
          </nav>

          <nav className="footer-col">
            <h4>{t("footer.col.code")}</h4>
            <a className="footer-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight size={13} />
            </a>
            <a
              className="footer-link"
              href={`${GITHUB_URL}/issues`}
              target="_blank"
              rel="noreferrer"
            >
              Issues <ArrowUpRight size={13} />
            </a>
            <a
              className="footer-link"
              href="https://www.npmjs.com/package/audionorm"
              target="_blank"
              rel="noreferrer"
            >
              npm <ArrowUpRight size={13} />
            </a>
          </nav>

          <div className="footer-col footer-cli">
            <h4>{t("footer.col.cli")}</h4>
            <CopyCommand command="npx audionorm track.wav" />
            <CopyCommand command="npx audionorm ./sounds -p sfx" />
          </div>
        </div>

        <div className="site-footer-inner footer-bottom">
          <span>{t("footer.license", { year })}</span>
          <span className="mono footer-tech">ITU-R BS.1770 · EBU R128 · ffmpeg</span>
        </div>
      </footer>
    </div>
  );
}
