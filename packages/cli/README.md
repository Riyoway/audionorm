# audionorm

Normalize audio files to an **optimal, consistent loudness** from the command line —
so a clip you grabbed from a free sound library doesn't blast out at full volume, and
your app's UI / button sounds all sit at the same comfortable level.

Bundles its own **ffmpeg**, so there's nothing else to install. Just run it with `npx`.

```bash
npx audionorm track.wav
```

> Prefer a UI? There's also a browser version (drag & drop, nothing uploaded):
> **https://audionorm.riyo.me**

---

## Why

Loudness is *perceptual*, not just peak level — two files with the same peak can sound
very different in volume. `audionorm` measures **integrated loudness in LUFS**
(ITU-R BS.1770 / EBU R128, the same standard Spotify, YouTube and broadcasters use) and
applies the gain needed to hit your target, while keeping the **true peak** under a
ceiling so it never clips.

For very short clips (button clicks, notifications) gated LUFS is unreliable, so there's
a dedicated peak-based **`sfx`** preset that just brings every clip to a consistent,
not-too-loud peak.

## Usage

```bash
npx audionorm [options] <files | globs | folders...>
```

```bash
# Single file → -14 LUFS, writes track-normalized.wav next to it
npx audionorm track.wav

# Fix a folder of too-loud UI sounds into a new folder
npx audionorm ./sounds -p sfx -o ./sounds-fixed

# Batch a glob to podcast loudness
npx audionorm -p podcast "episodes/*.mp3"

# Just measure — don't write anything
npx audionorm --analyze track.wav

# Custom target and convert to WAV
npx audionorm --target -12 song.flac -f wav
```

## Presets

| id          | Target      | Best for                                          |
| ----------- | ----------- | ------------------------------------------------- |
| `streaming` | −14 LUFS    | General use, music — Spotify/YouTube level        |
| `podcast`   | −16 LUFS    | Voice, spoken word                                |
| `broadcast` | −23 LUFS    | EBU R128 broadcast                                |
| `loud`      | −9 LUFS     | Hot master, maximum perceived loudness            |
| `peak`      | −1 dB peak  | Lossless peak normalize                           |
| `sfx`       | −3 dB peak  | **UI / button sound effects** (the too-loud fix)  |

## Options

```
-p, --preset <id>     Loudness preset (default: streaming)
    --target <LUFS>   Override the target loudness for LUFS presets
    --peak <dB>       Override the target peak for peak presets
-o, --out <dir>       Output directory (default: alongside each input)
    --suffix <str>    Filename suffix for outputs (default: "-normalized")
-f, --format <ext>    Output format: wav, mp3, flac, m4a, ogg (default: keep input)
    --analyze         Only measure and report — don't write files
    --list-presets    List the available presets and exit
-h, --help            Show help
```

## How it works

LUFS presets use ffmpeg's two-pass `loudnorm` (linear mode) for accurate, transparent
gain, pulling back automatically if it would push the true peak past the ceiling. Peak
presets apply a single lossless gain change. Output quality is preserved (24-bit WAV,
FLAC, or high-bitrate lossy depending on the target format).

## Links

- Web app: https://audionorm.riyo.me
- Source: https://github.com/Riyoway/audionorm

## License

MIT
