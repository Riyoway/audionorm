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
  /** Grouping category for the UI / CLI, e.g. "General", "Music streaming". */
  category: string;
  /** Source URL the target was taken from (for service presets). */
  sourceUrl?: string;
}

/** Category display order (categories not listed fall to the end). */
export const CATEGORY_ORDER = [
  "General",
  "Music streaming",
  "Video & social",
  "Podcast & audiobook",
  "Broadcast & cinema",
];

/** General-purpose loudness targets (not tied to one platform). */
const GENERAL_PRESETS: Preset[] = [
  {
    id: "streaming",
    label: "Streaming (-14 LUFS)",
    description:
      "Spotify / YouTube / Apple Music target. A good general-purpose 'just right' level.",
    method: "lufs",
    targetLufs: -14,
    truePeak: -1,
    category: "General",
  },
  {
    id: "podcast",
    label: "Podcast / Voice (-16 LUFS)",
    description: "Apple Podcasts / spoken-word target. Slightly quieter, clearer dialogue.",
    method: "lufs",
    targetLufs: -16,
    truePeak: -1.5,
    category: "General",
  },
  {
    id: "broadcast",
    label: "Broadcast (-23 LUFS)",
    description: "EBU R128 broadcast standard. Conservative, lots of headroom.",
    method: "lufs",
    targetLufs: -23,
    truePeak: -1,
    category: "General",
  },
  {
    id: "loud",
    label: "Loud / Club (-9 LUFS)",
    description: "Hot master for maximum perceived loudness. Use sparingly.",
    method: "lufs",
    targetLufs: -9,
    truePeak: -1,
    category: "General",
  },
  {
    id: "peak",
    label: "Peak normalize (-1 dB)",
    description:
      "Scale so the loudest sample sits at -1 dB. Lossless gain change, no loudness analysis.",
    method: "peak",
    targetPeakDb: -1,
    category: "General",
  },
  {
    id: "sfx",
    label: "UI / Button SFX (-3 dB peak)",
    description:
      "For short app sound effects (clicks, notifications). Tames 'too loud' SFX and keeps every clip at a consistent peak. Recommended for the button-too-loud problem.",
    method: "peak",
    targetPeakDb: -3,
    category: "General",
  },
];

/**
 * Per-service loudness targets. Each platform normalizes playback to a known
 * integrated-loudness target, so mastering to it means your audio is not turned
 * down (or up) on that service. Values researched from platform docs and
 * widely-cited "mastering for streaming" references; they change over time.
 */
