import type { AudioData } from "@audio-normalizer/core";

export type BitDepth = 16 | 24 | 32;

/**
 * Encode float channel data to a WAV Blob.
 * 16/24-bit produce integer PCM; 32-bit produces IEEE float (lossless w.r.t.
 * the processed samples).
 */
export function encodeWav(audio: AudioData, bitDepth: BitDepth = 24): Blob {
  const { channels, sampleRate } = audio;
  const numChannels = channels.length;
  const numFrames = channels[0]?.length ?? 0;
  const isFloat = bitDepth === 32;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  // RIFF header.
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  // fmt chunk.
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, isFloat ? 3 : 1, true); // 1 = PCM, 3 = IEEE float
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  // data chunk.
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = clamp(channels[c][i]);
      if (isFloat) {
        view.setFloat32(offset, sample, true);
        offset += 4;
      } else if (bitDepth === 24) {
        const val = Math.round(sample * 8388607);
        view.setUint8(offset, val & 0xff);
        view.setUint8(offset + 1, (val >> 8) & 0xff);
        view.setUint8(offset + 2, (val >> 16) & 0xff);
        offset += 3;
      } else {
        view.setInt16(offset, Math.round(sample * 32767), true);
        offset += 2;
      }
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function clamp(v: number): number {
  return v > 1 ? 1 : v < -1 ? -1 : v;
}
