import { ArrowLeft } from "lucide-react";
import { PRESETS } from "@audio-normalizer/core";
import { CopyCommand } from "./CopyCommand";
import { useI18n } from "../i18n";

interface Props {
  onBack: () => void;
}

const OPTIONS: { flag: string; key: string }[] = [
  { flag: "-p, --preset <id>", key: "opt.preset" },
  { flag: "--target <LUFS>", key: "opt.target" },
  { flag: "--peak <dB>", key: "opt.peak" },
  { flag: "-o, --out <dir>", key: "opt.out" },
  { flag: "--suffix <str>", key: "opt.suffix" },
  { flag: "-f, --format <ext>", key: "opt.format" },
  { flag: "--analyze", key: "opt.analyze" },
  { flag: "--list-presets", key: "opt.listpresets" },
  { flag: "-h, --help", key: "opt.help" },
];

function presetTarget(p: (typeof PRESETS)[number]): string {
  return p.method === "peak" ? `${p.targetPeakDb} dB peak` : `${p.targetLufs} LUFS`;
}

export function DocsView({ onBack }: Props) {
  const { t } = useI18n();

  return (
    <main className="app-main docs">
      <button className="btn-ghost docs-back" onClick={onBack}>
        <ArrowLeft size={16} />
        {t("nav.back")}
      </button>

      <header className="docs-hero">
        <span className="eyebrow">{t("docs.eyebrow")}</span>
        <h1>{t("docs.title")}</h1>
        <p className="hero-sub">{t("docs.sub")}</p>
      </header>

      <section className="doc-section">
        <h2 className="doc-h">
          <span className="doc-h-i">$</span> {t("docs.qs")}
        </h2>
        <CopyCommand command="npx audionorm track.wav" />
        <p className="doc-p">{t("docs.qs.p")}</p>
      </section>

      <section className="doc-section">
        <h2 className="doc-h">
          <span className="doc-h-i">#</span> {t("docs.presets")}
        </h2>
        <div className="doc-table">
          <div className="doc-tr doc-th">
            <span>{t("docs.th.preset")}</span>
            <span>{t("docs.th.target")}</span>
            <span>{t("docs.th.best")}</span>
          </div>
          {PRESETS.map((p) => (
            <div className="doc-tr" key={p.id}>
              <span className="mono doc-id">{p.id}</span>
              <span className="mono doc-target">{presetTarget(p)}</span>
              <span className="doc-use">
                {t(`preset.${p.id}.desc`, undefined, p.description)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="doc-section">
        <h2 className="doc-h">
          <span className="doc-h-i">⚙</span> {t("docs.options")}
        </h2>
        <dl className="opt-list">
          {OPTIONS.map((o) => (
            <div className="opt" key={o.flag}>
              <dt className="mono">{o.flag}</dt>
              <dd>{t(o.key)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="doc-section">
        <h2 className="doc-h">
          <span className="doc-h-i">▷</span> {t("docs.examples")}
        </h2>
        <p className="doc-p">{t("docs.ex.sfx")}</p>
        <CopyCommand command="npx audionorm ./sounds -p sfx -o ./sounds-fixed" />
        <p className="doc-p">{t("docs.ex.podcast")}</p>
        <CopyCommand command={'npx audionorm -p podcast "episodes/*.mp3"'} />
        <p className="doc-p">{t("docs.ex.analyze")}</p>
        <CopyCommand command="npx audionorm --analyze track.wav" />
        <p className="doc-p">{t("docs.ex.custom")}</p>
        <CopyCommand command="npx audionorm --target -12 song.flac -f wav" />
      </section>

      <section className="doc-section">
        <h2 className="doc-h">
          <span className="doc-h-i">?</span> {t("docs.how")}
        </h2>
        <p className="doc-p">{t("docs.how.p")}</p>
      </section>
    </main>
  );
}
