---
name: audionorm
description: Normalize audio files with the audionorm npm CLI when the user explicitly asks for audio processing.
---

# AudioNorm

AudioNorm normalizes perceived loudness or peak level locally with ffmpeg. Use it for music, voice, podcasts, broadcast audio, and short UI sound effects.

## Safety and intent

- Reading this Skill, asking what it does, or asking for help must not run a command or inspect or process files.
- If the user only asks for audio processing without choosing a reusable Skill or one-off run, ask which they want before acting.
- If the user explicitly invoked this Skill or explicitly asked to install or use it, do not ask that choice again.
- If the user provides concrete input files, folders, or globs and a clear operation, do not ask the Skill-versus-npx question again.
- If the input path, operation, preset, format, or output location is unclear, ask only for the missing information.
- Respond in the user's language.
- Do not invent presets, options, formats, or platform targets. Use the lists below or run `--list-presets`.

## Run the CLI

```text
npx audionorm [options] <files|globs|folders...>
```

Node.js 18 or newer is required. The package bundles ffmpeg.

## Choose a preset from the request

Use the most specific matching preset when the user names a service or use case:

| User request | Preset | Target |
| --- | --- | --- |
| General music or streaming | `streaming` | -14 LUFS, -1 dBTP |
| Voice, spoken word, podcast | `podcast` | -16 LUFS, -1.5 dBTP |
| Broadcast or EBU R128 | `broadcast` | -23 LUFS, -1 dBTP |
| Very loud club-style master | `loud` | -9 LUFS, -1 dBTP |
| Peak normalization | `peak` | -1 dBFS peak |
| UI sounds, button clicks, notifications, short SFX | `sfx` | -3 dBFS peak |
| Spotify music | `spotify` | -14 LUFS, -1 dBTP |
| Apple Music | `apple-music` | -16 LUFS, -1 dBTP |
| YouTube or YouTube Music | `youtube` | -14 LUFS, -1 dBTP |
| Amazon Music | `amazon-music` | -14 LUFS, -2 dBTP |
| Tidal | `tidal` | -14 LUFS, -1 dBTP |
| Deezer | `deezer` | -15 LUFS, -1 dBTP |
| SoundCloud | `soundcloud` | -14 LUFS, -1 dBTP |
| TikTok | `tiktok` | -14 LUFS, -1 dBTP |
| Instagram or Reels | `instagram` | -14 LUFS, -1 dBTP |
| Facebook | `facebook` | -14 LUFS, -1 dBTP |
| Apple Podcasts | `apple-podcasts` | -16 LUFS, -1 dBTP |
| Spotify podcasts | `spotify-podcast` | -14 LUFS, -1 dBTP |
| Audible or ACX audiobook | `acx` | -20 LUFS, -3 dBTP approximation |
| US TV broadcast or ATSC A/85 | `atsc-a85` | -24 LKFS, -2 dBTP |

The service targets are practical mastering targets and can change over time. Do not present them as a guarantee from the platform.

## Preset behavior

- LUFS presets use two-pass ffmpeg `loudnorm` measurement and linear gain.
- Peak presets use ffmpeg `volumedetect` and a gain change based on the loudest sample.
- `sfx` is the correct default for short button, click, notification, and UI sounds because gated LUFS is unreliable on very short clips.
- `streaming` is the default when the user gives no more specific use case.
- For an explicit custom LUFS target, use `--target <LUFS>` with a LUFS preset.
- For an explicit custom peak target, use `--peak <dB>` with a peak preset.
- For measurement only, use `--analyze`. It does not write output files.

## CLI options

- `-h`, `--help`: print help and exit.
- `--list-presets`: print all preset IDs and descriptions and exit.
- `-p`, `--preset <id>`: select a preset. Default is `streaming`.
- `-o`, `--out <dir>`: write outputs to this directory. The directory is created when needed.
- `--suffix <str>`: replace the default `-normalized` filename suffix.
- `-f`, `--format <ext>`: override the output extension. CLI help lists `wav`, `mp3`, `flac`, `m4a`, and `ogg`.
- `--target <LUFS>`: override the target loudness for a LUFS preset, for example `--target -12`.
- `--peak <dB>`: override the target peak for a peak preset, for example `--peak -3`.
- `--analyze`: measure and report without writing files.

The parser expects each option value in the next argument. Use `--preset spotify`, not an invented option or unsupported syntax.

## Inputs and outputs

- Supported input extensions are `.wav`, `.mp3`, `.flac`, `.m4a`, `.aac`, `.ogg`, `.opus`, `.wma`, and `.aiff`.
- Inputs can be one file, multiple files, a glob, or a folder.
- A folder matches supported files directly inside it. It is not recursive. Use an explicit recursive glob such as `"sounds/**/*.wav"` for subfolders.
- Duplicate matches are removed.
- By default each output is beside its input, keeps its input extension, and adds `-normalized` before the extension.
- Existing output files are overwritten by ffmpeg because the CLI passes `-y`. Warn the user when this can replace an important file.
- Output encoding is selected from the extension: WAV uses 24-bit PCM, FLAC uses compression level 5, MP3 uses libmp3lame quality 0, M4A/AAC uses AAC 256 kbps, and OGG/Opus uses Opus 192 kbps.
- Multiple files are processed sequentially. Processing continues after an individual failure, but the final exit code is 1 if any file fails.
- Report the succeeded count, failed count, and output location. Never describe a partial failure as complete success.

## Examples

```text
npx audionorm track.wav
npx audionorm -p spotify "album/*.wav"
npx audionorm -p podcast "episodes/*.mp3"
npx audionorm -p sfx ./sounds -o ./sounds-fixed
npx audionorm -p instagram video-audio.wav
npx audionorm --target -12 song.flac -f wav
npx audionorm --peak -3 ./ui-sounds --suffix -ui
npx audionorm --analyze track.wav
npx audionorm "sounds/**/*.wav" -p sfx
```

Before running a write command, confirm the input paths and any output path that could overwrite important files. If the user only asks for an explanation, show the command but do not run it.
