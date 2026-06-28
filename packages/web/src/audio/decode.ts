import type { AudioData } from "@audio-normalizer/core";

let sharedCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedCtx;
}

export interface DecodedAudio extends AudioData {
  durationSec: number;
}

/** Decode a user-selected audio File into raw float channel data. */
export async function decodeFile(file: File): Promise<DecodedAudio> {
  const arrayBuffer = await file.arrayBuffer();
  const ctx = getContext();
  // decodeAudioData detaches the buffer, so pass a copy if reused elsewhere.
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

  const channels: Float32Array[] = [];
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    channels.push(audioBuffer.getChannelData(c).slice());
  }

  return {
    channels,
    sampleRate: audioBuffer.sampleRate,
    durationSec: audioBuffer.duration,
  };
}
