// Procedural Web Audio synthesizer for the typewriter sound engine
// Synthesizes authentic mechanical key strikes, spacebar chunk, platen resonance,
// end-of-line warning bell, carriage return sliding sweep, paper feed, and pen markup.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getAudio() {
  return audioCtx && masterGain && noiseBuffer && audioCtx.state === 'running'
    ? { context: audioCtx, master: masterGain, noise: noiseBuffer }
    : null;
}

function now() {
  return (getAudio()?.context.currentTime ?? 0) + 0.005;
}

function withAudio(cb: () => void) {
  if (getAudio()) {
    cb();
  } else if (audioCtx) {
    audioCtx.resume().then(cb);
  }
}

function tone(
  time: number,
  freqStart: number,
  freqEnd: number,
  gain: number,
  dur: number,
  type: OscillatorType = 'sine',
  attack = 0.002,
  filterFreq = 8000
) {
  const a = getAudio();
  if (!a) return;
  const osc = a.context.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, time);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, time + dur);
  const filter = a.context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const g = a.context.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gain, time + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(filter).connect(g).connect(a.master);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function noise(
  time: number,
  freqStart: number,
  freqEnd: number,
  gain: number,
  dur: number,
  q = 1.4,
  filterType: BiquadFilterType = 'bandpass',
  attack = 0.001
) {
  const a = getAudio();
  if (!a) return;
  const src = a.context.createBufferSource();
  src.buffer = a.noise;
  const filter = a.context.createBiquadFilter();
  filter.type = filterType;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freqStart, time);
  filter.frequency.exponentialRampToValueAtTime(freqEnd, time + dur);
  const g = a.context.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gain, time + Math.min(attack, 0.4 * dur));
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  src.connect(filter).connect(g).connect(a.master);
  src.start(time, 1.5 * Math.random(), dur + 0.05);
}

function click(time: number, freq: number, gain: number) {
  noise(time, freq, 0.85 * freq, gain, 0.012, 3, 'bandpass');
  tone(time, 0.9 * freq, 0.8 * freq, 0.25 * gain, 0.018, 'triangle', 0.001, 9000);
}

export const typewriterSound = {
  wake() {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      audioCtx = new AudioCtxClass();

      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 10;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.002;
      compressor.release.value = 0.15;
      compressor.connect(audioCtx.destination);

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 1.4;
      masterGain.connect(compressor);

      // Chassis delay feedback loop
      const delay = audioCtx.createDelay(0.2);
      delay.delayTime.value = 0.045;
      const delayFeedback = audioCtx.createGain();
      delayFeedback.gain.value = 0.18;
      const delayFilter = audioCtx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 2400;
      const delayOut = audioCtx.createGain();
      delayOut.gain.value = 0.1;

      masterGain.connect(delay);
      delay.connect(delayFilter).connect(delayFeedback).connect(delay);
      delayFilter.connect(delayOut).connect(compressor);

      // 2 seconds of random white noise
      noiseBuffer = audioCtx.createBuffer(1, 2 * audioCtx.sampleRate, audioCtx.sampleRate);
      const channel = noiseBuffer.getChannelData(0);
      for (let i = 0; i < channel.length; i++) {
        channel[i] = 2 * Math.random() - 1;
      }
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  },

  strike(force = 1) {
    withAudio(() => {
      const t = now();
      const a = 0.92 + 0.16 * Math.random();
      click(t, 2600 * a, 0.05 * force);
      tone(t, 210 * a, 120, 0.09 * force, 0.05, 'sine', 0.001, 900);
      noise(t + 0.028, 3400 * a, 2200, 0.16 * force, 0.022, 1.6, 'bandpass');
      tone(t + 0.028, 1250 * a, 1100, 0.035 * force, 0.03, 'triangle', 0.001, 6000);
      noise(t + 0.03, 520, 260, 0.08 * force, 0.05, 0.8, 'lowpass');
      click(t + 0.075, 4200 * a, 0.02);
    });
  },

  space() {
    withAudio(() => {
      const e = now();
      noise(e, 900, 500, 0.06, 0.04, 1, 'bandpass');
      tone(e, 150, 90, 0.11, 0.07, 'sine', 0.001, 700);
      click(e + 0.06, 3600, 0.025);
    });
  },

  back() {
    withAudio(() => {
      const e = now();
      click(e, 3000, 0.04);
      tone(e, 180, 120, 0.05, 0.04, 'sine', 0.001, 800);
    });
  },

  ding() {
    withAudio(() => {
      const e = now();
      for (const [t, a, i] of [
        [1, 1, 1.3],
        [2.32, 0.5, 0.9],
        [3.01, 0.32, 0.6],
        [4.16, 0.2, 0.42],
        [5.43, 0.12, 0.3],
      ]) {
        tone(e, 2040 * t, 2040 * t * 0.999, 0.11 * a, i, 'sine', 0.001, 12000);
      }
    });
  },

  sweep(duration: number) {
    withAudio(() => {
      const t = now();
      noise(t, 1400, 2600, 0.05, duration, 2.2, 'bandpass', 0.03);
      const a = Math.round(38 * duration);
      for (let i = 0; i < a; i++) {
        click(t + (i / a) * duration * 0.96, 3000 + 1200 * Math.random(), 0.02 + 0.012 * Math.random());
      }
      tone(t + duration, 130, 70, 0.16, 0.12, 'sine', 0.001, 700);
      noise(t + duration, 1800, 900, 0.09, 0.04, 1.2, 'bandpass');
    });
  },

  feed() {
    withAudio(() => {
      const e = now();
      click(e, 2200, 0.05);
      click(e + 0.05, 2000, 0.04);
    });
  },

  eject() {
    withAudio(() => {
      const e = now();
      noise(e, 900, 4200, 0.07, 0.5, 0.9, 'bandpass', 0.06);
      noise(e + 0.05, 2400, 6000, 0.03, 0.4, 0.7, 'highpass', 0.05);
      click(e + 0.02, 2600, 0.03);
    });
  },

  land() {
    withAudio(() => {
      const e = now();
      noise(e, 1600, 700, 0.06, 0.12, 0.8, 'bandpass', 0.004);
      tone(e, 180, 110, 0.05, 0.08, 'sine', 0.002, 900);
    });
  },

  pen() {
    withAudio(() => {
      const e = now();
      noise(e, 3200, 4200, 0.022, 0.28, 5, 'bandpass', 0.03);
      noise(e + 0.05, 1800, 2400, 0.012, 0.2, 3, 'bandpass', 0.03);
    });
  },

  press() {
    withAudio(() => {
      const e = now();
      tone(e, 1500, 1300, 0.025, 0.035, 'sine', 0.001, 7000);
      noise(e, 5000, 4000, 0.015, 0.02, 0.8, 'highpass');
    });
  },
};
