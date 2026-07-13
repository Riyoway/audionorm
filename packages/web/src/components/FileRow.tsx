import { useEffect, useMemo } from "react";
import { Loader2, TriangleAlert, CircleAlert, Download, X } from "lucide-react";
import type { ProcessResult } from "../lib/processor";
import { ABPlayer } from "./ABPlayer";
import { useI18n } from "../i18n";

export interface FileItem {
  id: number;
  file: File;
  status: "pending" | "processing" | "done" | "error";
  result?: ProcessResult;
  error?: string;
}

interface Props {
  item: FileItem;
  onDownload: (item: FileItem) => void;
  onRemove: (id: number) => void;
}

function fmtDb(v: number): string {
  if (v === -Infinity || !isFinite(v)) return "−∞";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FileRow({ item, onDownload, onRemove }: Props) {
  const { t } = useI18n();
  const { file, status, result, error } = item;

  // Object URLs for A/B playback (original vs normalized). Revoked on unmount.
  const beforeUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const afterUrl = useMemo(
    () => (result ? URL.createObjectURL(result.blob) : ""),
    [result],
  );
  useEffect(() => () => URL.revokeObjectURL(beforeUrl), [beforeUrl]);
  useEffect(() => {
    return () => {
      if (afterUrl) URL.revokeObjectURL(afterUrl);
    };
  }, [afterUrl]);

  return (
    <div className={`file-row ${status}`}>
      <div className="file-head">
        <div className="file-main">
          <div className="file-name" title={file.name}>
            {file.name}
          </div>
          {result && (
            <div className="file-meta">
              {fmtDuration(result.durationSec)} ·{" "}
              {result.channels === 1 ? t("meta.mono") : t("meta.stereo")} ·{" "}
              {(result.sampleRate / 1000).toFixed(1)} kHz
            </div>
          )}
        </div>

        <div className="file-head-actions">
          {status === "pending" && <span className="badge pending">{t("status.queued")}</span>}
          {status === "processing" && (
            <span className="badge processing">
              <Loader2 size={13} className="spin" />
              {t("status.analyzing")}
            </span>
          )}
          {status === "error" && (
            <span className="badge error" title={error}>
              <TriangleAlert size={13} />
              {t("status.error")}
            </span>
          )}
          <button
            className="file-remove"
            onClick={() => onRemove(item.id)}
            aria-label={t("status.remove")}
            title={t("status.remove")}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {status === "done" && result && (
        <>
          <div className="file-stats">
            <div className="stat">
              <span className="stat-label">{t("stat.loudness")}</span>
              <span className="stat-value">{fmtDb(result.measurement.integratedLufs)} LUFS</span>
            </div>
            <div className="stat">
              <span className="stat-label">{t("stat.peak")}</span>
              <span className="stat-value">{fmtDb(result.measurement.truePeakDb)} dB</span>
            </div>
            <div className="stat">
              <span className="stat-label">{t("stat.gain")}</span>
              <span className="stat-value accent">{fmtDb(result.plan.gainDb)} dB</span>
            </div>
            {result.plan.peakLimited && (
              <span className="badge limited">
                <CircleAlert size={13} />
                {t("badge.limited")}
              </span>
            )}
            <button className="btn-download" onClick={() => onDownload(item)}>
              <Download size={15} />
              {t("btn.download")}
            </button>
          </div>

          <div className="file-player">
            <ABPlayer beforeUrl={beforeUrl} afterUrl={afterUrl} />
          </div>
        </>
      )}

      {status === "error" && <div className="file-error">{error}</div>}
    </div>
  );
}
