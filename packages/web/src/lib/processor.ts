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

  return {
    measurement,
    plan,
    durationSec: decoded.durationSec,
    sampleRate: decoded.sampleRate,
    channels: decoded.channels.length,
    blob,
    outputName: outputName(file.name),
  };
}
