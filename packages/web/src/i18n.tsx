import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Lightweight i18n. Add a language by adding an entry to LOCALES and a
 * dictionary object below — nothing else is hardcoded to two languages.
 * Missing keys fall back to English, then to the key/fallback, so a partial
 * translation still renders.
 */

export interface LocaleInfo {
  code: string;
  label: string;
}

export const LOCALES: LocaleInfo[] = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "nav.docs": "Docs",
  "nav.back": "Back to app",
  "hero.title": "Make every clip sit at the right volume.",
  "hero.sub":
    "Free sound effects and UI clicks often blast out at full scale. Drop them in, pick a target loudness, and download audio normalized to a consistent level, entirely in your browser.",
  "panel.target.title": "Target",
  "panel.target.note": "how loud & what format",
  "panel.source.title": "Source",
  "panel.source.note": "nothing is uploaded",
  "panel.output.title": "Output",
  "control.loudness": "Target loudness",
  "control.format": "Output format",
  "hint.format": "Lossless WAV. Gain-only, no quality loss.",
  "output.ready": "{done}/{total} ready",
  "btn.clear": "Clear",
  "btn.reapply": "Re-apply",
  "btn.downloadAll": "Download all",
  "btn.download": "Download",
  "btn.install": "Install",
  "fmt.16": "16-bit PCM · smaller",
  "fmt.24": "24-bit PCM · recommended",
  "fmt.32": "32-bit float · lossless",
  "dz.main": "Drag & drop audio files here, or ",
  "dz.browse": "click to browse",
  "dz.formats": "WAV · MP3 · FLAC · M4A · OGG · Opus",
  "status.queued": "Queued",
  "status.analyzing": "Analyzing…",
  "status.error": "Error",
  "status.remove": "Remove",
  "stat.loudness": "Loudness",
  "stat.peak": "Peak",
  "stat.gain": "Gain applied",
  "badge.limited": "peak-limited",
  "ab.before": "Before",
  "ab.after": "After",
  "ab.play": "Play",
  "ab.pause": "Pause",
  "meta.mono": "mono",
  "meta.stereo": "stereo",
  "lang.label": "Language",
  "footer.tag":
    "Normalize audio to an optimal, consistent loudness, in your browser or the terminal.",
  "footer.chip.noupload": "No upload",
  "footer.chip.offline": "Offline",
  "footer.chip.free": "Free & OSS",
  "footer.col.app": "App",
  "footer.col.code": "Code",
  "footer.col.cli": "CLI",
  "footer.link.normalizer": "Normalizer",
  "footer.link.install": "Install app",
  "footer.license": "© {year} AudioNorm · MIT License",
  "docs.eyebrow": "Documentation",
  "docs.title": "Command-line usage",
  "docs.sub":
    "The same loudness engine as the web app, for the terminal. It bundles its own ffmpeg, so there is nothing to install, run it straight from npx.",
  "docs.qs": "Quick start",
  "docs.qs.p":
    "Normalizes track.wav to −14 LUFS and writes track-normalized.wav next to it.",
  "docs.presets": "Presets",
  "docs.th.preset": "Preset",
  "docs.th.target": "Target",
  "docs.th.best": "Best for",
  "docs.options": "Options",
  "docs.examples": "Examples",
  "docs.ex.sfx": "Fix a folder of too-loud UI sounds into a new folder:",
  "docs.ex.podcast": "Batch a glob to podcast loudness:",
  "docs.ex.analyze": "Just measure, nothing written:",
  "docs.ex.custom": "Custom target and convert to WAV:",
  "docs.how": "How it works",
  "docs.how.p":
    "LUFS presets use a two-pass loudnorm measurement (ITU-R BS.1770 / EBU R128) and apply linear gain, pulling back automatically if it would push the true peak past the ceiling, so it never clips. Peak presets (like sfx) apply a single lossless gain change, which is the right choice for very short clips where gated loudness is unreliable.",
  "opt.preset": "Loudness preset (default: streaming)",
  "opt.target": "Override the target loudness for LUFS presets",
  "opt.peak": "Override the target peak for peak presets",
  "opt.out": "Output directory (default: alongside each input)",
  "opt.suffix": 'Filename suffix for outputs (default: "-normalized")',
  "opt.format": "Output format: wav, mp3, flac, m4a, ogg (default: keep input)",
  "opt.analyze": "Only measure and report, without writing files",
  "opt.listpresets": "List the available presets and exit",
  "opt.help": "Show help",
};

