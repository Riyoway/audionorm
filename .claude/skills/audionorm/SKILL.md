---
name: audionorm
description: Normalize audio files with the audionorm npm CLI when the user explicitly asks for audio processing.
---

# AudioNorm

AudioNorm normalizes audio loudness or peak level with the `audionorm` npm CLI. It accepts audio files, globs, and folders and processes matching files sequentially.

## Safety and intent

- Reading this Skill, asking what it does, or asking for help must not run a command or inspect/process files.
- If the user only says they want audio processing and has not chosen a reusable Skill or a one-off command, ask whether they want to install/use the Claude Code Skill or use `npx` for this request only.
- If the user explicitly invoked this Skill or explicitly asked to install/use it, do not ask that choice again.
- If the user gives concrete input files, globs, or folders and a clear operation, do not ask an extra Skill-versus-npx question. Use the CLI contract below.
- If the input or requested setting is unclear, ask only for the missing information before running anything.
- Never invent a preset, option, format, or input type. Use `--list-presets` when the preset is unknown.

## Run the CLI

```text
npx audionorm [options] <files|globs|folders...>
```

Requirements:

- Node.js 18 or newer.
- The package uses ffmpeg and writes output files locally.
- Inputs may be a single file, multiple files, a glob, or a folder.
- A folder is not recursive. It matches supported audio files directly inside that folder. Use an explicit recursive glob when the user asks for subfolders.
- Supported input extensions are `.wav`, `.mp3`, `.flac`, `.m4a`, `.aac`, `.ogg`, `.opus`, `.wma`, and `.aiff`.
- The default preset is `streaming`.
- By default output is beside each input, keeps the input extension, and adds `-normalized` before the extension.
- The output directory can be created automatically.
- Existing output files are overwritten by ffmpeg. Warn the user when the chosen output may replace an existing file.
- Multiple files run sequentially. Processing continues after an individual failure, but the final exit code is 1 if any file fails.

## Options implemented by the CLI

- `-h`, `--help`
- `--list-presets`
- `-p`, `--preset <id>`
- `-o`, `--out <dir>`
- `--suffix <str>`
- `-f`, `--format <ext>`
- `--target <LUFS>`
- `--peak <dB>`
- `--analyze`

The CLI help lists `wav`, `mp3`, `flac`, `m4a`, and `ogg` as output formats. Do not claim other output formats unless the installed CLI help and implementation confirm them.

`--target` overrides the target loudness for LUFS presets. `--peak` overrides the target peak for peak presets. `--analyze` measures and reports without writing output files.

## Examples

Use only examples that match the user's request and quote shell globs when needed:

```text
npx audionorm track.wav
npx audionorm -p podcast "*.mp3"
npx audionorm -p sfx ./sounds -o ./sounds-fixed
npx audionorm --analyze track.wav
npx audionorm --target -12 song.flac -f wav
```

Before running, confirm the input paths and any output path that could overwrite important files. After running, report the command result, succeeded/failed counts, and output location. Do not describe a partial failure as a complete success.
