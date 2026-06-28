import { ArrowLeft } from "lucide-react";
import { PRESETS } from "@audio-normalizer/core";
import { CopyCommand } from "./CopyCommand";

interface Props {
  onBack: () => void;
}

const OPTIONS: { flag: string; desc: string }[] = [
  { flag: "-p, --preset <id>", desc: "Loudness preset (default: streaming)" },
  { flag: "--target <LUFS>", desc: "Override the target loudness for LUFS presets" },
  { flag: "--peak <dB>", desc: "Override the target peak for peak presets" },
  { flag: "-o, --out <dir>", desc: "Output directory (default: alongside each input)" },
  { flag: "--suffix <str>", desc: 'Filename suffix for outputs (default: "-normalized")' },
  { flag: "-f, --format <ext>", desc: "Output format: wav, mp3, flac, m4a, ogg (default: keep input)" },
  { flag: "--analyze", desc: "Only measure and report — don't write files" },
  { flag: "--list-presets", desc: "List the available presets and exit" },
  { flag: "-h, --help", desc: "Show help" },
];

function presetTarget(p: (typeof PRESETS)[number]): string {
  return p.method === "peak" ? `${p.targetPeakDb} dB peak` : `${p.targetLufs} LUFS`;
}

export function DocsView({ onBack }: Props) {
  return (
    <main className="app-main docs">
      <button className="btn-ghost docs-back" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to app
      </button>

      <header className="docs-hero">
        <span className="eyebrow">Documentation</span>
        <h1>Command-line usage</h1>
        <p className="hero-sub">
          The same loudness engine as the web app, for the terminal. It bundles its
          own <code className="ic">ffmpeg</code>, so there's nothing to install — run it
          straight from <code className="ic">npx</code>.
        </p>
      </header>

      <section className="doc-section">
        <h2 className="doc-h">
          <span className="doc-h-i">$</span> Quick start
        </h2>
        <CopyCommand command="npx audio-normalizer track.wav" />
        <p className="doc-p">
          Normalizes <code className="ic">track.wav</code> to −14 LUFS and writes
          <code className="ic">track-normalized.wav</code> next to it.
        </p>
      </section>

      <section className="doc-section">
        <h2 className="doc-h">
          <span className="doc-h-i">#</span> Presets
        </h2>
        <div className="doc-table">
          <div className="doc-tr doc-th">
            <span>Preset</span>
            <span>Target</span>
            <span>Best for</span>
          </div>
          {PRESETS.map((p) => (
            <div className="doc-tr" key={p.id}>
              <span className="mono doc-id">{p.id}</span>
              <span className="mono doc-target">{presetTarget(p)}</span>
              <span className="doc-use">{p.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="doc-section">
        <h2 className="doc-h">
          <span className="doc-h-i">⚙</span> Options
        </h2>
        <dl className="opt-list">
          {OPTIONS.map((o) => (
            <div className="opt" key={o.flag}>
              <dt className="mono">{o.flag}</dt>
              <dd>{o.desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="doc-section">
        <h2 className="doc-h">
          <span className="doc-h-i">▷</span> Examples
        </h2>
        <p className="doc-p">Fix a folder of too-loud UI sounds into a new folder:</p>
        <CopyCommand command="npx audio-normalizer ./sounds -p sfx -o ./sounds-fixed" />
        <p className="doc-p">Batch a glob to podcast loudness:</p>
        <CopyCommand command={'npx audio-normalizer -p podcast "episodes/*.mp3"'} />
        <p className="doc-p">Just measure — don't write anything:</p>
        <CopyCommand command="npx audio-normalizer --analyze track.wav" />
        <p className="doc-p">Custom target and convert to WAV:</p>
        <CopyCommand command="npx audio-normalizer --target -12 song.flac -f wav" />
      </section>

      <section className="doc-section">
        <h2 className="doc-h">
          <span className="doc-h-i">?</span> How it works
        </h2>
        <p className="doc-p">
          LUFS presets use a two-pass{" "}
          <code className="ic">loudnorm</code> measurement (ITU-R BS.1770 / EBU R128) and
          apply linear gain, pulling back automatically if it would push the true peak
          past the ceiling — so it never clips. Peak presets (like{" "}
          <code className="ic">sfx</code>) apply a single lossless gain change, which is
          the right choice for very short clips where gated loudness is unreliable.
        </p>
      </section>
    </main>
  );
}
