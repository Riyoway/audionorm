/**
 * Loudness normalization presets shared by the CLI and the web app.
 *
 * Two methods are supported:
 *  - "lufs": Perceptual loudness normalization (ITU-R BS.1770 / EBU R128).
 *            Best for music, voice, podcasts — anything you "listen through".
 *  - "peak": Peak normalization. Best for very short clips such as UI / button
 *            sound effects, where the gated LUFS measurement is unreliable and
 *            you mostly want a consistent, not-too-loud peak across many files.
 */

export type NormalizationMethod = "lufs" | "peak";

export interface Preset {
  /** Stable id used on the CLI (`--preset <id>`) and in the web UI. */
  id: string;
  /** Human readable name (English). */
  label: string;
  /** Short explanation of when to use it. */
  description: string;
  method: NormalizationMethod;
  /** Target integrated loudness in LUFS (only for method === "lufs"). */
  targetLufs?: number;
  /** Target / maximum true peak in dBTP. */
  truePeak?: number;
  /** Target peak in dBFS (only for method === "peak"). */
  targetPeakDb?: number;
}

export const PRESETS: Preset[] = [
  {
    id: "streaming",
    label: "Streaming (-14 LUFS)",
    description:
      "Spotify / YouTube / Apple Music target. A good general-purpose 'just right' level.",
    method: "lufs",
    targetLufs: -14,
    truePeak: -1,
  },
  {
    id: "podcast",
    label: "Podcast / Voice (-16 LUFS)",
    description: "Apple Podcasts / spoken-word target. Slightly quieter, clearer dialogue.",
    method: "lufs",
    targetLufs: -16,
    truePeak: -1.5,
  },
  {
    id: "broadcast",
    label: "Broadcast (-23 LUFS)",
    description: "EBU R128 broadcast standard. Conservative, lots of headroom.",
    method: "lufs",
    targetLufs: -23,
    truePeak: -1,
  },
  {
    id: "loud",
    label: "Loud / Club (-9 LUFS)",
    description: "Hot master for maximum perceived loudness. Use sparingly.",
    method: "lufs",
    targetLufs: -9,
    truePeak: -1,
  },
  {
    id: "peak",
    label: "Peak normalize (-1 dB)",
    description:
      "Scale so the loudest sample sits at -1 dB. Lossless gain change, no loudness analysis.",
    method: "peak",
    targetPeakDb: -1,
  },
  {
    id: "sfx",
    label: "UI / Button SFX (-3 dB peak)",
    description:
      "For short app sound effects (clicks, notifications). Tames 'too loud' SFX and keeps every clip at a consistent peak. Recommended for the button-too-loud problem.",
    method: "peak",
    targetPeakDb: -3,
  },
];

export const DEFAULT_PRESET_ID = "streaming";

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
