# 🔊 audio-normalizer

Normalize audio files to an **optimal, consistent loudness** — so a clip you grabbed
from a free sound library doesn't blast out at full volume, and your app's UI/button
sounds all sit at the same comfortable level.

Comes in two forms that share the same loudness logic:

- **CLI (`npx audio-normalizer`)** — batch-process folders from the terminal. Bundles
  its own `ffmpeg`, so there is nothing else to install.
- **Web app** — drag & drop in the browser. **Nothing is uploaded**; all processing
  happens locally with the Web Audio API.

---

## Why

Loudness is perceptual, not just "peak level". Two files with the same peak can sound
very different in volume. This tool measures **integrated loudness in LUFS**
(ITU-R BS.1770 / EBU R128 — the same standard Spotify, YouTube and broadcasters use)
and applies the gain needed to hit your target, while keeping the **true peak** below a
ceiling so it never clips.

For very short clips (button clicks, notifications) the gated LUFS measurement is
unreliable, so there's a dedicated **peak-based "UI / SFX" mode** that just brings every
clip to a consistent, not-too-loud peak.

## Presets

| id          | Target               | Best for                                            |
| ----------- | -------------------- | --------------------------------------------------- |
| `streaming` | −14 LUFS             | General use, music — Spotify/YouTube level          |
| `podcast`   | −16 LUFS             | Voice, spoken word                                  |
| `broadcast` | −23 LUFS             | EBU R128 broadcast                                  |
| `loud`      | −9 LUFS              | Hot master, max perceived loudness                  |
| `peak`      | −1 dB peak           | Lossless peak normalize                             |
| `sfx`       | −3 dB peak           | **UI / button sound effects** (the too-loud fix)    |

---

## CLI

```bash
# Normalize a single file (default preset: streaming / -14 LUFS)
npx audio-normalizer track.wav

# Fix a folder of too-loud UI sounds, write to a new folder
npx audio-normalizer ./sounds -p sfx -o ./sounds-fixed

# Batch a glob to podcast loudness
npx audio-normalizer -p podcast "episodes/*.mp3"

# Just measure, don't write anything
npx audio-normalizer --analyze track.wav

# Custom target + convert to wav
npx audio-normalizer --target -12 song.flac -f wav
```

### Options

```
-p, --preset <id>     Loudness preset (default: streaming)
    --target <LUFS>   Override target loudness for LUFS presets
    --peak <dB>       Override target peak for peak presets
-o, --out <dir>       Output directory (default: alongside each input)
    --suffix <str>    Filename suffix for outputs (default: "-normalized")
-f, --format <ext>    Output format: wav, mp3, flac, m4a, ogg (default: keep input)
    --analyze         Only measure and report; do not write files
    --list-presets    List presets and exit
-h, --help            Show help
```

LUFS presets use ffmpeg's two-pass `loudnorm` (linear mode) for accurate, transparent
gain. Peak presets use a single lossless gain change. Output quality is preserved
(24-bit WAV, FLAC, or high-bitrate lossy depending on the target format).

## Web app

```bash
npm install
npm run dev:web      # start the dev server
npm run build:web    # production build → packages/web/dist
```

Open the dev URL, drop in audio files, pick a preset, and download the normalized
results. Output is lossless WAV (16 / 24-bit PCM or 32-bit float).

---

## Development

This is an npm-workspaces monorepo:

```
packages/
  core/   shared presets + ITU-R BS.1770 measurement (dependency-free TS)
  cli/    npx tool (ffmpeg-static + loudnorm)
  web/    Vite + React + TypeScript web app
```

```bash
npm install            # install all workspaces
npm run build:cli      # build the CLI → packages/cli/dist
npm run build:web      # build the web app
```

## License

MIT
