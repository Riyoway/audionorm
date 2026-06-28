import {
  Clock,
  Loader2,
  TriangleAlert,
  CircleAlert,
  Download,
} from "lucide-react";
import type { ProcessResult } from "../lib/processor";

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

export function FileRow({ item, onDownload }: Props) {
  const { file, status, result, error } = item;

  return (
    <div className={`file-row ${status}`}>
      <div className="file-main">
        <div className="file-name" title={file.name}>
          {file.name}
        </div>
        {result && (
          <div className="file-meta">
            {fmtDuration(result.durationSec)} · {result.channels === 1 ? "mono" : "stereo"} ·{" "}
            {(result.sampleRate / 1000).toFixed(1)} kHz
          </div>
        )}
      </div>

      <div className="file-status">
        {status === "pending" && (
          <span className="badge pending">
            <Clock size={13} />
            Queued
          </span>
        )}
        {status === "processing" && (
          <span className="badge processing">
            <Loader2 size={13} className="spin" />
            Analyzing…
          </span>
        )}
        {status === "error" && (
          <span className="badge error" title={error}>
            <TriangleAlert size={13} />
            Error
          </span>
        )}
        {status === "done" && result && (
          <div className="metrics">
            <div className="metric">
              <span className="metric-label">Loudness</span>
              <span className="metric-value">{fmtDb(result.measurement.integratedLufs)} LUFS</span>
            </div>
            <div className="metric">
              <span className="metric-label">Peak</span>
              <span className="metric-value">{fmtDb(result.measurement.truePeakDb)} dB</span>
            </div>
            <div className="metric gain">
              <span className="metric-label">Gain</span>
              <span className="metric-value">{fmtDb(result.plan.gainDb)} dB</span>
            </div>
            {result.plan.peakLimited && (
              <span className="badge limited" title="Gain reduced to avoid clipping">
                <CircleAlert size={13} />
                peak-limited
              </span>
            )}
          </div>
        )}
      </div>

      <div className="file-action">
        {status === "done" && (
          <button className="btn-download" onClick={() => onDownload(item)}>
            <Download size={15} />
            Download
          </button>
        )}
      </div>

      {status === "error" && <div className="file-error">{error}</div>}
    </div>
  );
}