const ja: Dict = {
  "nav.docs": "ドキュメント",
  "nav.back": "アプリに戻る",
  "hero.title": "すべての音を、ちょうどいい音量に。",
  "hero.sub":
    "フリー効果音やUIのクリック音は、そのままだと音量が最大で爆音になりがちです。ここにドロップして目標ラウドネスを選ぶと、一定の音量に正規化した音声をダウンロードできます。処理はすべてブラウザ内で完結します。",
  "panel.target.title": "ターゲット",
  "panel.target.note": "音量と出力形式",
  "panel.source.title": "ソース",
  "panel.source.note": "アップロードされません",
  "panel.output.title": "出力",
  "control.loudness": "目標ラウドネス",
  "control.format": "出力形式",
  "hint.format": "ロスレスWAV。ゲイン調整のみで音質劣化なし。",
  "output.ready": "{done}/{total} 完了",
  "btn.clear": "クリア",
  "btn.reapply": "再適用",
  "btn.downloadAll": "すべてダウンロード",
  "btn.download": "ダウンロード",
  "btn.install": "インストール",
  "fmt.16": "16-bit PCM・軽量",
  "fmt.24": "24-bit PCM・推奨",
  "fmt.32": "32-bit float・ロスレス",
  "dz.main": "音声ファイルをドラッグ&ドロップ、または ",
  "dz.browse": "クリックして選択",
  "dz.formats": "WAV · MP3 · FLAC · M4A · OGG · Opus",
  "status.queued": "待機中",
  "status.analyzing": "解析中…",
  "status.error": "エラー",
  "status.remove": "削除",
  "stat.loudness": "ラウドネス",
  "stat.peak": "ピーク",
  "stat.gain": "適用ゲイン",
  "badge.limited": "ピーク制限",
  "ab.before": "処理前",
  "ab.after": "処理後",
  "ab.play": "再生",
  "ab.pause": "一時停止",
  "meta.mono": "モノラル",
  "meta.stereo": "ステレオ",
  "lang.label": "言語",
  "footer.tag":
    "音声を最適で一定のラウドネスに正規化。ブラウザでもターミナルでも。",
  "footer.chip.noupload": "アップロードなし",
  "footer.chip.offline": "オフライン対応",
  "footer.chip.free": "無料・OSS",
  "footer.col.app": "アプリ",
  "footer.col.code": "コード",
  "footer.col.cli": "CLI",
  "footer.link.normalizer": "ノーマライザー",
  "footer.link.install": "アプリをインストール",
  "footer.license": "© {year} AudioNorm・MITライセンス",
  "docs.eyebrow": "ドキュメント",
  "docs.title": "コマンドラインの使い方",
  "docs.sub":
    "Webアプリと同じラウドネスエンジンをターミナルで。ffmpeg を同梱しているのでインストール不要、npx からそのまま実行できます。",
  "docs.qs": "クイックスタート",
  "docs.qs.p":
    "track.wav を −14 LUFS に正規化し、track-normalized.wav を隣に書き出します。",
  "docs.presets": "プリセット",
  "docs.th.preset": "プリセット",
  "docs.th.target": "ターゲット",
  "docs.th.best": "用途",
  "docs.options": "オプション",
  "docs.examples": "使用例",
  "docs.ex.sfx": "爆音のUI効果音のフォルダを、別フォルダに整えて出力:",
  "docs.ex.podcast": "グロブ指定でまとめてポッドキャスト音量に:",
  "docs.ex.analyze": "計測のみ、書き出しなし:",
  "docs.ex.custom": "目標値を指定してWAVに変換:",
  "docs.how": "仕組み",
  "docs.how.p":
    "LUFSプリセットは2パスの loudnorm 計測（ITU-R BS.1770 / EBU R128）でリニアゲインを適用し、トゥルーピークが上限を超えそうな場合は自動的にゲインを抑えるのでクリップしません。ピークプリセット（sfx など）は1回のロスレスなゲイン変更を行い、ゲート付きラウドネスが不安定な非常に短いクリップに適しています。",
  "opt.preset": "ラウドネスプリセット（デフォルト: streaming）",
  "opt.target": "LUFSプリセットの目標ラウドネスを上書き",
  "opt.peak": "ピークプリセットの目標ピークを上書き",
  "opt.out": "出力ディレクトリ（デフォルト: 各入力と同じ場所）",
  "opt.suffix": 'ファイル名のサフィックス（デフォルト: "-normalized"）',
  "opt.format": "出力形式: wav, mp3, flac, m4a, ogg（デフォルト: 入力のまま）",
  "opt.analyze": "計測して表示するだけ、ファイルは書き出さない",
  "opt.listpresets": "利用可能なプリセットを一覧表示して終了",
  "opt.help": "ヘルプを表示",

  // preset labels/descriptions — English comes from core as a fallback
  "preset.streaming.label": "ストリーミング (-14 LUFS)",
  "preset.streaming.desc":
    "Spotify / YouTube / Apple Music 向け。汎用的な「ちょうどいい」音量。",
  "preset.podcast.label": "ポッドキャスト / 音声 (-16 LUFS)",
  "preset.podcast.desc":
    "Apple Podcasts / 話し声向け。やや控えめでセリフが聞き取りやすい。",
  "preset.broadcast.label": "放送 (-23 LUFS)",
  "preset.broadcast.desc": "EBU R128 放送基準。控えめでヘッドルームに余裕。",
  "preset.loud.label": "ラウド / クラブ (-9 LUFS)",
  "preset.loud.desc": "知覚音量を最大化するホットなマスター。使いすぎ注意。",
  "preset.peak.label": "ピーク正規化 (-1 dB)",
  "preset.peak.desc":
    "最大サンプルが -1 dB になるよう調整。ロスレスなゲイン変更で、ラウドネス解析なし。",
  "preset.sfx.label": "UI / ボタン効果音 (-3 dB ピーク)",
  "preset.sfx.desc":
    "短いアプリ効果音（クリックや通知）向け。爆音の効果音を抑え、全クリップを一定ピークに揃えます。ボタン音が大きすぎる問題におすすめ。",
};

const DICTS: Record<string, Dict> = { en, ja };

export function availableLocales(): LocaleInfo[] {
  return LOCALES.filter((l) => DICTS[l.code]);
}

function detectLocale(): string {
  try {
    const saved = localStorage.getItem("audionorm.lang");
    if (saved && DICTS[saved]) return saved;
  } catch {
    /* localStorage may be unavailable */
  }
  const prefs =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
  for (const p of prefs) {
    const base = (p || "").toLowerCase().split("-")[0];
    if (DICTS[base]) return base;
  }
  return "en";
}

export type TFn = (
  key: string,
  vars?: Record<string, string | number>,
  fallback?: string,
) => string;

interface I18nValue {
  lang: string;
  setLang: (l: string) => void;
  t: TFn;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<string>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: string) => {
    setLangState(l);
    try {
      localStorage.setItem("audionorm.lang", l);
    } catch {
      /* ignore */
    }
  };

  const t: TFn = (key, vars, fallback) => {
    let s = DICTS[lang]?.[key] ?? en[key] ?? fallback ?? key;
    if (vars) {
      for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]));
    }
    return s;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}
