/**
 * ITU-R BS.1770-4 loudness measurement, dependency-free.
 *
 * Works on de-interleaved float channel data (range -1..1), so it runs in the
 * browser (on decoded Web Audio data) and in Node alike.
 */

export interface AudioData {
  /** One Float32Array per channel, samples in -1..1. */
  channels: Float32Array[];
  sampleRate: number;
}

export interface LoudnessResult {
  /** Integrated (gated) loudness in LUFS. -Infinity for silence. */
  integratedLufs: number;
  /** Highest absolute sample value as dBFS. */
  samplePeakDb: number;
  /** Estimated true peak (4x oversampled) as dBTP. */
  truePeakDb: number;
}

interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/** Pre-filter (high-shelf) stage of the K-weighting, adapted to `fs`. */
function highShelf(fs: number): BiquadCoeffs {
  const f0 = 1681.974450955533;
  const G = 3.999843853973347;
  const Q = 0.7071752369554196;
  const K = Math.tan((Math.PI * f0) / fs);
  const Vh = Math.pow(10, G / 20);
  const Vb = Math.pow(Vh, 0.4996667741545416);
  const a0 = 1 + K / Q + K * K;
  return {
    b0: (Vh + (Vb * K) / Q + K * K) / a0,
    b1: (2 * (K * K - Vh)) / a0,
    b2: (Vh - (Vb * K) / Q + K * K) / a0,
    a1: (2 * (K * K - 1)) / a0,
    a2: (1 - K / Q + K * K) / a0,
  };
}

/** RLB high-pass stage of the K-weighting, adapted to `fs`. */
function highPass(fs: number): BiquadCoeffs {
  const f0 = 38.13547087602444;
  const Q = 0.5003270373238773;
  const K = Math.tan((Math.PI * f0) / fs);
  const a0 = 1 + K / Q + K * K;
  return {
    b0: 1 / a0,
    b1: -2 / a0,
    b2: 1 / a0,
    a1: (2 * (K * K - 1)) / a0,
    a2: (1 - K / Q + K * K) / a0,
  };
}

function applyBiquad(input: Float32Array, c: BiquadCoeffs): Float32Array {
  const out = new Float32Array(input.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i];
    const y0 = c.b0 * x0 + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    out[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return out;
}

/** Channel weighting coefficients (mono/stereo => 1.0 each). */
function channelWeight(index: number, total: number): number {
  // BS.1770 weights the surround (Ls/Rs) channels by 1.41; L/R/C are 1.0.
  // For the common mono/stereo case every channel is 1.0.
  if (total >= 5 && (index === 3 || index === 4)) return 1.41;
  return 1.0;
}

const ABSOLUTE_GATE_LUFS = -70;
const RELATIVE_GATE_OFFSET = -10;
const LUFS_OFFSET = -0.691;

export function measureLoudness(audio: AudioData): LoudnessResult {
  const { channels, sampleRate } = audio;

  const samplePeakDb = computeSamplePeakDb(channels);
  const truePeakDb = computeTruePeakDb(channels);

  if (channels.length === 0 || channels[0].length === 0) {
    return { integratedLufs: -Infinity, samplePeakDb, truePeakDb };
  }

  const shelf = highShelf(sampleRate);
  const hp = highPass(sampleRate);

  // K-weight every channel.
  const weighted = channels.map((ch) => applyBiquad(applyBiquad(ch, shelf), hp));

  // 400 ms blocks, 75% overlap (100 ms step).
  const blockSize = Math.round(0.4 * sampleRate);
  const stepSize = Math.round(0.1 * sampleRate);
  const numSamples = weighted[0].length;
  if (numSamples < blockSize) {
    return { integratedLufs: -Infinity, samplePeakDb, truePeakDb };
  }

  // Mean square per channel for each block.
  const blocks: number[][] = [];
  for (let start = 0; start + blockSize <= numSamples; start += stepSize) {
    const perChannel: number[] = [];
    for (let c = 0; c < weighted.length; c++) {
      let sum = 0;
      const data = weighted[c];
      for (let i = start; i < start + blockSize; i++) {
        sum += data[i] * data[i];
      }
      perChannel.push(sum / blockSize);
    }
    blocks.push(perChannel);
  }

  const blockLoudness = (ms: number[]): number => {
    let acc = 0;
    for (let c = 0; c < ms.length; c++) {
      acc += channelWeight(c, ms.length) * ms[c];
    }
    return acc <= 0 ? -Infinity : LUFS_OFFSET + 10 * Math.log10(acc);
  };

  // Absolute gating.
  const absPassed = blocks.filter((ms) => blockLoudness(ms) >= ABSOLUTE_GATE_LUFS);
  if (absPassed.length === 0) {
    return { integratedLufs: -Infinity, samplePeakDb, truePeakDb };
  }

  // Relative gate threshold from the mean of absolute-gated blocks.
  const meanMs = averageBlocks(absPassed);
  const relativeThreshold = blockLoudness(meanMs) + RELATIVE_GATE_OFFSET;

  const relPassed = absPassed.filter((ms) => blockLoudness(ms) >= relativeThreshold);
  const finalBlocks = relPassed.length > 0 ? relPassed : absPassed;

  const integratedLufs = blockLoudness(averageBlocks(finalBlocks));
  return { integratedLufs, samplePeakDb, truePeakDb };
}

function averageBlocks(blocks: number[][]): number[] {
  const channels = blocks[0].length;
  const mean = new Array(channels).fill(0);
  for (const ms of blocks) {
    for (let c = 0; c < channels; c++) mean[c] += ms[c];
  }
  for (let c = 0; c < channels; c++) mean[c] /= blocks.length;
  return mean;
}

function computeSamplePeakDb(channels: Float32Array[]): number {
  let peak = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      const a = Math.abs(ch[i]);
      if (a > peak) peak = a;
    }
  }
  return peak <= 0 ? -Infinity : 20 * Math.log10(peak);
}

/**
 * True-peak estimate via 4x linear oversampling. Not as exact as a polyphase
 * FIR, but a solid, cheap approximation for headroom / limiting decisions.
 */
function computeTruePeakDb(channels: Float32Array[]): number {
  const OS = 4;
  let peak = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length - 1; i++) {
      const a = ch[i];
      const b = ch[i + 1];
      for (let s = 0; s < OS; s++) {
        const v = Math.abs(a + ((b - a) * s) / OS);
        if (v > peak) peak = v;
      }
    }
    if (ch.length > 0) {
      const last = Math.abs(ch[ch.length - 1]);
      if (last > peak) peak = last;
    }
  }
  return peak <= 0 ? -Infinity : 20 * Math.log10(peak);
}
