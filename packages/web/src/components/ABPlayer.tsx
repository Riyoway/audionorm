import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useI18n } from "../i18n";

interface Props {
  beforeUrl: string;
  afterUrl: string;
}

function fmtTime(sec: number): string {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * A/B player: keeps the original ("before") and normalized ("after") audio in
 * two preloaded elements and switches between them at the exact same playback
 * position, so the volume difference is obvious.
 */
export function ABPlayer({ beforeUrl, afterUrl }: Props) {
  const { t } = useI18n();
  const beforeRef = useRef<HTMLAudioElement>(null);
  const afterRef = useRef<HTMLAudioElement>(null);
  const [active, setActive] = useState<"before" | "after">("after");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const current = () => (active === "before" ? beforeRef : afterRef).current;

  const togglePlay = () => {
    const a = current();
    if (!a) return;
    if (a.paused) {
      void a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const switchTo = (which: "before" | "after") => {
    if (which === active) return;
    const cur = current();
    const next = (which === "before" ? beforeRef : afterRef).current;
    if (cur && next) {
      next.currentTime = cur.currentTime;
      if (!cur.paused) {
        cur.pause();
        void next.play();
      }
    }
    setActive(which);
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    const a = current();
    if (a) a.currentTime = v;
    setTime(v);
  };

  return (
    <div className="abplayer">
      <audio
        ref={beforeRef}
        src={beforeUrl}
        preload="metadata"
        onTimeUpdate={() => active === "before" && setTime(beforeRef.current!.currentTime)}
        onLoadedMetadata={() =>
          active === "before" && setDuration(beforeRef.current!.duration)
        }
        onEnded={() => setPlaying(false)}
      />
      <audio
        ref={afterRef}
        src={afterUrl}
        preload="metadata"
        onTimeUpdate={() => active === "after" && setTime(afterRef.current!.currentTime)}
        onLoadedMetadata={() => active === "after" && setDuration(afterRef.current!.duration)}
        onEnded={() => setPlaying(false)}
      />

      <button
        type="button"
        className="ab-play"
        onClick={togglePlay}
        aria-label={playing ? t("ab.pause") : t("ab.play")}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className="ab-toggle" role="group">
        <button
          type="button"
          className={active === "before" ? "active" : ""}
          onClick={() => switchTo("before")}
        >
          {t("ab.before")}
        </button>
        <button
          type="button"
          className={active === "after" ? "active" : ""}
          onClick={() => switchTo("after")}
        >
          {t("ab.after")}
        </button>
      </div>

      <input
        type="range"
        className="ab-seek"
        min={0}
        max={duration || 0}
        step={0.01}
        value={time}
        onChange={onSeek}
        aria-label="Seek"
      />
      <span className="ab-time">
        {fmtTime(time)} / {fmtTime(duration)}
      </span>
    </div>
  );
}
