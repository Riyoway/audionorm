import type { Preset } from "./presets";
import type { AudioData, LoudnessResult } from "./loudness";

export interface GainPlan {
  /** Linear gain factor to multiply every sample by. */
  gainLinear: number;
  /** The same gain expressed in dB (for display). */
  gainDb: number;
  /** True if the gain was reduced to respect the true-peak ceiling. */
  peakLimited: boolean;
  /** Predicted true peak after applying the gain (dBTP). */
  resultingPeakDb: number;
}

const MINUS_INF = -Infinity;

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

export function linearToDb(linear: number): number {
  return linear <= 0 ? MINUS_INF : 20 * Math.log10(linear);
}

/**
 * Decide how much gain to apply for a given preset + measurement.
 *
 * - LUFS presets: gain = target - measured, then pulled back if it would push
 *   the true peak above the preset's ceiling (prevents clipping).
 * - Peak presets: gain = targetPeak - measuredPeak (pure, lossless scaling).
 */
export function planGain(preset: Preset, measurement: LoudnessResult): GainPlan {
  let gainDb: number;

  if (preset.method === "peak") {
    const target = preset.targetPeakDb ?? -1;
    const measured = measurement.samplePeakDb;
    gainDb = measured === MINUS_INF ? 0 : target - measured;
    const resultingPeakDb = measurement.truePeakDb + gainDb;
    return {
      gainLinear: dbToLinear(gainDb),
      gainDb,
      peakLimited: false,
      resultingPeakDb,
    };
  }

  // LUFS method.
  const target = preset.targetLufs ?? -14;
  if (measurement.integratedLufs === MINUS_INF) {
    return { gainLinear: 1, gainDb: 0, peakLimited: false, resultingPeakDb: measurement.truePeakDb };
  }
  gainDb = target - measurement.integratedLufs;

  let peakLimited = false;
  const ceiling = preset.truePeak ?? -1;
  const predictedPeak = measurement.truePeakDb + gainDb;
  if (predictedPeak > ceiling) {
    gainDb -= predictedPeak - ceiling;
    peakLimited = true;
  }

  return {
    gainLinear: dbToLinear(gainDb),
    gainDb,
    peakLimited,
    resultingPeakDb: measurement.truePeakDb + gainDb,
  };
}

/** Apply a linear gain to a copy of the audio (with hard-clip safety at ±1). */
export function applyGain(audio: AudioData, gainLinear: number): AudioData {
  const channels = audio.channels.map((ch) => {
    const out = new Float32Array(ch.length);
    for (let i = 0; i < ch.length; i++) {
      let v = ch[i] * gainLinear;
      if (v > 1) v = 1;
      else if (v < -1) v = -1;
      out[i] = v;
    }
    return out;
  });
  return { channels, sampleRate: audio.sampleRate };
}
