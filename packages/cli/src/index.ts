import { resolve, dirname, basename, extname, join } from "node:path";
import { stat, mkdir } from "node:fs/promises";
import { glob } from "tinyglobby";
import {
  getPreset,
  DEFAULT_PRESET_ID,
  presetsByCategory,
  type Preset,
} from "@audio-normalizer/core";
import {
  measureLoudnorm,
  measureVolume,
  runFfmpeg,
  codecArgsForExtension,
} from "./ffmpeg.js";

const AUDIO_EXTENSIONS = [".wav", ".mp3", ".flac", ".m4a", ".aac", ".ogg", ".opus", ".wma", ".aiff"];

interface Options {
  inputs: string[];
  presetId: string;
  outDir?: string;
  suffix: string;
  format?: string; // output extension override, e.g. "wav"
  targetLufs?: number;
  peakDb?: number;
  analyze: boolean;
}

function parseArgs(argv: string[]): Options | { help: true } | { listPresets: true } {
  const opts: Options = {
    inputs: [],
    presetId: DEFAULT_PRESET_ID,
    suffix: "-normalized",
    analyze: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "-h":
      case "--help":
        return { help: true };
      case "--list-presets":
        return { listPresets: true };
      case "-p":
      case "--preset":
        opts.presetId = next();
        break;
      case "-o":
      case "--out":
        opts.outDir = next();
        break;
      case "--suffix":
        opts.suffix = next();
        break;
      case "-f":
      case "--format":
        opts.format = next().replace(/^\./, "");
        break;
      case "--target":
        opts.targetLufs = parseFloat(next());
        break;
      case "--peak":
        opts.peakDb = parseFloat(next());
        break;
      case "--analyze":
        opts.analyze = true;
        break;
      default:
        if (a.startsWith("-")) {
          throw new Error(`Unknown option: ${a}`);
        }
        opts.inputs.push(a);
    }
  }
  return opts;
}

function printHelp(): void {
  const presetList = presetsByCategory()
    .map(
      ({ category, presets }) =>
        `  ${category}\n` +
        presets.map((p) => `    ${p.id.padEnd(16)} ${p.label}`).join("\n"),
    )
    .join("\n\n");
  console.log(`
audionorm — normalize audio files to an optimal loudness

USAGE
  npx audionorm [options] <files|globs|folders...>

EXAMPLES
  npx audionorm track.wav
  npx audionorm -p podcast *.mp3
  npx audionorm -p sfx ./sounds -o ./sounds-fixed
  npx audionorm --analyze track.wav
  npx audionorm --target -12 song.flac -f wav

OPTIONS
  -p, --preset <id>     Loudness preset (default: ${DEFAULT_PRESET_ID})
      --target <LUFS>   Override the target loudness for LUFS presets
      --peak <dB>       Override the target peak for peak presets
  -o, --out <dir>       Output directory (default: alongside each input)
      --suffix <str>    Filename suffix for outputs (default: "-normalized")
  -f, --format <ext>    Output format: wav, mp3, flac, m4a, ogg (default: keep input)
      --analyze         Only measure and report; do not write files
      --list-presets    List available presets and exit
  -h, --help            Show this help

PRESETS
${presetList}
`);
}

async function resolveInputs(inputs: string[]): Promise<string[]> {
  const files = new Set<string>();
  for (const input of inputs) {
    let isDir = false;
    try {
      isDir = (await stat(input)).isDirectory();
    } catch {
      // not a plain path — treat as a glob below
    }
    if (isDir) {
      const found = await glob(
        AUDIO_EXTENSIONS.map((e) => `*${e}`),
        { cwd: resolve(input), absolute: true },
      );
      found.forEach((f) => files.add(f));
    } else if (/[*?{}[\]]/.test(input)) {
      const found = await glob(input, { absolute: true });
      found.forEach((f) => files.add(f));
    } else {
      files.add(resolve(input));
    }
  }
  return [...files].filter((f) => AUDIO_EXTENSIONS.includes(extname(f).toLowerCase()));
}

function outputPathFor(input: string, opts: Options): string {
  const ext = opts.format ? `.${opts.format}` : extname(input);
  const name = basename(input, extname(input)) + opts.suffix + ext;
  const dir = opts.outDir ? resolve(opts.outDir) : dirname(input);
  return join(dir, name);
}

