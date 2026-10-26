// Exact Living UI Underwater Hydrophone Sound Synthesizer from living-ui.dev/404

export interface AquariumAudio {
  start: () => Promise<boolean>;
  mute: (muted: boolean) => void;
  live: () => boolean;
  pause: (paused: boolean) => void;
  pop: (size: number, pan?: number) => void;
  splash: (power: number, pan?: number) => void;
  plunge: (power: number, pan?: number) => void;
  drip: (size: number, pan?: number) => void;
  knock: (force: number, pan?: number, underwater?: boolean) => void;
  stir: (speed: number, splashActivity: number, pan?: number) => void;
  close: () => void;
  getContextState?: () => string;
}

const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

export const createAquariumAudio = (): AquariumAudio => {
  let ctx: AudioContext | null = null;
  let isMuted = false;
  let masterGain: GainNode | null = null;
  let dryGain: GainNode | null = null;
  let underwaterFilter: BiquadFilterNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let rumbleBand: { gain: GainNode; filter: BiquadFilterNode; pan: StereoPannerNode } | null = null;
  let hissBand: { gain: GainNode; filter: BiquadFilterNode; pan: StereoPannerNode } | null = null;

  const lastTimes = {
    pop: -1,
    drip: -1,
    knock: -1,
  };

  const createPanner = (panValue: number): StereoPannerNode => {
    if (!ctx) throw new Error('AudioContext not ready');
    const panner = ctx.createStereoPanner();
    panner.pan.value = 0.8 * clamp(panValue, -1, 1);
    return panner;
  };

  const createContinuousBand = (freq: number, q: number) => {
    if (!ctx || !noiseBuffer || !dryGain) throw new Error('AudioContext not ready');
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    const pan = ctx.createStereoPanner();
    source.connect(filter).connect(gain).connect(pan).connect(dryGain);
    source.start(0, randomRange(0, 1));

    return { gain, filter, pan };
  };

  const isLive = () => Boolean(ctx && ctx.state === 'running' && !isMuted);

  const playTone = (
    time: number,
    startFreq: number,
    endFreq: number,
    rampDuration: number,
    peakGain: number,
    duration: number,
    pan = 0,
    underwater = false
  ) => {
    if (!ctx || !isLive() || !dryGain || !underwaterFilter) return;

    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + rampDuration);

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setValueAtTime(1e-4, time);
    gain.gain.exponentialRampToValueAtTime(peakGain, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(1e-4, time + duration);

    osc.connect(gain).connect(createPanner(pan)).connect(underwater ? underwaterFilter : dryGain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
    osc.onended = () => {
      try {
        gain.disconnect();
      } catch {}
    };
  };

  const playNoise = (
    time: number,
    type: BiquadFilterType,
    freq: number,
    q: number,
    peakGain: number,
    attack: number,
    decay: number,
    pan = 0,
    underwater = false
  ) => {
    if (!ctx || !isLive() || !noiseBuffer || !dryGain || !underwaterFilter) return null;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setValueAtTime(1e-4, time);
    gain.gain.exponentialRampToValueAtTime(peakGain, time + attack);
    gain.gain.exponentialRampToValueAtTime(1e-4, time + attack + decay);

    source.connect(filter).connect(gain).connect(createPanner(pan)).connect(underwater ? underwaterFilter : dryGain);
    source.start(time, randomRange(0, 1.5));
    source.stop(time + attack + decay + 0.02);
    source.onended = () => {
      try {
        gain.disconnect();
      } catch {}
    };

    return filter;
  };

  const start = async (): Promise<boolean> => {
    if (!ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;
      ctx = new AudioCtx();

      ctx.onstatechange = () => {
        if (ctx && ctx.state === 'running' && !isMuted && masterGain) {
          try {
            masterGain.gain.cancelScheduledValues(ctx.currentTime);
            masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
            masterGain.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
          } catch {
            masterGain.gain.value = 1;
          }
        }
      };

      masterGain = ctx.createGain();
      masterGain.gain.value = 0;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.2;

      masterGain.connect(compressor).connect(ctx.destination);

      dryGain = ctx.createGain();
      dryGain.connect(masterGain);

      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.28;

      // Synthetic Convolution Reverb Impulse from living-ui.dev
      const rate = ctx.sampleRate;
      const length = Math.round(1.8 * rate);
      const reverbBuffer = ctx.createBuffer(2, length, rate);
      for (let ch = 0; ch < 2; ch++) {
        const channelData = reverbBuffer.getChannelData(ch);
        let o = 0;
        for (let i = 0; i < length; i++) {
          const t = i / rate;
          o += (2 * Math.random() - 1 - o) * (0.5 - 0.42 * Math.min(1, t / 1.2));
          channelData[i] = o * Math.exp(-3.4 * t) * (t < 0.012 ? t / 0.012 : 1);
        }
      }
      const convolver = ctx.createConvolver();
      convolver.buffer = reverbBuffer;
      dryGain.connect(wetGain).connect(convolver).connect(masterGain);

      underwaterFilter = ctx.createBiquadFilter();
      underwaterFilter.type = 'lowpass';
      underwaterFilter.frequency.value = 650;
      underwaterFilter.Q.value = 0.4;
      underwaterFilter.connect(dryGain);

      noiseBuffer = (() => {
        const buf = ctx.createBuffer(1, Math.round(2 * ctx.sampleRate), ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = 2 * Math.random() - 1;
        }
        return buf;
      })();

      rumbleBand = createContinuousBand(320, 0.9);
      hissBand = createContinuousBand(1900, 0.7);
    }

    if (ctx.state !== 'running') {
      await ctx.resume().catch(() => {});
    }

    if (ctx.state === 'running' && !isMuted && masterGain) {
      try {
        masterGain.gain.cancelScheduledValues(ctx.currentTime);
        masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
        masterGain.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
      } catch {
        masterGain.gain.value = 1;
      }
    }

    return ctx.state === 'running';
  };

  const mute = (muted: boolean) => {
    isMuted = muted;
    if (ctx && masterGain) {
      try {
        masterGain.gain.cancelScheduledValues(ctx.currentTime);
        masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
        masterGain.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, muted ? 0.08 : 0.4);
      } catch {
        masterGain.gain.value = muted ? 0 : 1;
      }
    }
  };

  const pause = (paused: boolean) => {
    if (!ctx) return;
    if (paused) {
      ctx.suspend().catch(() => {});
    } else if (!isMuted) {
      ctx.resume().catch(() => {});
    }
  };

  const pop = (size: number, pan = 0) => {
    if (!isLive() || !ctx) return;
    const now = ctx.currentTime;
    if (now - lastTimes.pop < 0.035) return;
    lastTimes.pop = now;

    const baseFreq = clamp(2400 / (size + 0.8), 320, 2300) * randomRange(0.92, 1.08);
    playTone(
      now,
      baseFreq,
      baseFreq * randomRange(1.35, 1.7),
      0.05,
      clamp(0.1 * Math.sqrt(size), 0.045, 0.22),
      randomRange(0.06, 0.11),
      pan,
      false
    );
  };

  const splash = (power: number, pan = 0) => {
    if (!isLive() || !ctx) return;
    const now = ctx.currentTime;
    const p = clamp(power, 0, 1);

    const bp = playNoise(now, 'bandpass', 2200, 0.6, 0.9 * p + 0.1, 0.008, 0.38 + 0.3 * p, pan, false);
    if (bp) {
      bp.frequency.setValueAtTime(2600, now);
      bp.frequency.exponentialRampToValueAtTime(700, now + 0.5);
    }
    playNoise(now, 'lowpass', 520, 0.7, 1.3 * p + 0.1, 0.01, 0.24, pan, false);
    playTone(now, 180, 70, 0.2, 0.3 * p + 0.03, 0.26, pan, false);

    const count = Math.round(3 + 9 * p);
    for (let i = 0; i < count; i++) {
      const t = now + randomRange(0.06, 0.7);
      const f = randomRange(380, 1300);
      playTone(
        t,
        f,
        f * randomRange(1.3, 1.8),
        0.06,
        randomRange(0.04, 0.1),
        randomRange(0.06, 0.12),
        pan + randomRange(-0.15, 0.15),
        true
      );
    }
  };

  const plunge = (power: number, pan = 0) => {
    if (!isLive() || !ctx) return;
    const now = ctx.currentTime;
    const p = clamp(power, 0, 1);

    playNoise(now, 'highpass', 900, 0.7, 0.55 * p + 0.06, 0.0015, 0.05, pan, false);
    playNoise(now, 'lowpass', 280, 0.8, 0.45 * p + 0.04, 0.003, 0.07, pan, false);

    const bp = playNoise(now + 0.004, 'bandpass', 3400, 0.8, 0.32 * p + 0.04, 0.02, 0.35 + 0.3 * p, pan, false);
    if (bp) {
      bp.frequency.setValueAtTime(3600, now);
      bp.frequency.exponentialRampToValueAtTime(1800, now + 0.55);
    }

    const clickCount = Math.round(10 + 22 * p);
    for (let i = 0; i < clickCount; i++) {
      playNoise(
        now + 0.01 + Math.pow(Math.random(), 1.8) * (0.45 + 0.3 * p),
        'bandpass',
        randomRange(2000, 6000),
        1.2,
        randomRange(0.03, 0.09) * (0.5 + p),
        0.001,
        randomRange(0.008, 0.025),
        pan + randomRange(-0.3, 0.3),
        false
      );
    }

    const subFreq = randomRange(200, 280) * (1.3 - 0.4 * p);
    playTone(now + randomRange(0.05, 0.09), subFreq, subFreq * randomRange(2.2, 2.8), 0.07, 0.22 * p + 0.05, 0.12, pan, false);
    if (p > 0.4) {
      playTone(now + randomRange(0.11, 0.16), 1.4 * subFreq, 3 * subFreq, 0.06, 0.1 * p, 0.1, pan, false);
    }

    for (let i = 0; i < Math.round(4 + 10 * p); i++) {
      const f = randomRange(1300, 3200);
      playTone(
        now + randomRange(0.22, 0.85),
        f,
        f * randomRange(1.3, 1.7),
        0.02,
        randomRange(0.015, 0.05),
        randomRange(0.03, 0.06),
        pan + randomRange(-0.4, 0.4),
        false
      );
    }

    for (let i = 0; i < Math.round(2 + 5 * p); i++) {
      const f = randomRange(500, 1100);
      playTone(
        now + randomRange(0.08, 0.6),
        f,
        f * randomRange(1.4, 1.9),
        0.05,
        randomRange(0.04, 0.09),
        randomRange(0.06, 0.1),
        pan,
        true
      );
    }
  };

  const drip = (size: number, pan = 0) => {
    if (!isLive() || !ctx) return;
    const now = ctx.currentTime;
    if (now - lastTimes.drip < 0.045) return;
    lastTimes.drip = now;

    const freq = clamp(3600 / Math.sqrt(size + 0.5), 1200, 4200) * randomRange(0.9, 1.1);
    playTone(now, 0.7 * freq, freq, 0.025, 0.085, 0.05, pan, false);
  };

  const knock = (force: number, pan = 0, underwater = false) => {
    if (!isLive() || !ctx) return;
    const now = ctx.currentTime;
    if (now - lastTimes.knock < 0.06) return;
    lastTimes.knock = now;

    const f = clamp(force, 0, 1);
    const damp = underwater ? 0.5 : 1;
    const harmonics = [
      [612, 0.2, 0.32],
      [1490, 0.12, 0.2],
      [2730, 0.07, 0.12],
      [4310, 0.035, 0.07],
    ];

    for (const [freq, gainVal, dur] of harmonics) {
      const tuned = freq * randomRange(0.98, 1.02);
      playTone(now, tuned, 0.997 * tuned, dur, gainVal * f + 0.004, dur * damp, pan, underwater);
    }

    playNoise(now, 'highpass', 1800, 0.7, 0.35 * f + 0.01, 0.001, 0.012, pan, underwater);
    playTone(now, 140, 85, 0.08, 0.24 * f + 0.02, 0.12, pan, underwater);
  };

  const stir = (speed: number, splashActivity: number, pan = 0) => {
    if (!ctx || ctx.state !== 'running' || !rumbleBand || !hissBand) return;
    const now = ctx.currentTime;
    const spd = clamp(speed, 0, 1);
    const act = clamp(splashActivity, 0, 1);

    try {
      rumbleBand.gain.gain.setTargetAtTime(1.2 * Math.pow(spd, 1.2), now, 0.09);
      rumbleBand.filter.frequency.setTargetAtTime(240 + 520 * spd, now, 0.12);

      hissBand.gain.gain.setTargetAtTime(0.22 * Math.pow(spd, 1.4) + 0.3 * act, now, 0.06);
      hissBand.filter.frequency.setTargetAtTime(1500 + 2200 * act, now, 0.1);

      const panTarget = 0.7 * clamp(pan, -1, 1);
      rumbleBand.pan.pan.setTargetAtTime(panTarget, now, 0.15);
      hissBand.pan.pan.setTargetAtTime(panTarget, now, 0.15);
    } catch {}
  };

  const close = () => {
    if (ctx) {
      ctx.close().catch(() => {});
      ctx = null;
    }
  };

  return {
    start,
    mute,
    live: isLive,
    pause,
    pop,
    splash,
    plunge,
    drip,
    knock,
    stir,
    close,
    getContextState: () => ctx?.state || 'closed',
  };
};