const SERVICE_PRESETS: Preset[] = [
  // ---- Music streaming ------------------------------------------------------
  {
    id: "spotify",
    label: "Spotify (-14 LUFS)",
    description: "Spotify's playback loudness target. Master to this so Spotify does not turn your track down.",
    method: "lufs",
    targetLufs: -14,
    truePeak: -1,
    category: "Music streaming",
    sourceUrl: "https://support.spotify.com/us/artists/article/loudness-normalization/",
  },
  {
    id: "apple-music",
    label: "Apple Music (-16 LUFS)",
    description: "Apple Music Sound Check target. Quieter than most streaming services.",
    method: "lufs",
    targetLufs: -16,
    truePeak: -1,
    category: "Music streaming",
    sourceUrl:
      "https://www.production-expert.com/production-expert-1/apple-choose-16lufs-loudness-level-for-apple-music-heres-why",
  },
  {
    id: "youtube",
    label: "YouTube (-14 LUFS)",
    description: "YouTube and YouTube Music playback target.",
    method: "lufs",
    targetLufs: -14,
    truePeak: -1,
    category: "Music streaming",
    sourceUrl: "https://www.criticallisteninglab.com/en/learn/loudness/youtube",
  },
  {
    id: "amazon-music",
    label: "Amazon Music (-14 LUFS)",
    description: "Amazon Music target. Prefers a stricter -2 dBTP true peak.",
    method: "lufs",
    targetLufs: -14,
    truePeak: -2,
    category: "Music streaming",
    sourceUrl:
      "https://blog.remasterify.com/what-are-amazon-music-loudness-standards-lufs-and-true-peak-guide/",
  },
  {
    id: "tidal",
    label: "Tidal (-14 LUFS)",
    description: "Tidal playback target.",
    method: "lufs",
    targetLufs: -14,
    truePeak: -1,
    category: "Music streaming",
    sourceUrl:
      "https://matlefflerschulman.com/mastering-articles/loudness-targets-and-mastering-for-streaming-platforms",
  },
  {
    id: "deezer",
    label: "Deezer (-15 LUFS)",
    description: "Deezer playback target. Sits between Spotify and Apple Music.",
    method: "lufs",
    targetLufs: -15,
    truePeak: -1,
    category: "Music streaming",
    sourceUrl:
      "https://en.deezercommunity.com/features-feedback-44/how-does-the-normalise-volume-option-work-57025",
  },
  {
    id: "soundcloud",
    label: "SoundCloud (-14 LUFS)",
    description: "SoundCloud's recommended master level.",
    method: "lufs",
    targetLufs: -14,
    truePeak: -1,
    category: "Music streaming",
    sourceUrl:
      "https://help.soundcloud.com/hc/en-us/articles/360053660014-Will-SoundCloud-play-my-track-at-the-level-it-s-mastered",
  },

  // ---- Video & social -------------------------------------------------------
  {
    id: "tiktok",
    label: "TikTok (-14 LUFS)",
    description: "TikTok publishes no official target; -14 LUFS matches other platforms.",
    method: "lufs",
    targetLufs: -14,
    truePeak: -1,
    category: "Video & social",
    sourceUrl: "https://www.songbrain.ai/guides/lufs-for-spotify-and-tiktok",
  },
  {
    id: "instagram",
    label: "Instagram / Reels (-14 LUFS)",
    description: "Instagram and Reels playback target.",
    method: "lufs",
    targetLufs: -14,
    truePeak: -1,
    category: "Video & social",
    sourceUrl: "https://www.criticallisteninglab.com/en/learn/loudness/social-media",
  },
  {
    id: "facebook",
    label: "Facebook (-14 LUFS)",
    description: "Facebook playback target.",
    method: "lufs",
    targetLufs: -14,
    truePeak: -1,
    category: "Video & social",
    sourceUrl: "https://youlean.co/loudness-standards-full-comparison-table/",
  },

  // ---- Podcast & audiobook --------------------------------------------------
  {
    id: "apple-podcasts",
    label: "Apple Podcasts (-16 LUFS)",
    description: "Apple Podcasts spoken-word target.",
    method: "lufs",
    targetLufs: -16,
    truePeak: -1,
    category: "Podcast & audiobook",
    sourceUrl: "https://sone.app/blog/podcast-loudness-standards-2026-spotify-apple-youtube",
  },
  {
    id: "spotify-podcast",
    label: "Spotify podcast (-14 LUFS)",
    description: "Spotify's podcast playback target. Louder than Apple Podcasts.",
    method: "lufs",
    targetLufs: -14,
    truePeak: -1,
    category: "Podcast & audiobook",
    sourceUrl: "https://support.spotify.com/us/artists/article/loudness-normalization/",
  },
  {
    id: "acx",
    label: "Audible / ACX (-20 LUFS)",
    description:
      "Audible/ACX audiobook. Spec is RMS -23 to -18 dB with peaks below -3 dB; approximated here as -20 LUFS.",
    method: "lufs",
    targetLufs: -20,
    truePeak: -3,
    category: "Podcast & audiobook",
    sourceUrl: "https://help.acx.com/s/article/what-are-the-acx-audio-submission-requirements",
  },

  // ---- Broadcast & cinema ---------------------------------------------------
  {
    id: "atsc-a85",
    label: "ATSC A/85 (-24 LKFS)",
    description: "US TV broadcast (CALM Act). -24 LKFS with -2 dBTP peaks.",
    method: "lufs",
    targetLufs: -24,
    truePeak: -2,
    category: "Broadcast & cinema",
    sourceUrl:
      "https://www.atsc.org/atsc-documents/a85-techniques-for-establishing-and-maintaining-audio-loudness-for-digital-television/",
  },
];

export const PRESETS: Preset[] = [...GENERAL_PRESETS, ...SERVICE_PRESETS];

export const DEFAULT_PRESET_ID = "streaming";

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/** Presets grouped by category, in CATEGORY_ORDER. */
export function presetsByCategory(): { category: string; presets: Preset[] }[] {
  const cats = Array.from(new Set(PRESETS.map((p) => p.category)));
  cats.sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  return cats.map((category) => ({
    category,
    presets: PRESETS.filter((p) => p.category === category),
  }));
}
