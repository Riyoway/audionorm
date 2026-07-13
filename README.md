<div align="center">

<img src="packages/web/public/icon-512.png" width="116" alt="audionorm logo" />

# audionorm

**Normalize audio to an optimal, consistent loudness, in your browser or the terminal.**

So a clip you grabbed from a free sound library doesn't blast out at full volume,
and your app's UI / button sounds all sit at the same comfortable level.

<p>
  <a href="https://www.npmjs.com/package/audionorm"><img alt="npm" src="https://img.shields.io/npm/v/audionorm?color=cb3837&logo=npm&label=audionorm"></a>
  <a href="https://www.npmjs.com/package/audionorm"><img alt="downloads" src="https://img.shields.io/npm/dm/audionorm?color=cb3837"></a>
  <img alt="license" src="https://img.shields.io/badge/license-MIT-6f87ff">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-offline%20ready-6f87ff">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white">
</p>

<p>
  <a href="https://audionorm.riyo.me"><b>▶ Live web app</b></a>
  &nbsp;·&nbsp;
  <a href="https://www.npmjs.com/package/audionorm">npm</a>
  &nbsp;·&nbsp;
  <a href="#-cli">CLI</a>
  &nbsp;·&nbsp;
  <a href="#-how-it-works">How it works</a>
</p>

</div>

---

## ✨ What it does

Loudness is **perceptual**, not just peak level. Two files with the same peak can sound
very different in volume. `audionorm` measures **integrated loudness in LUFS**
(ITU-R BS.1770 / EBU R128, the same standard Spotify, YouTube and broadcasters use) and
applies the gain needed to hit your target, while keeping the **true peak** under a
ceiling so it never clips.

For very short clips (button clicks, notifications) gated LUFS is unreliable, so there's
a dedicated peak-based **`sfx`** preset that brings every clip to a consistent,
not-too-loud peak.

| | |
| --- | --- |
| 🎚️ **LUFS normalization** | EBU R128 / ITU-R BS.1770 integrated loudness |
| 🔊 **Tames loud SFX** | Dedicated `sfx` preset for UI / button sounds |
| 🛡️ **True-peak safe** | Pulls back gain automatically to avoid clipping |
| 💎 **Quality-preserving** | Gain-only, lossless WAV / FLAC, high-bitrate lossy |
| 🔒 **Private** | Web app runs 100% in the browser, nothing uploaded |
| 📦 **Zero-install CLI** | Bundles ffmpeg, just `npx audionorm` |
| 📲 **Installable PWA** | Works offline once loaded |

## 🖥️ Two ways to use it

- **Web app**: drag & drop, pick a target, compare *before / after*, download. Nothing
  is uploaded. → **https://audionorm.riyo.me**
- **CLI**: batch-process folders from the terminal with `npx audionorm`.

---

## ⌨️ CLI

```bash
# Single file → -14 LUFS, writes track-normalized.wav next to it
npx audionorm track.wav

# Fix a folder of too-loud UI sounds into a new folder
npx audionorm ./sounds -p sfx -o ./sounds-fixed

# Batch a glob to podcast loudness
npx audionorm -p podcast "episodes/*.mp3"

# Just measure, nothing written
npx audionorm --analyze track.wav

# Custom target and convert to WAV
npx audionorm --target -12 song.flac -f wav
```

### Presets

| id          | Target      | Best for                                          |
| ----------- | ----------- | ------------------------------------------------- |
| `streaming` | −14 LUFS    | General use, music (Spotify/YouTube level)        |
| `podcast`   | −16 LUFS    | Voice, spoken word                                |
| `broadcast` | −23 LUFS    | EBU R128 broadcast                                |
| `loud`      | −9 LUFS     | Hot master, maximum perceived loudness            |
| `peak`      | −1 dB peak  | Lossless peak normalize                           |
| `sfx`       | −3 dB peak  | **UI / button sound effects** (the too-loud fix)  |

### Options

```
-p, --preset <id>     Loudness preset (default: streaming)
    --target <LUFS>   Override the target loudness for LUFS presets
    --peak <dB>       Override the target peak for peak presets
-o, --out <dir>       Output directory (default: alongside each input)
    --suffix <str>    Filename suffix for outputs (default: "-normalized")
-f, --format <ext>    Output format: wav, mp3, flac, m4a, ogg (default: keep input)
    --analyze         Only measure and report, without writing files
    --list-presets    List the available presets and exit
-h, --help            Show help
```

---

## 🔬 How it works

LUFS presets use ffmpeg's two-pass `loudnorm` (linear mode) for accurate, transparent
gain, pulling back automatically if it would push the true peak past the ceiling. Peak
presets apply a single lossless gain change, the right choice for very short clips where
gated loudness is unreliable. The web app implements the same ITU-R BS.1770 K-weighted
measurement in pure TypeScript and processes audio entirely client-side via the Web Audio
API.

## 🧩 Project structure

This is an npm-workspaces monorepo:

```
packages/
  core/   shared presets + ITU-R BS.1770 measurement (dependency-free TS)
  cli/    the npx tool  →  published to npm as "audionorm"
  web/    Vite + React + TypeScript PWA  →  deployed on Vercel
```

```bash
npm install            # install all workspaces
npm run dev:web        # run the web app locally
npm run build:cli      # build the CLI → packages/cli/dist
npm run build:web      # build the web app → packages/web/dist
```

## 📄 License

[MIT](LICENSE) © Riyoway
