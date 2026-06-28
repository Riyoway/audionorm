import { spawn } from "node:child_process";
import ffmpegStatic from "ffmpeg-static";

export const ffmpegPath: string = (ffmpegStatic as unknown as string) || "ffmpeg";

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export function runFfmpeg(args: string[]): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

export interface LoudnormMeasurement {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  target_offset: string;
}

/** First loudnorm pass: measure the file and parse the printed JSON block. */
export async function measureLoudnorm(
  input: string,
  targetLufs: number,
  truePeak: number,
): Promise<LoudnormMeasurement> {
  const filter = `loudnorm=I=${targetLufs}:TP=${truePeak}:LRA=11:print_format=json`;
  const { stderr } = await runFfmpeg([
    "-hide_banner",
    "-i",
    input,
    "-af",
    filter,
    "-f",
    "null",
    "-",
  ]);

  const match = stderr.match(/\{[\s\S]*?\}/);
  if (!match) {
    throw new Error(`Could not parse loudnorm measurement for ${input}`);
  }
  return JSON.parse(match[0]) as LoudnormMeasurement;
}

/** Measure peak/mean volume via the volumedetect filter. Returns dBFS values. */
export async function measureVolume(
  input: string,
): Promise<{ maxVolumeDb: number; meanVolumeDb: number }> {
  const { stderr } = await runFfmpeg([
    "-hide_banner",
    "-i",
    input,
    "-af",
    "volumedetect",
    "-f",
    "null",
    "-",
  ]);
  const max = stderr.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/);
  const mean = stderr.match(/mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/);
  return {
    maxVolumeDb: max ? parseFloat(max[1]) : -Infinity,
    meanVolumeDb: mean ? parseFloat(mean[1]) : -Infinity,
  };
}

/** Map an output extension to an ffmpeg codec + quality args (quality-first). */
export function codecArgsForExtension(ext: string): string[] {
  switch (ext.toLowerCase()) {
    case ".wav":
      return ["-c:a", "pcm_s24le"];
    case ".flac":
      return ["-c:a", "flac", "-compression_level", "5"];
    case ".mp3":
      return ["-c:a", "libmp3lame", "-q:a", "0"];
    case ".m4a":
    case ".aac":
      return ["-c:a", "aac", "-b:a", "256k"];
    case ".ogg":
    case ".opus":
      return ["-c:a", "libopus", "-b:a", "192k"];
    default:
      return [];
  }
}
