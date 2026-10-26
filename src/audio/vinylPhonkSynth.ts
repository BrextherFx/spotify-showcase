// Procedural Web Audio Phonk Synthesizer for "Soft Static" (Living UI)

export interface TokenItem {
  text: string;
  note: string;
  start: number;
  end: number;
}

export interface EchoItem {
  text: string;
  note: string;
  start: number;
  end: number;
}

export interface LyricRow {
  label: string;
  tokens: TokenItem[];
  echo: EchoItem[];
  start: number;
}

export interface PhraseDef {
  words: { syllables: { text: string; note: string; at: number; length: number }[] }[];
  at: number;
  end: number;
  pause?: boolean;
  echo?: {
    text: string;
    notes: { note: string; at: number; length: number }[];
  };
}

export const NOTE_HUES: Record<string, [number, number, number]> = {
  c: [255, 102, 112],
  d: [247, 197, 72],
  eb: [255, 143, 212],
  f: [180, 123, 255],
  g: [125, 112, 255],
  ab: [63, 230, 238],
  bb: [72, 227, 92],
  db: [255, 150, 84],
  gb: [92, 182, 255],
};

const NOTE_NAMES = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];

export function noteToFreq(noteStr: string): number {
  const m = noteStr.match(/^([a-g][#b]?)(-?\d)$/);
  if (!m) return 440;
  const [, name, oct] = m;
  const semitones = NOTE_NAMES.indexOf(name) + (Number(oct) + 1) * 12 - 69;
  return 440 * Math.pow(2, semitones / 12);
}

function transpose(noteStr: string, semi: number): string {
  const m = noteStr.match(/^([a-g]b?)(-?\d)$/);
  if (!m) return noteStr;
  const [, name, oct] = m;
  const idx = NOTE_NAMES.indexOf(name) + (Number(oct) + 1) * 12 + semi;
  return `${NOTE_NAMES[((idx % 12) + 12) % 12]}${Math.floor(idx / 12) - 1}`;
}

const CHORD_TABLE: Record<string, { root: string; piano: (string | string[])[]; pad: string[] }> = {
  cm: { root: 'c2', piano: ['c3', ['eb3', 'g3'], 'bb3', ['d4', 'g4']], pad: ['g3', 'c4', 'eb4', 'bb4'] },
  eb: { root: 'eb2', piano: ['eb3', ['g3', 'bb3'], 'd4', ['f4', 'bb4']], pad: ['g3', 'bb3', 'd4', 'eb4'] },
  bb: { root: 'bb1', piano: ['bb2', ['d3', 'f3'], 'bb3', ['d4', 'f4']], pad: ['f3', 'bb3', 'd4', 'f4'] },
  ab: { root: 'ab1', piano: ['ab2', ['c3', 'eb3'], 'g3', ['c4', 'eb4']], pad: ['eb3', 'ab3', 'c4', 'g4'] },
};

const CHORD_PROGRESSION = ['cm', 'eb', 'bb', 'ab', 'bb', 'cm', 'bb', 'cm'].map((k) => CHORD_TABLE[k]);

export function buildPhonkSong(transposeSemi = 0, extraTime = 0.6) {
  const shift = (n: string) => transpose(n, transposeSemi);
  const shiftList = <T extends { note: string }>(arr: T[]): T[] =>
    arr.map((item) => ({ ...item, note: shift(item.note) }));

  const makePhrase = (
    startBeat: number,
    wordDefs: [string, string, string?][],
    echoDef?: { text: string; notes: { note: string; at: number; length: number }[] }
  ): PhraseDef => {
    let cur = startBeat;
    const words = wordDefs.map(([text, notes, lens]) => {
      const sylTexts = text.split('|');
      const sylNotes = notes.split('|');
      const sylLens = lens?.split('|').map(Number) ?? [];
      return {
        syllables: sylTexts.map((txt, sIdx) => {
          const item = {
            text: txt,
            note: shift(sylNotes[sIdx] ?? sylNotes[0]),
            at: cur,
            length: sylLens[sIdx] ?? 1,
          };
          cur += item.length;
          return item;
        }),
      };
    });

    return {
      words,
      at: startBeat,
      end: cur,
      echo: echoDef && {
        ...echoDef,
        notes: echoDef.notes.map((e) => ({ ...e, note: shift(e.note) })),
      },
    };
  };

  const rightPhrase = (at: number, echo?: any): PhraseDef =>
    makePhrase(at, [["You're", 'eb5'], ['ab|so|lute|ly', 'eb5|f5|g5|f5'], ['right', 'eb5', '3']], echo);

  const lyrics: PhraseDef[] = [
    makePhrase(0, [
      ['I', 'g4'],
      ['said', 'g4'],
      ['make', 'bb4'],
      ['the', 'c5'],
      ['lo|go', 'eb5|d5'],
      ['big|ger', 'c5|bb4'],
    ]),
    makePhrase(8, [
      ['It', 'c5'],
      ['made', 'c5'],
      ['the', 'bb4'],
      ['lo|go', 'c5|eb5'],
      ['the', 'd5'],
      ['whole', 'c5'],
      ['site', 'g4', '3'],
    ]),
    { words: [], at: 18, end: 24, pause: true },
    rightPhrase(24, {
      text: 'so right',
      notes: [
        { note: 'c5', at: 30, length: 1 },
        { note: 'bb4', at: 31, length: 2 },
      ],
    }),
    makePhrase(32, [
      ['Let', 'c5'],
      ['me', 'c5'],
      ['fix', 'd5'],
      ['that', 'eb5'],
      ['for', 'd5'],
      ['you', 'c5', '3'],
    ]),
    rightPhrase(40, {
      text: 'oh no',
      notes: [
        { note: 'g4', at: 46, length: 1 },
        { note: 'f4', at: 47, length: 3 },
      ],
    }),
    makePhrase(48, [
      ['I', 'g4'],
      ['de|le|ted', 'bb4|c5|d5'],
      ['Fig|ma', 'eb5|d5'],
      ['too', 'c5', '10'],
    ]),
  ];

  const melody = lyrics.flatMap((line) =>
    (line.words || []).flatMap((word) =>
      word.syllables.map((syl) => ({ ...syl, chorus: line.at >= 24 }))
    )
  );

  // Kicks
  const range = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => from + i);
  const kicks = range(2, 7)
    .flatMap((e) => [
      { at: 8 * e, velocity: 120 },
      { at: 8 * e + 6, velocity: 110 * (2 !== e ? 1 : 0) },
      ...(4 === e || 6 === e ? [{ at: 8 * e + 7.5, velocity: 90 }] : []),
    ])
    .concat([{ at: 56, velocity: 120 }])
    .filter((k) => k.velocity > 0);

  // Hi-Hats
  const hats = range(1, 7).flatMap((e) => {
    const base = range(0, 8).map((t) => ({ at: 8 * e + t, velocity: t % 2 ? 62 : 84 }));
    if (e < 3) return base;
    const rolls =
      e % 2
        ? [6, 6.25, 6.5, 6.75, 7, 7.125, 7.25, 7.375, 7.5, 7.625, 7.75, 7.875]
        : [3, 3.25, 3.5, 3.75, 7, 7.25, 7.5, 7.75];
    return base
      .filter((t) => !rolls.some((r) => Math.floor(r) === t.at - 8 * e))
      .concat(rolls.map((t) => ({ at: 8 * e + t, velocity: 58 + Math.round((t % 1) * 30) })));
  });

  // Snares
  const snares = range(1, 7)
    .flatMap((e) => [{ at: 8 * e + 4, velocity: e < 3 ? 70 : 112 }])
    .concat([6, 6.5, 7, 7.25, 7.5, 7.75].map((e, idx) => ({ at: 16 + e, velocity: 60 + 9 * idx })));

  // Rims
  const rims = range(1, 3).flatMap((e) => [2, 6].map((t) => ({ at: 8 * e + t, velocity: 76 })));

  // Sparkle lead
  const sparkle = shiftList([
    { note: 'c6', at: 18, length: 1 },
    { note: 'g5', at: 19, length: 1 },
    { note: 'eb6', at: 20, length: 1 },
    { note: 'd6', at: 21, length: 1 },
    { note: 'bb5', at: 22, length: 1 },
    { note: 'g5', at: 22.5, length: 1 },
    { note: 'f5', at: 23, length: 1 },
    { note: 'd5', at: 23.5, length: 1 },
  ]);

  // Soprano counter-melody
  const soprano = shiftList([
    { note: 'c6', at: 24, length: 8 },
    { note: 'bb5', at: 32, length: 8 },
    { note: 'g5', at: 40, length: 8 },
    { note: 'f5', at: 48, length: 6 },
    { note: 'g5', at: 54, length: 10 },
  ]);

  // Chords
  const chords = CHORD_PROGRESSION.map((ch, idx) => ({
    root: shift(ch.root),
    piano: ch.piano.map((p) => (Array.isArray(p) ? p.map(shift) : shift(p))),
    pad: ch.pad.map(shift),
    at: 8 * idx,
    length: 8,
  }));

  return {
    lead: 0,
    span: 64,
    length: 16 + extraTime,
    lyrics,
    melody,
    echoes: lyrics.flatMap((line) => line.echo?.notes ?? []),
    chords,
    intro: [],
    ending: ['c3', 'g3', 'eb4', 'g4', 'd5'].map(shift),
    kicks,
    hats,
    snares,
    rims,
    sparkle,
    soprano,
  };
}

// Exactly match Living UI el(song) with 0.25x scaling for seconds
export function buildLyricRows(song: ReturnType<typeof buildPhonkSong>): LyricRow[] {
  const formatSparkleNotes = (arr: { note: string; at: number }[]) => {
    const map = new Map<number, { note: string; at: number }[]>();
    arr.forEach((item) => {
      const beat = Math.floor(item.at);
      map.set(beat, [...(map.get(beat) ?? []), item]);
    });
    return [...map.values()].flatMap((group) =>
      group.map((item, idx) => ({
        text: `${group.length > 1 && idx === 0 ? '[' : ''}${item.note}${
          group.length > 1 && idx === group.length - 1 ? ']' : ''
        }`,
        note: item.note,
        start: 0.25 * item.at,
        end: 0.25 * (item.at + (group.length > 1 ? 0.5 : 1)),
      }))
    );
  };

  return song.lyrics.map((line, lIdx) => {
    const isOutro = lIdx === song.lyrics.length - 1;
    const isHook = line.at - song.lead >= 24;
    const label = line.pause ? 'drop' : isOutro ? 'outro' : isHook ? 'hook' : 'verse';

    const tokens: TokenItem[] = line.pause
      ? formatSparkleNotes(song.sparkle)
      : (line.words || []).flatMap((word) =>
          word.syllables.flatMap((syl, sIdx) => {
            const multi = word.syllables.length > 1;
            const mainTok: TokenItem = {
              text: `${multi && sIdx === 0 ? '[' : ''}${syl.note}${
                multi && sIdx === word.syllables.length - 1 ? ']' : ''
              }`,
              note: syl.note,
              start: 0.25 * syl.at,
              end: 0.25 * (syl.at + 1),
            };
            const remainder = syl.length - 1;
            const subs = Math.min(remainder, 3);
            const subToks: TokenItem[] = Array.from({ length: subs }, (_, a) => ({
              text: '_',
              note: syl.note,
              start: 0.25 * (syl.at + 1 + (remainder * a) / subs),
              end: 0.25 * (syl.at + 1 + (remainder * (a + 1)) / subs),
            }));
            return [mainTok, ...subToks];
          })
        );

    const echo: EchoItem[] = (line.echo?.notes ?? []).map((e, idx, arr) => ({
      text: `${idx === 0 ? '[' : ''}${e.note}${idx === arr.length - 1 ? ']' : ''}`,
      note: e.note,
      start: 0.25 * e.at,
      end: 0.25 * (e.at + e.length),
    }));

    return {
      label,
      tokens,
      echo,
      start: 0.25 * (line.pause ? song.sparkle[0]?.at ?? line.at : line.at),
    };
  });
}

// Wave shaper for warm distortion
function createWaveShaper(ctx: BaseAudioContext, amount: number): WaveShaperNode {
  const shaper = ctx.createWaveShaper();
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  shaper.curve = curve;
  shaper.oversample = '2x';
  return shaper;
}

// Soundfont loader
async function loadSoundfontMap(
  ctx: BaseAudioContext,
  url: string,
  notes: string[]
): Promise<Map<string, AudioBuffer>> {
  const map = new Map<string, AudioBuffer>();
  try {
    const text = await fetch(url).then((r) => r.text());
    const unique = [...new Set(notes)];
    await Promise.all(
      unique.map(async (n) => {
        const key = `"${n.charAt(0).toUpperCase() + n.slice(1)}": "data:audio/ogg;base64,`;
        const idx = text.indexOf(key);
        if (idx < 0) return;
        const start = idx + key.length;
        const end = text.indexOf('"', start);
        const b64 = text.slice(start, end);
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const buf = await ctx.decodeAudioData(bytes.buffer.slice(0));
        map.set(n, buf);
      })
    );
  } catch (err) {
    console.warn('Soundfont load fallback:', err);
  }
  return map;
}

// Offline Audio Synth
export async function renderPhonkTrack(
  sampleRate = 44100
): Promise<{ buffer: AudioBuffer; reversedBuffer: AudioBuffer; duration: number }> {
  const song = buildPhonkSong(0, 0.6);
  const totalLengthSeconds = song.length;
  const totalFrames = Math.ceil(sampleRate * totalLengthSeconds);

  const actx = new OfflineAudioContext(2, totalFrames, sampleRate);

  // PRNG
  let seed = 7;
  const rand = () => {
    seed = (1664525 * seed + 0x3c6ef35f) % 0x100000000;
    return seed / 0x100000000;
  };

  // Master bus
  const master = actx.createGain();
  master.gain.value = 0.38;
  master.gain.setValueAtTime(0.38, totalLengthSeconds - 0.35);
  master.gain.linearRampToValueAtTime(0, totalLengthSeconds);

  // Dynamics compressor
  const comp = actx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 3;
  comp.attack.value = 0.006;
  comp.release.value = 0.2;
  master.connect(comp).connect(actx.destination);

  // Algorithmic convolution reverb
  const convLen = Math.floor(3.2 * sampleRate);
  const convBuf = actx.createBuffer(2, convLen, sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = convBuf.getChannelData(c);
    for (let i = 0; i < convLen; i++) {
      data[i] = (2 * rand() - 1) * Math.pow(1 - i / convLen, 2.6);
    }
  }
  const conv = actx.createConvolver();
  conv.buffer = convBuf;
  const convGain = actx.createGain();
  convGain.gain.value = 0.22;
  conv.connect(convGain).connect(master);

  // Sub buses
  const createSubBus = (directLevel: number, reverbLevel: number) => {
    const dry = actx.createGain();
    dry.gain.value = directLevel;
    dry.connect(master);
    const wet = actx.createGain();
    wet.gain.value = reverbLevel;
    dry.connect(wet).connect(conv);
    return dry;
  };

  const noiseBuf = actx.createBuffer(1, Math.floor(2 * sampleRate), sampleRate);
  const nData = noiseBuf.getChannelData(0);
  for (let i = 0; i < nData.length; i++) nData[i] = 2 * rand() - 1;

  const playBurst = (
    bus: AudioNode,
    t: number,
    gain: number,
    decay: number,
    filterType: BiquadFilterType,
    freq: number,
    q = 0.8
  ) => {
    const src = actx.createBufferSource();
    src.buffer = noiseBuf;
    const filter = actx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gNode = actx.createGain();
    gNode.gain.setValueAtTime(1e-4, t);
    gNode.gain.exponentialRampToValueAtTime(Math.max(2e-4, gain), t + 0.001);
    gNode.gain.setValueAtTime(Math.max(2e-4, gain), t + 0.001);
    gNode.gain.exponentialRampToValueAtTime(1e-4, t + 0.001 + decay);
    src.connect(filter).connect(gNode).connect(bus);
    src.start(t, 1.5 * rand(), decay + 0.05);
  };

  const playTone = (
    type: OscillatorType,
    freq: number,
    startTime: number,
    stopTime: number,
    dest: AudioNode,
    detune = 0
  ) => {
    const osc = actx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(dest);
    osc.start(startTime);
    osc.stop(stopTime);
    return osc;
  };

  // 1. Voice soundfont & Formant Vocal Synth
  const noteUpOct = (n: string) => n.replace(/(-?\d)$/, (m) => String(Number(m) + 1));
  const choirNotes = [
    ...song.chords.flatMap((ch) => ch.pad.map(noteUpOct)),
    ...song.soprano.map((s) => s.note),
  ];
  const sfMap = await loadSoundfontMap(actx, '/concepts/spotify-lyrics/sf/choir_aahs-ogg.js', choirNotes);

  const voiceBus = createSubBus(7.5, 0.65);
  const voiceDucking = actx.createGain();
  const leadEnd = song.lead + 48;
  voiceDucking.gain.setValueAtTime(1, (song.lead + 41) * 0.25);
  voiceDucking.gain.linearRampToValueAtTime(0, 0.25 * leadEnd);
  voiceDucking.connect(voiceBus);

  const kickDucking = actx.createGain();
  kickDucking.connect(voiceDucking);
  song.kicks.forEach((k) => {
    const t = 0.25 * k.at;
    kickDucking.gain.setValueAtTime(1, Math.max(0, t - 0.004));
    kickDucking.gain.linearRampToValueAtTime(0.3, t + 0.02);
    kickDucking.gain.linearRampToValueAtTime(1, t + 0.3);
  });

  const playVoiceSample = (
    noteName: string,
    startTime: number,
    length: number,
    velocity: number,
    dest: AudioNode,
    release = 0.3,
    attack = 0.01
  ) => {
    const buf = sfMap.get(noteName);
    if (buf) {
      const src = actx.createBufferSource();
      src.buffer = buf;
      const g = actx.createGain();
      const peak = Math.pow(velocity / 127, 1.6);
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(peak, startTime + attack);
      g.gain.setValueAtTime(peak, startTime + Math.max(attack, length));
      g.gain.exponentialRampToValueAtTime(1e-4, startTime + Math.max(attack, length) + release);
      src.connect(g).connect(dest);
      src.start(startTime);
      src.stop(startTime + Math.max(attack, length) + release + 0.05);
    } else {
      // Vocal Formant Fallback
      const freq = noteToFreq(noteName);
      const osc1 = actx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = freq;

      const osc2 = actx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = freq;
      osc2.detune.value = 6;

      const formant = actx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.value = 850;
      formant.Q.value = 2.2;

      const g = actx.createGain();
      const peak = 0.45 * Math.pow(velocity / 127, 1.6);
      g.gain.setValueAtTime(1e-4, startTime);
      g.gain.linearRampToValueAtTime(peak, startTime + attack);
      g.gain.setValueAtTime(peak, startTime + Math.max(attack, length));
      g.gain.exponentialRampToValueAtTime(1e-4, startTime + Math.max(attack, length) + release);

      osc1.connect(formant);
      osc2.connect(formant);
      formant.connect(g).connect(dest);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + Math.max(attack, length) + release + 0.05);
      osc2.stop(startTime + Math.max(attack, length) + release + 0.05);
    }
  };

  // 2. Lead Phonk Synth & Singing Voice
  const bellsBus = createSubBus(0.75, 0.28);
  const delay = actx.createDelay(1);
  delay.delayTime.value = 0.75;
  const delayFeedback = actx.createGain();
  delayFeedback.gain.value = 0.28;
  const delayOut = actx.createGain();
  delayOut.gain.value = 0.26;
  bellsBus.connect(delay).connect(delayFeedback).connect(delay);
  delay.connect(delayOut).connect(master);

  const bellShaper = createWaveShaper(actx, 2.2);
  bellShaper.connect(bellsBus);

  // Play each note with bells synth + voice formant layer
  const playLeadVoice = (noteName: string, startTime: number, length: number, gainLevel: number) => {
    const freq = noteToFreq(noteName);

    // Bells component
    const g = actx.createGain();
    g.gain.setValueAtTime(1e-4, startTime);
    g.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.002);
    g.gain.exponentialRampToValueAtTime(0.32 * gainLevel, startTime + 0.05);
    g.gain.exponentialRampToValueAtTime(1e-4, startTime + Math.min(0.55, length + 0.18));

    const bp = actx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2.1 * freq;
    bp.Q.value = 1.1;

    const hp = actx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 320;

    bp.connect(hp).connect(g).connect(bellShaper);
    [1, 1.4836].forEach((mult) => playTone('square', freq * mult, startTime, startTime + 0.7, bp));

    // Vocal Singing Formant component (sings every syllable clearly!)
    const voxG = actx.createGain();
    voxG.gain.setValueAtTime(1e-4, startTime);
    voxG.gain.exponentialRampToValueAtTime(0.35 * gainLevel, startTime + 0.01);
    voxG.gain.setValueAtTime(0.35 * gainLevel, startTime + Math.max(0.02, length));
    voxG.gain.exponentialRampToValueAtTime(1e-4, startTime + Math.max(0.02, length) + 0.15);

    const voxFilter = actx.createBiquadFilter();
    voxFilter.type = 'bandpass';
    voxFilter.frequency.value = freq < 400 ? 750 : 1200;
    voxFilter.Q.value = 3.5;

    const voxOsc = actx.createOscillator();
    voxOsc.type = 'sawtooth';
    voxOsc.frequency.setValueAtTime(freq, startTime);
    voxOsc.connect(voxFilter).connect(voxG).connect(voiceBus);
    voxOsc.start(startTime);
    voxOsc.stop(startTime + length + 0.2);
  };

  // Play vocal melody exactly at 0.25 * at
  song.melody.forEach((m) => playLeadVoice(m.note, 0.25 * m.at, 0.25 * m.length, 0.55));
  song.echoes.forEach((e) => playLeadVoice(e.note, 0.25 * e.at, 0.25 * e.length, 0.35));
  song.sparkle.forEach((s) => playLeadVoice(s.note, 0.25 * s.at, 0.25, 0.35));

  // Voice Pads & Soprano
  const chorusStart = song.lead + 24;
  song.chords.forEach((chord) => {
    const at = chord.at;
    if (at < chorusStart || at >= leadEnd) return;
    chord.pad.forEach((p) =>
      playVoiceSample(noteUpOct(p), 0.25 * at, 0.25 * chord.length, 90, kickDucking, 0.4, 0.06)
    );
    [3, 7].forEach((off) =>
      chord.pad
        .slice(1)
        .forEach((p) =>
          playVoiceSample(noteUpOct(p), (at + off) * 0.25, 0.16, 96, kickDucking, 0.12, 0.01)
        )
    );
  });

  song.soprano
    .filter((s) => s.at < leadEnd)
    .forEach((s) =>
      playVoiceSample(s.note, 0.25 * s.at, 0.25 * s.length, 98, kickDucking, 0.65, 0.1)
    );

  // 3. Drums (Kicks, Snares, Hats)
  const drumBus = createSubBus(0.9, 0.05);
  const drumShaper = createWaveShaper(actx, 3);
  drumShaper.connect(drumBus);

  const playHat = (t: number, gainLevel: number, roll = false) => {
    playBurst(drumBus, t, gainLevel, roll ? 0.22 : 0.04, 'highpass', roll ? 5200 : 6200);
  };

  // Kicks
  song.kicks.forEach((k) => {
    const t = 0.25 * k.at;
    if (k.at < chorusStart) {
      const g = actx.createGain();
      g.gain.setValueAtTime(1e-4, t);
      g.gain.exponentialRampToValueAtTime(k.velocity / 127, t + 0.002);
      g.gain.setValueAtTime(k.velocity / 127, t + 0.002);
      g.gain.exponentialRampToValueAtTime(1e-4, t + 0.002 + 0.28);
      g.connect(drumBus);

      const osc = actx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(44, t + 0.09);
      osc.connect(g);
      osc.start(t);
      osc.stop(t + 0.35);
    } else {
      // Phonk Heavy 808
      const vel = Math.min(1, k.velocity / 110);
      const g = actx.createGain();
      g.gain.setValueAtTime(1e-4, t);
      g.gain.exponentialRampToValueAtTime(vel, t + 0.001);
      g.gain.setValueAtTime(vel, t + 0.001);
      g.gain.exponentialRampToValueAtTime(1e-4, t + 0.001 + 0.32);
      g.connect(drumShaper);

      const osc = actx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(170, t);
      osc.frequency.exponentialRampToValueAtTime(48, t + 0.07);
      osc.connect(g);
      osc.start(t);
      osc.stop(t + 0.4);

      playBurst(drumShaper, t, 0.4 * vel, 0.012, 'highpass', 3000);
    }
  });

  // Snares
  song.snares.forEach((s) => {
    const t = 0.25 * s.at;
    const vel = (s.velocity / 127) * (s.at % 1 === 0 && s.at >= song.lead + 12 ? 0.9 : 0.5);
    [0, 0.011, 0.023].forEach((off, idx) => {
      playBurst(
        drumBus,
        t + off,
        vel * (idx === 2 ? 1 : 0.6),
        idx === 2 ? 0.2 : 0.012,
        'bandpass',
        1500,
        1.4
      );
    });
    playBurst(drumBus, t, 0.6 * vel, 0.12, 'highpass', 3500);
  });

  // Hats
  song.hats.forEach((h) => playHat(0.25 * h.at, (h.velocity / 127) * 0.6));
  song.hats
    .filter(
      (h) =>
        h.at >= song.lead + 24 &&
        h.at < song.lead + 56 &&
        [3, 7].includes((h.at - song.lead) % 8)
    )
    .forEach((h) => playHat(0.25 * h.at, 0.24, true));

  // 4. Strings (Sawtooth chords)
  const stringsBus = createSubBus(1.6, 0.75);
  const stringsFilter = actx.createBiquadFilter();
  stringsFilter.type = 'lowpass';
  stringsFilter.frequency.value = 2200;
  stringsFilter.connect(stringsBus);

  song.chords
    .filter((ch) => ch.at >= song.lead + 16)
    .forEach((chord) => {
      const at = 0.25 * chord.at;
      const dur = 0.25 * chord.length;
      chord.pad.forEach((p) => {
        const g = actx.createGain();
        const peak = chord.at < chorusStart ? 0.045 : 0.026;
        g.gain.setValueAtTime(1e-4, at);
        g.gain.exponentialRampToValueAtTime(peak, at + 0.5);
        g.gain.setValueAtTime(peak, at + dur);
        g.gain.exponentialRampToValueAtTime(1e-4, at + dur + 0.7);
        g.connect(stringsFilter);
        [-9, 9].forEach((detune) =>
          playTone('sawtooth', noteToFreq(p), at, at + dur + 0.8, g, detune)
        );
      });
    });

  const buffer = await actx.startRendering();

  // Create reversed buffer for scratches / rewind
  const reversedBuffer = actx.createBuffer(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const fwd = buffer.getChannelData(c);
    const rev = reversedBuffer.getChannelData(c);
    for (let i = 0; i < buffer.length; i++) {
      rev[i] = fwd[buffer.length - 1 - i];
    }
  }

  return {
    buffer,
    reversedBuffer,
    duration: totalLengthSeconds,
  };
}