function effectivePreset(opts: Options): Preset {
  const base = getPreset(opts.presetId);
  if (!base) {
    throw new Error(
      `Unknown preset "${opts.presetId}". Run --list-presets to see the options.`,
    );
  }
  return {
    ...base,
    targetLufs: opts.targetLufs ?? base.targetLufs,
    targetPeakDb: opts.peakDb ?? base.targetPeakDb,
  };
}

async function processFile(input: string, preset: Preset, opts: Options): Promise<void> {
  const label = basename(input);

  if (preset.method === "lufs") {
    const target = preset.targetLufs ?? -14;
    const tp = preset.truePeak ?? -1;
    const m = await measureLoudnorm(input, target, tp);

    if (opts.analyze) {
      console.log(
        `  ${label}\n    measured: ${(+m.input_i).toFixed(1)} LUFS, peak ${(+m.input_tp).toFixed(1)} dBTP` +
          `  →  would target ${target} LUFS`,
      );
      return;
    }

    const out = outputPathFor(input, opts);
    await ensureDir(out);
    const filter =
      `loudnorm=I=${target}:TP=${tp}:LRA=11` +
      `:measured_I=${m.input_i}:measured_TP=${m.input_tp}` +
      `:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}` +
      `:offset=${m.target_offset}:linear=true:print_format=summary`;

    const res = await runFfmpeg([
      "-hide_banner",
      "-y",
      "-i",
      input,
      "-af",
      filter,
      ...codecArgsForExtension(extname(out)),
      out,
    ]);
    if (res.code !== 0) throw new Error(res.stderr.split("\n").slice(-5).join("\n"));
    console.log(
      `  ${label}  ${(+m.input_i).toFixed(1)} → ${target} LUFS  ✓ ${basename(out)}`,
    );
    return;
  }

  // Peak / SFX method.
  const targetPeak = preset.targetPeakDb ?? -1;
  const { maxVolumeDb } = await measureVolume(input);
  const gainDb = maxVolumeDb === -Infinity ? 0 : targetPeak - maxVolumeDb;

  if (opts.analyze) {
    console.log(
      `  ${label}\n    measured peak: ${maxVolumeDb.toFixed(1)} dBFS` +
        `  →  would apply ${gainDb >= 0 ? "+" : ""}${gainDb.toFixed(1)} dB to reach ${targetPeak} dB`,
    );
    return;
  }

  const out = outputPathFor(input, opts);
  await ensureDir(out);
  const res = await runFfmpeg([
    "-hide_banner",
    "-y",
    "-i",
    input,
    "-af",
    `volume=${gainDb.toFixed(2)}dB`,
    ...codecArgsForExtension(extname(out)),
    out,
  ]);
  if (res.code !== 0) throw new Error(res.stderr.split("\n").slice(-5).join("\n"));
  console.log(
    `  ${label}  peak ${maxVolumeDb.toFixed(1)} → ${targetPeak} dB ` +
      `(${gainDb >= 0 ? "+" : ""}${gainDb.toFixed(1)} dB)  ✓ ${basename(out)}`,
  );
}

async function ensureDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

async function main(): Promise<void> {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }

  if ("help" in parsed) {
    printHelp();
    return;
  }
  if ("listPresets" in parsed) {
    for (const { category, presets } of presetsByCategory()) {
      console.log(`\n${category}`);
      for (const p of presets) {
        console.log(`  ${p.id.padEnd(16)} ${p.label}`);
        console.log(`  ${" ".repeat(16)} ${p.description}`);
      }
    }
    console.log("");
    return;
  }

  const opts = parsed;
  if (opts.inputs.length === 0) {
    printHelp();
    process.exit(1);
  }

  let preset: Preset;
  try {
    preset = effectivePreset(opts);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }

  const files = await resolveInputs(opts.inputs);
  if (files.length === 0) {
    console.error("No audio files matched the given inputs.");
    process.exit(1);
  }

  console.log(
    `\naudionorm · preset "${preset.id}" · ${files.length} file(s)` +
      (opts.analyze ? " · analyze only" : "") +
      "\n",
  );

  let ok = 0;
  let failed = 0;
  for (const file of files) {
    try {
      await processFile(file, preset, opts);
      ok++;
    } catch (e) {
      failed++;
      console.error(`  ✗ ${basename(file)}: ${(e as Error).message}`);
    }
  }

  console.log(`\nDone. ${ok} succeeded${failed ? `, ${failed} failed` : ""}.\n`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
