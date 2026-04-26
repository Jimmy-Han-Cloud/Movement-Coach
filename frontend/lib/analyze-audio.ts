export interface EnergySegment {
  start_sec: number;
  end_sec: number;
  energy: number;
}

export interface AudioFeatures {
  bpm: number;
  energy: number;
  energy_timeline: EnergySegment[];
}

/**
 * Analyzes an audio blob URL in the browser using Web Audio API.
 * Detects BPM via onset autocorrelation and energy via RMS.
 * BPM uses first 60s only (speed); energy_timeline covers the full track.
 */
export async function analyzeAudio(blobUrl: string): Promise<AudioFeatures> {
  const audioContext = new AudioContext();
  try {
    const response = await fetch(blobUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const sampleRate = audioBuffer.sampleRate;
    const fullData = audioBuffer.getChannelData(0);

    // BPM + overall energy: first 60s only for speed
    const analysisSamples = Math.min(fullData.length, Math.floor(60 * sampleRate));
    const shortWindow = fullData.subarray(0, analysisSamples);
    const energy = computeEnergy(shortWindow);
    const bpm = detectBpm(shortWindow, sampleRate);

    // Energy timeline: full track, 15s windows
    const energy_timeline = computeEnergyTimeline(fullData, sampleRate);

    return { bpm, energy, energy_timeline };
  } finally {
    await audioContext.close();
  }
}

function computeEnergyTimeline(data: Float32Array, sampleRate: number, windowSec = 15): EnergySegment[] {
  const windowSamples = Math.floor(windowSec * sampleRate);
  const segments: EnergySegment[] = [];
  for (let offset = 0; offset < data.length; offset += windowSamples) {
    const slice = data.subarray(offset, Math.min(offset + windowSamples, data.length));
    let sum = 0;
    for (let i = 0; i < slice.length; i++) sum += slice[i] * slice[i];
    const rms = Math.sqrt(sum / slice.length);
    segments.push({
      start_sec: Math.round(offset / sampleRate),
      end_sec: Math.round(Math.min(offset + windowSamples, data.length) / sampleRate),
      energy: Math.round(Math.min(1.0, rms * 6) * 1000) / 1000,
    });
  }
  return segments;
}

function computeEnergy(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  const rms = Math.sqrt(sum / data.length);
  // Scale: typical speech/music RMS is 0.05–0.15; map to 0–1
  return Math.min(1.0, Math.max(0.0, rms * 6));
}

function detectBpm(data: Float32Array, sampleRate: number): number {
  const frameSize = 2048;
  const numFrames = Math.floor(data.length / frameSize);

  // Build energy envelope
  const envelope = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    let sum = 0;
    for (let j = 0; j < frameSize; j++) {
      const s = data[i * frameSize + j];
      sum += s * s;
    }
    envelope[i] = Math.sqrt(sum / frameSize);
  }

  // Half-wave rectified differential (onset strength)
  const onset = new Float32Array(numFrames);
  for (let i = 1; i < numFrames; i++) {
    onset[i] = Math.max(0, envelope[i] - envelope[i - 1]);
  }

  // Autocorrelation in BPM range 55–180
  const framesPerSec = sampleRate / frameSize;
  const minPeriod = Math.max(1, Math.floor((framesPerSec * 60) / 180));
  const maxPeriod = Math.floor((framesPerSec * 60) / 55);

  let bestPeriod = Math.round((minPeriod + maxPeriod) / 2);
  let bestCorr = -1;

  for (let p = minPeriod; p <= maxPeriod; p++) {
    let corr = 0;
    for (let i = 0; i < numFrames - p; i++) {
      corr += onset[i] * onset[i + p];
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestPeriod = p;
    }
  }

  const bpm = Math.round((framesPerSec * 60) / bestPeriod);
  return Math.max(55, Math.min(180, bpm));
}
