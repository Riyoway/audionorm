import {
  measureLoudness,
  planGain,
  applyGain,
  type Preset,
  type LoudnessResult,
  type GainPlan,
} from "@audio-normalizer/core";
import { decodeFile } from "../audio/decode";
import { encodeWav, type BitDepth } from "../audio/encodeWav";

export interface ProcessResult {
  measurement: LoudnessResult;
  plan: GainPlan;
  /** Loudness after the planned gain, before WAV quantization. */
  outputLufs: number;
  /** The selected target, used to explain the result in the UI. */
  targetLufs?: number;
  targetPeakDb?: number;
  durationSec: number;
  sampleRate: number;
  channels: number;
  blob: Blob;
  outputName: string;
}

function outputName(inputName: string): string {
  const dot = inputName.lastIndexOf(".");
  const base = dot >= 0 ? inputName.slice(0, dot) : inputName;
  return `${base}-normalized.wav`;
}

export async function processFile(
  file: File,
  preset: Preset,
  bitDepth: BitDepth,
): Promise<ProcessResult> {
  const decoded = await decodeFile(file);
  const measurement = measureLoudness(decoded);
  const plan = planGain(preset, measurement);
  const normalized = applyGain(decoded, plan.gainLinear);
  const blob = encodeWav(normalized, bitDepth);
  // Gain-only normalization changes integrated loudness by the same number of
  // dB. Keep the source measurement too, so the UI can distinguish before,
  // target, and after values without measuring the entire file twice.
  const outputLufs =
    measurement.integratedLufs === -Infinity
      ? -Infinity
      : measurement.integratedLufs + plan.gainDb;

  return {
    measurement,
    plan,
    outputLufs,
    targetLufs: preset.targetLufs,
    targetPeakDb: preset.targetPeakDb,
    durationSec: decoded.durationSec,
    sampleRate: decoded.sampleRate,
    channels: decoded.channels.length,
    blob,
    outputName: outputName(file.name),
  };
}
