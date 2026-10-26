/**
 * Living UI Procedural Sound Engine
 * Reverse engineered from Living UI (living-ui.dev) Web Audio synthesizer
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private dryGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private stirLowGain: GainNode | null = null;
  private stirLowFilter: BiquadFilterNode | null = null;
  private stirLowPan: StereoPannerNode | null = null;
  private stirHighGain: GainNode | null = null;
  private stirHighFilter: BiquadFilterNode | null = null;
  private stirHighPan: StereoPannerNode | null = null;
  private isMuted: boolean = false;
  private lastPop: number = 0;
  private lastDrip: number = 0;
  private lastKnock: number = 0;
  private isInitialized: boolean = false;
  private activeReeds: Map<number, { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode }> = new Map();

  private clamp(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val));
  }

  private rand(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  public async init(): Promise<boolean> {
    if (this.ctx && this.ctx.state === 'running') return true;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 0.85;

        // Dynamics Compressor
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -16;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.004;
        this.compressor.release.value = 0.2;

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        // Dry bus
        this.dryGain = this.ctx.createGain();
        this.dryGain.connect(this.masterGain);

        // Algorithmic Procedural Reverb Impulse Response
        const rate = this.ctx.sampleRate;
        const length = Math.round(1.8 * rate);
        const impulse = this.ctx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
          const data = impulse.getChannelData(ch);
          let prev = 0;
          for (let i = 0; i < length; i++) {
            const t = i / rate;
            prev += (2 * Math.random() - 1 - prev) * (0.5 - 0.42 * Math.min(1, t / 1.2));
            data[i] = prev * Math.exp(-3.4 * t) * (t < 0.012 ? t / 0.012 : 1);
          }
        }
        this.reverbNode = this.ctx.createConvolver();
        this.reverbNode.buffer = impulse;

        const reverbSend = this.ctx.createGain();
        reverbSend.gain.value = 0.28;
        this.dryGain.connect(reverbSend);
        reverbSend.connect(this.reverbNode);
        this.reverbNode.connect(this.masterGain);

        // White Noise Source Buffer (2 seconds)
        this.noiseBuffer = this.ctx.createBuffer(1, Math.round(2 * rate), rate);
        const noiseData = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = 2 * Math.random() - 1;
        }

        // Ambient Continuous Fluid Stir Loop (Low & High bandpass)
        const setupStirBand = (freq: number, q: number) => {
          if (!this.ctx || !this.noiseBuffer || !this.dryGain) return null;
          const source = this.ctx.createBufferSource();
          source.buffer = this.noiseBuffer;
          source.loop = true;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = freq;
          filter.Q.value = q;

          const gain = this.ctx.createGain();
          gain.gain.value = 0;

          const pan = this.ctx.createStereoPanner();

          source.connect(filter).connect(gain).connect(pan).connect(this.dryGain);
          source.start(0, this.rand(0, 1));
          return { gain, filter, pan };
        };

        const low = setupStirBand(320, 0.9);
        if (low) {
          this.stirLowGain = low.gain;
          this.stirLowFilter = low.filter;
          this.stirLowPan = low.pan;
        }

        const high = setupStirBand(1900, 0.7);
        if (high) {
          this.stirHighGain = high.gain;
          this.stirHighFilter = high.filter;
          this.stirHighPan = high.pan;
        }
      }

      if (this.ctx.state !== 'running') {
        await this.ctx.resume();
      }

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn("SoundEngine could not initialize audio:", err);
      return false;
    }
  }

  public isLive(): boolean {
    return !!this.ctx && this.ctx.state === 'running' && !this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.85, now, 0.08);
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, now, 0.08);
    }
  }

  private createPanner(pan: number): StereoPannerNode | null {
    if (!this.ctx) return null;
    const p = this.ctx.createStereoPanner();
    p.pan.value = 0.8 * this.clamp(pan, -1, 1);
    return p;
  }

  /**
   * Synthesize single frequency oscillator with exponential ramp
   */
  private synthOsc(
    startFreq: number,
    endFreq: number,
    freqRampTime: number,
    gainPeak: number,
    duration: number,
    pan: number = 0
  ) {
    if (!this.isLive() || !this.ctx || !this.dryGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + freqRampTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const panner = this.createPanner(pan);
    if (panner) {
      osc.connect(gain).connect(panner).connect(this.dryGain);
    } else {
      osc.connect(gain).connect(this.dryGain);
    }

    osc.start(now);
    osc.stop(now + duration + 0.02);
    osc.onended = () => {
      gain.disconnect();
    };
  }

  /**
   * Synthesize noise burst with filter ramp
   */
  private synthNoise(
    filterType: BiquadFilterType,
    freq: number,
    q: number,
    gainPeak: number,
    attack: number,
    decay: number,
    pan: number = 0
  ) {
    if (!this.isLive() || !this.ctx || !this.noiseBuffer || !this.dryGain) return;
    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = q;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

    const panner = this.createPanner(pan);
    if (panner) {
      source.connect(filter).connect(gain).connect(panner).connect(this.dryGain);
    } else {
      source.connect(filter).connect(gain).connect(this.dryGain);
    }

    source.start(now, this.rand(0, 1.5));
    source.stop(now + attack + decay + 0.02);
    source.onended = () => {
      gain.disconnect();
    };
  }

  // --- Sound Effects ---

  /** Bubble pop sound */
  public pop(size: number = 1, pan: number = 0) {
    if (!this.isLive() || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastPop < 0.03) return;
    this.lastPop = now;

    const f = this.clamp(2400 / (size + 0.8), 320, 2300) * this.rand(0.92, 1.08);
    this.synthOsc(f, f * this.rand(1.35, 1.7), 0.05, this.clamp(0.1 * Math.sqrt(size), 0.045, 0.22), this.rand(0.06, 0.11), pan);
  }

  /** Water splash sound with multiple droplet pops */
  public splash(intensity: number = 0.5, pan: number = 0) {
    if (!this.isLive() || !this.ctx) return;
    const norm = this.clamp(intensity, 0, 1);

    // Bandpass noise burst
    this.synthNoise('bandpass', 2200, 0.6, 0.9 * norm + 0.1, 0.008, 0.38 + 0.3 * norm, pan);
    // Lowpass rumble
    this.synthNoise('lowpass', 520, 0.7, 1.3 * norm + 0.1, 0.01, 0.24, pan);
    // Sub drop
    this.synthOsc(180, 70, 0.2, 0.3 * norm + 0.03, 0.26, pan);

    // Random droplets
    const droplets = Math.round(3 + 8 * norm);
    for (let i = 0; i < droplets; i++) {
      setTimeout(() => {
        const df = this.rand(380, 1400);
        this.synthOsc(df, df * this.rand(1.3, 1.8), 0.06, this.rand(0.04, 0.1), this.rand(0.06, 0.12), pan + this.rand(-0.2, 0.2));
      }, (0.05 + Math.random() * 0.4) * 1000);
    }
  }

  /** Deep plunge into water */
  public plunge(depth: number = 0.6, pan: number = 0) {
    if (!this.isLive() || !this.ctx) return;
    const norm = this.clamp(depth, 0, 1);
    this.synthNoise('highpass', 900, 0.7, 0.55 * norm + 0.06, 0.002, 0.05, pan);
    this.synthNoise('lowpass', 280, 0.8, 0.45 * norm + 0.04, 0.003, 0.07, pan);
    this.synthNoise('bandpass', 3400, 0.8, 0.32 * norm + 0.04, 0.02, 0.35 + 0.3 * norm, pan);
    this.synthOsc(220, 80, 0.18, 0.24 * norm + 0.05, 0.2, pan);
  }

  /** Water droplet */
  public drip(size: number = 1, pan: number = 0) {
    if (!this.isLive() || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastDrip < 0.045) return;
    this.lastDrip = now;

    const base = this.clamp(3600 / Math.sqrt(size + 0.5), 1200, 4200) * this.rand(0.9, 1.1);
    this.synthOsc(0.7 * base, base, 0.025, 0.085, 0.05, pan);
  }

  /** Tactile surface or button tap knock */
  public knock(force: number = 0.5, pan: number = 0, damp: boolean = false) {
    if (!this.isLive() || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastKnock < 0.05) return;
    this.lastKnock = now;

    const harmonics = [
      [612, 0.2, 0.32],
      [1490, 0.12, 0.2],
      [2730, 0.07, 0.12],
      [4310, 0.035, 0.07],
    ];

    harmonics.forEach(([f, peak, dur]) => {
      const freq = f * this.rand(0.98, 1.02);
      this.synthOsc(freq, freq * 0.995, dur, peak * force + 0.004, dur * (damp ? 0.5 : 1), pan);
    });

    this.synthNoise('highpass', 1800, 0.7, 0.35 * force + 0.01, 0.001, 0.012, pan);
    this.synthOsc(140, 85, 0.08, 0.24 * force + 0.02, 0.12, pan);
  }

  /** Fluid continuous stirring */
  public stir(speed: number, intensity: number, pan: number = 0) {
    if (!this.ctx || this.ctx.state !== 'running' || !this.stirLowGain || !this.stirHighGain) return;
    const now = this.ctx.currentTime;
    const s = this.clamp(speed, 0, 1);
    const it = this.clamp(intensity, 0, 1);

    this.stirLowGain.gain.setTargetAtTime(1.2 * Math.pow(s, 1.2), now, 0.09);
    this.stirLowFilter?.frequency.setTargetAtTime(240 + 520 * s, now, 0.12);

    this.stirHighGain.gain.setTargetAtTime(0.22 * Math.pow(s, 1.4) + 0.3 * it, now, 0.06);
    this.stirHighFilter?.frequency.setTargetAtTime(1500 + 2200 * it, now, 0.1);

    const clampedPan = 0.7 * this.clamp(pan, -1, 1);
    this.stirLowPan?.pan.setTargetAtTime(clampedPan, now, 0.15);
    this.stirHighPan?.pan.setTargetAtTime(clampedPan, now, 0.15);
  }

  // --- Accordion Synthesizer ---

  public accordionReed(index: number, freq: number, active: boolean) {
    if (!this.ctx || !this.dryGain) return;
    const now = this.ctx.currentTime;

    if (active) {
      if (this.activeReeds.has(index)) return;

      // Realistic dual-reed accordion tone (Fundamental + Detuned Octave with tremolo)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.002, now); // slight chorus / musette detune

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 850;
      filter.Q.value = 1.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.dryGain);

      osc1.start(now);
      osc2.start(now);

      this.activeReeds.set(index, { osc1, osc2, gain });
    } else {
      const reed = this.activeReeds.get(index);
      if (reed) {
        reed.gain.gain.setValueAtTime(reed.gain.gain.value, now);
        reed.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        reed.osc1.stop(now + 0.08);
        reed.osc2.stop(now + 0.08);
        this.activeReeds.delete(index);
      }
    }
  }

  public accordionBreathe(movement: number) {
    if (!this.isLive() || !this.ctx) return;
    const norm = this.clamp(movement / 50, 0, 1);
    this.synthNoise('bandpass', 450 + 600 * norm, 1.2, 0.06 * norm, 0.04, 0.12, 0);
  }
}

export const sound = new SoundEngine();
