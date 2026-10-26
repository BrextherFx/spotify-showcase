import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { WaitlistModal } from '../components/WaitlistModal';
import { McpModal } from '../components/mcp/McpModal';
import { Artboard } from '../components/Artboard';
import {
  buildPhonkSong,
  buildLyricRows,
  renderPhonkTrack,
  NOTE_HUES,
  LyricRow,
} from '../audio/vinylPhonkSynth';

const CLAUDE_LOGO_PATH =
  'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z';

// WebGL Shaders
const VERT_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG_SHADER = `
precision highp float;
uniform vec2 res;
uniform vec4 area;
uniform float radius;
uniform float label;
uniform float angle;
uniform float time;
uniform float pulse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amp * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  return value;
}

vec3 marble(vec2 q, float t) {
  vec2 m = q / radius * 1.0;
  float twist = length(m) * 1.6;
  m = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * m;
  vec2 w = vec2(fbm(m * 1.2 + vec2(0.0, t)), fbm(m * 1.2 + vec2(5.2, 1.3) - t));
  vec2 v = vec2(fbm(m + 2.4 * w + vec2(1.7, 9.2)), fbm(m + 2.4 * w + vec2(8.3, 2.8)));
  float f = fbm(m + 2.6 * v);

  vec3 plum = vec3(0.5, 0.2, 0.44);
  vec3 rose = vec3(0.74, 0.4, 0.64);
  vec3 berry = vec3(0.62, 0.08, 0.36);
  vec3 violet = vec3(0.3, 0.13, 0.48);
  vec3 magenta = vec3(0.95, 0.2, 0.56);
  vec3 orange = vec3(1.0, 0.5, 0.18);
  vec3 navy = vec3(0.1, 0.12, 0.4);
  vec3 sky = vec3(0.12, 0.17, 0.58);

  vec3 color = mix(plum, rose, smoothstep(0.35, 0.65, w.x) * 0.8);
  color = mix(color, violet, smoothstep(0.56, 0.72, v.y) * 0.4);
  color = mix(color, berry, smoothstep(0.52, 0.72, w.y) * 0.55);
  color = mix(color, navy, smoothstep(0.32, 0.25, f) * 0.6);
  color = mix(color, sky, smoothstep(0.07, 0.0, abs(fract(f * 2.4 + w.y * 1.6) - 0.5)) * 0.8);
  color = mix(color, magenta, smoothstep(0.15, 0.02, abs(f - 0.45)) * 0.9);
  color = mix(color, orange, smoothstep(0.1, 0.015, abs(f - 0.57)) * 0.95);
  color = mix(color, violet, smoothstep(0.05, 0.0, abs(v.x - 0.5)) * 0.5);
  return color;
}

void blob(vec2 at, vec2 center, vec3 tint, float size, inout vec3 sum, inout float total) {
  vec2 d = at - center;
  float weight = exp(-dot(d, d) / size);
  sum += tint * weight;
  total += weight;
}

vec3 core(vec2 q, float time) {
  vec2 p = q / label;
  float t = time * 0.35;
  vec2 at = p + 0.5 * vec2(fbm(p * 1.1 + vec2(t * 0.4, 0.0)) - 0.5, fbm(p * 1.1 + vec2(3.1, -t * 0.4)) - 0.5);
  vec3 sum = vec3(0.94, 0.56, 0.76) * 0.06;
  float total = 0.06;
  blob(at, 0.75 * vec2(sin(t * 0.7), cos(t * 0.5)), vec3(1.0, 0.86, 0.92), 0.06, sum, total);
  blob(at, 0.8 * vec2(cos(t * 0.6 + 2.0), sin(t * 0.8 + 1.0)), vec3(1.0, 0.68, 0.45), 0.09, sum, total);
  blob(at, 0.75 * vec2(sin(t * 0.5 + 4.0), cos(t * 0.65 + 3.0)), vec3(0.78, 0.62, 0.96), 0.12, sum, total);
  blob(at, 0.8 * vec2(cos(t * 0.75 + 5.0), sin(t * 0.55 + 2.5)), vec3(0.98, 0.46, 0.7), 0.11, sum, total);
  blob(at, 0.65 * vec2(sin(t * 0.85 + 1.5), cos(t * 0.7 + 5.5)), vec3(0.96, 0.58, 0.8), 0.1, sum, total);
  blob(at, 0.7 * vec2(sin(t * 0.55 + 2.7), cos(t * 0.9 + 0.4)), vec3(0.5, 0.56, 0.98), 0.05, sum, total);
  return sum / total;
}

void main() {
  vec2 frag = gl_FragCoord.xy / res;
  vec2 p = vec2(area.x + frag.x * area.z, area.y + (1.0 - frag.y) * area.w);
  float r = length(p);
  float px = area.z / res.x;
  float body = 1.0 - smoothstep(radius - px, radius + px, r);
  if (body <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float c = cos(angle);
  float s = sin(angle);
  vec2 q = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
  float theta = atan(p.y, p.x);
  vec3 color;

  if (r > label + 8.0) {
    color = marble(q, time * 0.03);
    float groove = sin(r * 2.3) * 0.5 + 0.5;
    float band = hash(vec2(floor(r / 2.7), 3.0));
    float grooved = smoothstep(label + 16.0, label + 22.0, r) * (1.0 - smoothstep(radius - 12.0, radius - 7.0, r));
    float gaps = 0.0;
    for (int i = 0; i < 4; i++) {
      float at = radius * (0.5 + float(i) * 0.128);
      gaps += exp(-pow((r - at) / 2.2, 2.0));
    }
    grooved *= 1.0 - gaps * 0.8;
    color *= 1.0 - grooved * (0.16 * groove + 0.1 * band);
    float wedge = pow(abs(cos(theta + 0.78)), 70.0) * 0.36 + pow(abs(cos(theta - 0.92)), 90.0) * 0.2;
    float haze = pow(abs(cos(theta + 0.78)), 5.0) * 0.07 + pow(abs(cos(theta - 0.92)), 6.0) * 0.04;
    float glint = (wedge + haze) * (0.45 + 0.55 * groove * band + 0.3 * band) * max(grooved, 0.35);
    color += vec3(1.0, 0.94, 0.97) * glint;
    color += vec3(1.0, 0.55, 0.45) * pow(abs(cos(theta + 0.66)), 140.0) * 0.06 * grooved;
    color += vec3(0.55, 0.75, 1.0) * pow(abs(cos(theta + 0.9)), 140.0) * 0.06 * grooved;
    color += vec3(1.0) * gaps * 0.05;
    color *= 1.0 + pulse * 0.2;
    color = mix(color, vec3(0.0), smoothstep(radius - 4.5, radius - 2.0, r) * 0.5);
    color += vec3(1.0) * smoothstep(radius - 2.2, radius - 0.8, r) * 0.14;
  } else if (r > label) {
    color = vec3(0.051, 0.047, 0.047) + vec3(1.0) * smoothstep(label + 6.5, label + 7.5, r) * 0.05;
  } else {
    color = mix(core(q, time), vec3(1.0), 0.2);
    float luma = dot(color, vec3(0.3, 0.55, 0.15));
    color *= 1.0 + pulse * 0.12;
    color += (hash(floor(q * 2.0)) - 0.5) * (0.04 + luma * 0.16);
    color *= 1.0 - smoothstep(label * 0.62, label, r) * 0.06;
    color = mix(color, vec3(0.0), smoothstep(label - 1.5, label - 0.5, r) * 0.5);
    float hole = 1.0 - smoothstep(7.5, 8.5, r);
    color = mix(color, vec3(0.055, 0.051, 0.047) * (0.6 + 0.4 * smoothstep(0.0, 8.0, r)), hole);
  }
  gl_FragColor = vec4(color * body, body);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

// Layout Constants (Wide: 1600 x 1000)
const BOARD_W = 1600;
const BOARD_H = 1000;
const DISC_X = 0;
const DISC_Y = 500;
const DISC_R = 470;
const PIVOT_X = 286;
const PIVOT_Y = 24;

// Face area for WebGL canvas (right half visible inside board)
const FACE_LEFT = -2;
const FACE_TOP = -472;
const FACE_WIDTH = 474;
const FACE_HEIGHT = 944;

const TON_RADIUS = 494;
const TICK_COUNT = 49;
const TICK_BOUNDS = 2 * TON_RADIUS + 80;
const TICK_HALF = TICK_BOUNDS / 2;

// Tonearm Constants
const ARM_V = 288;
const ARM_P = 1440;
const ARM_Z = { x: 137.7, y: 306.6 };
const ARM_T = { x: 101.4, y: 1411.2 };
const ARM_SCALE = 570 / Math.hypot(ARM_T.x - ARM_Z.x, ARM_T.y - ARM_Z.y);
const ARM_I = { x: (ARM_T.y - ARM_Z.y) * ARM_SCALE, y: (ARM_Z.x - ARM_T.x) * ARM_SCALE };
const ARM_G = Math.hypot(ARM_I.x, ARM_I.y);
const ARM_W = (180 * Math.atan2(ARM_I.y, ARM_I.x)) / Math.PI;

const clamp = (val: number, min = 0, max = 1) => Math.min(max, Math.max(min, val));

function getArmAngle(radiusVal: number) {
  const dist = Math.hypot(PIVOT_X - DISC_X, PIVOT_Y - DISC_Y);
  const ang = Math.atan2(PIVOT_Y - DISC_Y, PIVOT_X - DISC_X);
  const cosVal =
    (dist * dist + radiusVal * radiusVal - ARM_G * ARM_G) / (2 * dist * radiusVal);
  const ac = Math.acos(clamp(cosVal, -1, 1));
  const nx = DISC_X + Math.cos(ang + ac) * radiusVal;
  const ny = DISC_Y + Math.sin(ang + ac) * radiusVal;
  return (180 * Math.atan2(ny - PIVOT_Y, nx - PIVOT_X)) / Math.PI - ARM_W;
}

function getPointOnCircle(deg: number, r: number) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: Math.round((TICK_HALF + Math.cos(rad) * r) * 100) / 100,
    y: Math.round((TICK_HALF + Math.sin(rad) * r) * 100) / 100,
  };
}

const arcAngle = (idx: number) => -50 + (50 * idx * 2) / (TICK_COUNT - 1);
const arcDistNorm = (idx: number) =>
  Math.abs(idx - (TICK_COUNT - 1) / 2) / ((TICK_COUNT - 1) / 2);

const COLOR_INK = '#0e0d0c';
const COLOR_WHITE = '#f4f0ea';
const COLOR_MUTED = '#3a3633';
const COLOR_EMBER = '#e2462d';
const COLOR_SUB = 'rgb(244 240 234 / 0.45)';
const COLOR_RING = 'rgb(244 240 234 / 0.13)';

export const VinylLyricsPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(16.6);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [lyricRows, setLyricRows] = useState<LyricRow[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const armRef = useRef<SVGGElement | null>(null);
  const tonearmSvgRef = useRef<SVGSVGElement | null>(null);
  const printSvgRef = useRef<SVGSVGElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const pulseRef = useRef<HTMLDivElement | null>(null);
  const arcPathRef = useRef<SVGPathElement | null>(null);
  const knobRef = useRef<SVGGElement | null>(null);
  const lineNodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const lineCubesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const tokenBoxesRef = useRef<{ x: number; y: number; w: number; h: number }[][]>([]);

  // Web Audio Context & Buffers
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const forwardBufferRef = useRef<AudioBuffer | null>(null);
  const reversedBufferRef = useRef<AudioBuffer | null>(null);
  const songDataRef = useRef<any>(null);

  const startAudioTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const angleRef = useRef(0);
  const isScratchingRef = useRef(false);
  const scratchStartAngleRef = useRef(0);
  const scratchMovedRef = useRef(0);
  const animFrameRef = useRef(0);
  const activeLineInterpRef = useRef(0);
  const restFactorRef = useRef(1); // 1 = at rest, 0 = playing on groove

  // Initialize song and audio rendering
  useEffect(() => {
    const song = buildPhonkSong(0, 0.6);
    songDataRef.current = song;
    setDuration(song.length);
    setLyricRows(buildLyricRows(song));

    // Synthesize audio
    renderPhonkTrack(44100).then((res) => {
      forwardBufferRef.current = res.buffer;
      reversedBufferRef.current = res.reversedBuffer;
    });

    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Compute token box coordinates
  const measureTokenBoxes = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const lines = container.querySelectorAll<HTMLDivElement>('[data-line]');
    const allBoxes: { x: number; y: number; w: number; h: number }[][] = [];
    lines.forEach((line) => {
      const tokens = line.querySelectorAll<HTMLSpanElement>('[data-token]');
      const b: { x: number; y: number; w: number; h: number }[] = [];
      tokens.forEach((t) => {
        b.push({
          x: t.offsetLeft,
          y: t.offsetTop,
          w: t.offsetWidth,
          h: t.offsetHeight,
        });
      });
      allBoxes.push(b);
    });
    tokenBoxesRef.current = allBoxes;
  }, []);

  useEffect(() => {
    measureTokenBoxes();
    document.fonts.ready.then(measureTokenBoxes);
    const tm = setTimeout(measureTokenBoxes, 250);
    return () => clearTimeout(tm);
  }, [measureTokenBoxes, lyricRows]);

  // Audio Playback Controls
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.72;
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playAt = (offset: number) => {
    const ctx = getAudioContext();
    const buf = forwardBufferRef.current;
    if (!buf) return;

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (analyserRef.current) {
      src.connect(analyserRef.current);
    } else {
      src.connect(ctx.destination);
    }

    const safeOffset = clamp(offset, 0, buf.duration - 0.05);
    src.start(ctx.currentTime, safeOffset);
    startAudioTimeRef.current = ctx.currentTime - safeOffset;
    pausedAtRef.current = safeOffset;
    sourceNodeRef.current = src;
    setIsPlaying(true);

    src.onended = () => {
      if (sourceNodeRef.current === src) {
        setIsPlaying(false);
        pausedAtRef.current = 0;
      }
    };
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAt(pausedAtRef.current);
    }
  };

  const handleRewind = () => {
    pauseAudio();
    pausedAtRef.current = 0;
    setCurrentTime(0);
  };

  const handleForward = () => {
    const nextPhrase = lyricRows.find((r) => r.start > currentTime + 0.1);
    const target = nextPhrase ? nextPhrase.start : duration - 0.2;
    if (isPlaying) {
      playAt(target);
    } else {
      pausedAtRef.current = target;
      setCurrentTime(target);
    }
  };

  // Scratch sound effect generator
  const playScratchSound = (timePos: number, speed: number, isReverse: boolean) => {
    const ctx = getAudioContext();
    const buf = isReverse ? reversedBufferRef.current : forwardBufferRef.current;
    if (!buf) return;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = clamp(speed, 0.35, 3);

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.85, now + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + 0.09);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;

    src.connect(lp).connect(gain).connect(ctx.destination);
    const offset = isReverse ? Math.max(0, duration - timePos) : timePos;
    src.start(now, clamp(offset, 0, buf.duration - 0.1), 0.12 * clamp(speed, 0.35, 3));
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleRewind();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleForward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime]);

  // WebGL Shader setup on Vinyl Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      antialias: false,
      premultipliedAlpha: true,
      alpha: true,
    });
    if (!gl) return;

    const program = gl.createProgram();
    if (!program) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SHADER);
    if (!vs || !fs) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'res');
    const uArea = gl.getUniformLocation(program, 'area');
    const uRadius = gl.getUniformLocation(program, 'radius');
    const uLabel = gl.getUniformLocation(program, 'label');
    const uAngle = gl.getUniformLocation(program, 'angle');
    const uTime = gl.getUniformLocation(program, 'time');
    const uPulse = gl.getUniformLocation(program, 'pulse');

    // Face bounds: area = [left, top, width, height] = [-2, -472, 474, 944]
    gl.uniform4f(uArea, FACE_LEFT, FACE_TOP, FACE_WIDTH, FACE_HEIGHT);
    gl.uniform1f(uRadius, DISC_R);
    gl.uniform1f(uLabel, 168);

    const freqData = new Uint8Array(256);
    let lastTime = performance.now();
    let pulseVal = 0;

    const renderLoop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // Update current time from Web Audio if playing
      let curT = pausedAtRef.current;
      if (isPlaying && audioCtxRef.current) {
        curT = Math.min(duration, audioCtxRef.current.currentTime - startAudioTimeRef.current);
        pausedAtRef.current = curT;
      }
      setCurrentTime(curT);

      // Audio Frequency Pulse
      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(freqData);
        const subBass = freqData[2] / 255;
        pulseVal += (subBass - pulseVal) * (1 - Math.exp(-12 * dt));
      } else {
        pulseVal += (0 - pulseVal) * (1 - Math.exp(-8 * dt));
      }

      // Vinyl Rotation
      if (isPlaying && !isScratchingRef.current) {
        angleRef.current += dt * 35; // ~33 RPM aesthetic
      }
      const curAngle = angleRef.current;

      // Draw WebGL Vinyl Disc
      if (canvas.width > 0 && canvas.height > 0) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uAngle, (curAngle * Math.PI) / 180);
        gl.uniform1f(uTime, (now / 1000) % 1000);
        gl.uniform1f(uPulse, pulseVal);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      // Rotate Print SVG Center Label
      if (printSvgRef.current) {
        printSvgRef.current.style.transform = `rotate(${curAngle.toFixed(2)}deg)`;
      }

      // Tonearm Tracking with Smooth Rest Transition
      const atRest = !isPlaying && !isScratchingRef.current && (curT <= 0.05 || curT >= duration - 0.05);
      restFactorRef.current += ((atRest ? 1 : 0) - restFactorRef.current) * (1 - Math.exp(-6 * dt));
      const restB = restFactorRef.current * restFactorRef.current * (3 - 2 * restFactorRef.current);

      if (armRef.current) {
        const grooveRadius = 448 + -248 * clamp(curT / duration, 0, 1);
        const targetRadius = grooveRadius + (490 - grooveRadius) * restB;
        const targetDeg = getArmAngle(targetRadius);
        armRef.current.setAttribute('transform', `rotate(${targetDeg.toFixed(2)})`);
      }
      if (tonearmSvgRef.current) {
        const shadowOpacity = 0.6 - 0.2 * restB;
        tonearmSvgRef.current.style.filter = `drop-shadow(6px 10px 8px rgb(0 0 0 / ${shadowOpacity.toFixed(2)}))`;
      }

      // Disc Pulse Glow
      if (pulseRef.current) {
        pulseRef.current.style.opacity = (pulseVal * 0.75).toFixed(3);
      }
      if (sceneRef.current) {
        const sc = 1 + pulseVal * 0.015;
        sceneRef.current.style.transform = `scale(${sc.toFixed(4)})`;
      }

      // Circular Seek Arc & Knob
      const arcProgress = -50 + 50 * clamp(curT / duration, 0, 1) * 2;
      const arcStart = getPointOnCircle(-50, TON_RADIUS);
      const arcEnd = getPointOnCircle(arcProgress, TON_RADIUS);

      if (arcPathRef.current) {
        arcPathRef.current.setAttribute(
          'd',
          curT > 0.05
            ? `M ${arcStart.x} ${arcStart.y} A ${TON_RADIUS} ${TON_RADIUS} 0 0 1 ${arcEnd.x} ${arcEnd.y}`
            : `M ${arcStart.x} ${arcStart.y}`
        );
      }
      if (knobRef.current) {
        knobRef.current.setAttribute(
          'transform',
          `translate(${arcEnd.x.toFixed(1)} ${arcEnd.y.toFixed(1)})`
        );
      }

      // Carousel Lyrics Lines & Bouncing Cube
      updateLyricsCarousel(curT, dt);

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      gl.deleteBuffer(quadBuf);
      gl.deleteProgram(program);
    };
  }, [isPlaying, duration]);

  // Update Dynamic Rotating Carousel Lyrics & Leaping Cube
  const updateLyricsCarousel = (timeVal: number, dt: number) => {
    if (!lyricRows.length) return;

    // Find active target line index
    let activeLineIdx = 0;
    lyricRows.forEach((row, idx) => {
      if (timeVal >= row.start - 0.18) {
        activeLineIdx = idx;
      }
    });

    // Smooth line carousel interpolation
    activeLineInterpRef.current +=
      (activeLineIdx - activeLineInterpRef.current) * (1 - Math.exp(-9 * dt));
    const ep = activeLineInterpRef.current;

    lyricRows.forEach((row, lineIdx) => {
      const lineEl = lineNodesRef.current[lineIdx];
      const cubeEl = lineCubesRef.current[lineIdx];
      if (!lineEl) return;

      const diff = Math.abs(lineIdx - ep);
      const relDiff = lineIdx - ep;
      const isLineActive = diff < 0.5;

      // Rotate line based on carousel offset
      const rotDeg = 13 * relDiff;
      lineEl.style.transform = `rotate(${rotDeg.toFixed(3)}deg) translate(604px, -50%)`;
      const op = Math.max(0.04, 1 - 0.28 * diff);
      lineEl.style.opacity = op.toFixed(3);
      lineEl.style.filter = diff > 0.08 ? `blur(${Math.min(4, diff * 2.2).toFixed(1)}px)` : 'none';

      // Update line label color (ember when active, muted otherwise)
      const labelEl = lineEl.querySelector<HTMLSpanElement>('[data-label]');
      if (labelEl) {
        labelEl.style.color = isLineActive && timeVal >= row.start - 0.18 ? COLOR_EMBER : COLOR_SUB;
      }

      // Update tokens inside line
      const tokenEls = lineEl.querySelectorAll<HTMLSpanElement>('[data-token]');
      tokenEls.forEach((tEl, tIdx) => {
        const tok = row.tokens[tIdx];
        if (!tok) return;

        const isPast = timeVal >= tok.end;
        const isSung = timeVal >= tok.start && timeVal < tok.end;
        const noteKey = tok.note.replace(/-?\d$/, '');
        const hue = NOTE_HUES[noteKey] || [226, 70, 45];

        if (isSung) {
          tEl.style.color = COLOR_WHITE;
          tEl.style.backgroundColor = `rgb(${hue.join(' ')} / 0.32)`;
          tEl.style.backgroundImage =
            'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 60%)';
          tEl.style.transform = 'translateY(-8px) scale(1.12)';
          tEl.style.textShadow = `0 0 10px rgb(${hue.join(' ')} / 0.9)`;
        } else if (isPast) {
          tEl.style.color = COLOR_WHITE;
          tEl.style.backgroundColor = 'transparent';
          tEl.style.backgroundImage = 'none';
          tEl.style.transform = 'none';
          tEl.style.textShadow = 'none';
        } else {
          tEl.style.color = COLOR_MUTED;
          tEl.style.backgroundColor = 'transparent';
          tEl.style.backgroundImage = 'none';
          tEl.style.transform = 'none';
          tEl.style.textShadow = 'none';
        }
      });

      // Update Bouncing Cube on Active Line
      if (!cubeEl) return;
      const boxes = tokenBoxesRef.current[lineIdx] || [];

      if (!isLineActive || !boxes.length) {
        cubeEl.style.opacity = '0';
        return;
      }

      // Determine active token index
      let curTokIdx = -1;
      row.tokens.forEach((tok, idx) => {
        if (timeVal >= tok.start) {
          curTokIdx = idx;
        }
      });

      // At start (timeVal <= 0.05), show on token 0
      const aIdx = Math.max(0, curTokIdx);
      const nextTok = row.tokens[aIdx + 1];
      const curTok = row.tokens[aIdx];

      let interp = 0;
      let targetIdx = aIdx;

      if (curTokIdx >= 0 && nextTok) {
        const leadWindow = Math.min(0.32, (nextTok.start - curTok.start) * 0.9);
        const frac = clamp((timeVal - (nextTok.start - leadWindow)) / leadWindow, 0, 1);
        if (frac > 0) {
          interp = frac;
          targetIdx = aIdx + 1;
        }
      }

      const curBox = boxes[aIdx] || { x: 0, y: 0, w: 20, h: 20 };
      const nextBox = boxes[targetIdx] || curBox;

      const smoothInterp = interp * interp * (3 - 2 * interp);
      const hopHeight =
        4 * interp * (1 - interp) * (18 + Math.min(24, 0.2 * Math.abs(nextBox.x - curBox.x)));

      const curCenterX = curBox.x + curBox.w / 2;
      const nextCenterX = nextBox.x + nextBox.w / 2;
      const posX = curCenterX + (nextCenterX - curCenterX) * smoothInterp - 12.5;
      const posY = Math.min(curBox.y, nextBox.y) - 25 - 4 - hopHeight;

      const noteKey = (row.tokens[aIdx] || row.tokens[0]).note.replace(/-?\d$/, '');
      const hue = NOTE_HUES[noteKey] || [125, 112, 255];

      cubeEl.style.opacity = (1 - diff * 2).toFixed(3);
      cubeEl.style.transform = `translate(${posX.toFixed(1)}px, ${posY.toFixed(1)}px) rotate(${((aIdx + smoothInterp) * 90).toFixed(1)}deg)`;
      cubeEl.style.backgroundColor = `rgb(${hue.join(' ')})`;
      cubeEl.style.boxShadow = `inset 0 0 0 3px rgb(${hue.map((c) => Math.round(0.45 * c)).join(' ')}), 0 0 14px rgb(${hue.join(' ')} / 0.65)`;
    });
  };

  // Pointer Handlers for Scratching
  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const ang = (180 * Math.atan2(my - 470, mx - 0)) / Math.PI;

    isScratchingRef.current = true;
    scratchStartAngleRef.current = ang;
    scratchMovedRef.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isScratchingRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const ang = (180 * Math.atan2(my - 470, mx - 0)) / Math.PI;

    let dAngle = ang - scratchStartAngleRef.current;
    if (dAngle > 180) dAngle -= 360;
    if (dAngle < -180) dAngle += 360;

    scratchStartAngleRef.current = ang;
    scratchMovedRef.current += Math.abs(dAngle);

    if (scratchMovedRef.current < 2) return;

    if (isPlaying) {
      pauseAudio();
    }

    angleRef.current += dAngle;
    const timeDelta = dAngle / 40;
    const prevTime = pausedAtRef.current;
    const newTime = clamp(prevTime + timeDelta, 0, duration);
    pausedAtRef.current = newTime;
    setCurrentTime(newTime);

    if (Math.abs(timeDelta) > 0.005) {
      playScratchSound(prevTime, Math.abs(timeDelta) / 0.018, timeDelta < 0);
    }
  };

  const handlePointerUp = () => {
    if (!isScratchingRef.current) return;
    isScratchingRef.current = false;
  };

  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);
  const timeFormatted = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = Math.round(duration);
  const totalFormatted = `0:${String(totalSeconds).padStart(2, '0')}`;

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#08080a] text-text flex flex-col justify-between selection:bg-purple-500/30 select-none">
      {/* Header */}
      <Header
        onOpenWaitlist={() => setIsWaitlistOpen(true)}
        onOpenMcp={() => setIsMcpOpen(true)}
        currentPath="/play/vinyl-lyrics"
      />

      {/* Main Player Frame */}
      <main className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-5 md:px-8 md:pb-8 overflow-hidden">
        <div
          className="relative aspect-[16/10] max-h-full rounded-[28px] overflow-hidden shadow-2xl"
          style={
            {
              backgroundColor: COLOR_INK,
              width: 'min(100%, calc((100dvh - 6.5rem) * 1.6))',
              height: 'auto',
              maxHeight: 'calc(100dvh - 6.5rem)',
              boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.06), 0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            } as React.CSSProperties
          }
        >
          <Artboard width={BOARD_W} height={BOARD_H}>
            <div
              ref={containerRef}
              className="absolute inset-0 overflow-hidden select-none font-sans"
              style={{ backgroundColor: COLOR_INK }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Scene Container with Displaced Bass Pulse */}
              <div
                ref={sceneRef}
                data-scene="true"
                className="absolute inset-0"
                style={{ transformOrigin: '0px 500px', willChange: 'transform' }}
              >
                {/* Backdrop Radial Gradient */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(0% 50% at 62% 78%, rgb(226 70 120 / 0.22), rgb(0 0 0 / 0) 70%)',
                  }}
                />

                {/* Pulse Glow Gradient */}
                <div
                  ref={pulseRef}
                  data-pulse="true"
                  className="absolute inset-0 will-change-[opacity] pointer-events-none"
                  style={{
                    opacity: 0,
                    backgroundImage:
                      'radial-gradient(circle at 0px 500px, rgb(0 0 0 / 0) 464px, rgb(255 96 156 / 0.42) 476px, rgb(255 120 100 / 0.12) 520px, rgb(0 0 0 / 0) 580px), radial-gradient(0% 50% at 62% 78%, rgb(255 86 148 / 0.46), rgb(255 110 90 / 0.12) 48%, rgb(0 0 0 / 0) 74%)',
                  }}
                />

                {/* Circular Spectrum Ticks & Seek Ring SVG */}
                <svg
                  className="absolute overflow-visible pointer-events-none"
                  style={{ left: DISC_X - TICK_HALF, top: DISC_Y - TICK_HALF }}
                  width={TICK_BOUNDS}
                  height={TICK_BOUNDS}
                >
                  <defs>
                    <filter id="tick-glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="1.6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Radiating Ticks */}
                  <g filter="url(#tick-glow)">
                    {Array.from({ length: TICK_COUNT }, (_, idx) => {
                      const ang = arcAngle(idx);
                      const p1 = getPointOnCircle(ang, TON_RADIUS + 15);
                      const p2 = getPointOnCircle(ang, TON_RADIUS + 20);
                      const norm = arcDistNorm(idx);
                      const strokeColor =
                        norm < 0.5 ? 'rgb(214 86 142)' : 'rgb(112 120 212)';
                      return (
                        <line
                          key={idx}
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke={strokeColor}
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          opacity={0.35 + (1 - norm) * 0.45}
                        />
                      );
                    })}
                  </g>

                  {/* Circular Arc Ring */}
                  <g>
                    {(() => {
                      const startPt = getPointOnCircle(-50, TON_RADIUS);
                      const endPt = getPointOnCircle(50, TON_RADIUS);
                      return (
                        <path
                          d={`M ${startPt.x} ${startPt.y} A ${TON_RADIUS} ${TON_RADIUS} 0 0 1 ${endPt.x} ${endPt.y}`}
                          fill="none"
                          stroke={COLOR_RING}
                          strokeWidth={3}
                          strokeLinecap="round"
                        />
                      );
                    })()}
                    <path
                      ref={arcPathRef}
                      data-arc="true"
                      d={`M ${getPointOnCircle(-50, TON_RADIUS).x} ${getPointOnCircle(-50, TON_RADIUS).y}`}
                      fill="none"
                      stroke={COLOR_EMBER}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </g>

                  {/* Arc Progress Knob */}
                  <g
                    ref={knobRef}
                    data-knob="true"
                    transform={`translate(${getPointOnCircle(-50, TON_RADIUS).x} ${getPointOnCircle(-50, TON_RADIUS).y})`}
                  >
                    <circle r={9} fill={COLOR_INK} stroke={COLOR_EMBER} strokeWidth={2} />
                    <circle r={3.5} fill={COLOR_EMBER} />
                  </g>
                </svg>

                {/* Massive 940px Vinyl Disc at left edge */}
                <div
                  data-disc="true"
                  className="absolute cursor-grab active:cursor-grabbing will-change-transform"
                  style={{
                    left: DISC_X - DISC_R,
                    top: DISC_Y - DISC_R,
                    width: 2 * DISC_R,
                    height: 2 * DISC_R,
                  }}
                >
                  {/* Disc Shadow */}
                  <div className="absolute inset-0 rounded-full shadow-[0_50px_90px_-30px_rgb(30_24_20/0.6),0_16px_36px_-14px_rgb(30_24_20/0.45)]" />

                  {/* WebGL Marbled Canvas */}
                  <canvas
                    ref={canvasRef}
                    data-vinyl="true"
                    width={2 * FACE_WIDTH}
                    height={2 * FACE_HEIGHT}
                    className="absolute"
                    style={{
                      left: DISC_R + FACE_LEFT,
                      top: DISC_R + FACE_TOP,
                      width: FACE_WIDTH,
                      height: FACE_HEIGHT,
                    }}
                  />

                  {/* Exact SVG Print Center Label from User Prompt */}
                  <svg
                    ref={printSvgRef}
                    data-print="true"
                    className="absolute inset-0 overflow-visible mix-blend-multiply will-change-transform"
                    viewBox="-470 -470 940 940"
                    width={940}
                    height={940}
                    fill="rgb(118 26 78)"
                    style={{ transform: 'rotate(0deg)' }}
                  >
                    <defs>
                      <path
                        id="label-rim"
                        d="M 0 -141 A 141 141 0 1 1 0 141 A 141 141 0 1 1 0 -141"
                      />
                      <path id="label-title" d="M -90.06 -52 A 104 104 0 0 1 90.06 -52" />
                      <path id="label-artist" d="M -107.38 62 A 124 124 0 0 0 107.38 62" />
                    </defs>

                    <circle
                      r="162"
                      fill="none"
                      stroke="rgb(118 26 78)"
                      strokeWidth="3.2"
                      opacity="0.6"
                    />
                    <circle
                      r="155"
                      fill="none"
                      stroke="rgb(176 64 46)"
                      strokeWidth="1.4"
                      opacity="0.55"
                    />

                    <text
                      fontSize="8.5"
                      fontWeight="500"
                      letterSpacing="0.14em"
                      opacity="0.7"
                    >
                      <textPath
                        href="#label-rim"
                        textLength="823.91"
                        lengthAdjust="spacing"
                      >
                        Composed note by note in TypeScript and pressed onto pixels, no real
                        vinyl was harmed, play it loud and scratch it often
                      </textPath>
                    </text>

                    <circle
                      r="131"
                      fill="none"
                      stroke="rgb(118 26 78)"
                      strokeWidth="0.8"
                      opacity="0.35"
                    />

                    <text
                      fontSize="24"
                      fontWeight="650"
                      letterSpacing="0.02em"
                      textAnchor="middle"
                      opacity="0.92"
                    >
                      <textPath href="#label-title" startOffset="50%">
                        Soft Static
                      </textPath>
                    </text>

                    <text
                      fontSize="12"
                      fontWeight="500"
                      letterSpacing="0.12em"
                      textAnchor="middle"
                      opacity="0.8"
                    >
                      <textPath href="#label-artist" startOffset="50%">
                        Claude Code
                      </textPath>
                    </text>

                    <text
                      fontSize="9"
                      fontWeight="500"
                      letterSpacing="0.18em"
                      textAnchor="middle"
                      opacity="0.65"
                      y="-46"
                    >
                      Phonk mix
                    </text>

                    <g fill="rgb(176 64 46)" textAnchor="middle">
                      <text
                        x="-56"
                        y="-9"
                        fontSize="8.5"
                        fontWeight="500"
                        letterSpacing="0.18em"
                        opacity="0.75"
                      >
                        Side
                      </text>
                      <text x="-56" y="17" fontSize="28" fontWeight="650" opacity="0.88">
                        A
                      </text>
                      <text
                        x="56"
                        y="7"
                        fontSize="24"
                        fontWeight="650"
                        letterSpacing="0.01em"
                        opacity="0.88"
                      >
                        33⅓
                      </text>
                      <text
                        x="56"
                        y="21"
                        fontSize="8.5"
                        fontWeight="500"
                        letterSpacing="0.18em"
                        opacity="0.75"
                      >
                        rpm
                      </text>
                    </g>

                    <svg
                      x="-10"
                      y="40"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="#d97757"
                      opacity="0.95"
                    >
                      <path d={CLAUDE_LOGO_PATH} />
                    </svg>
                  </svg>
                </div>

                {/* Lyrics Rotating Carousel */}
                <div
                  className="absolute pointer-events-none"
                  style={{ left: 0, top: 500, width: 0, height: 0 }}
                >
                  {lyricRows.map((row, rIdx) => {
                    return (
                      <div
                        key={rIdx}
                        data-line={rIdx}
                        ref={(el) => {
                          lineNodesRef.current[rIdx] = el;
                        }}
                        className="absolute top-0 left-0 flex items-baseline whitespace-nowrap font-mono leading-none font-medium will-change-transform"
                        style={{
                          fontSize: 44,
                          transformOrigin: '0 0',
                          transform: `rotate(${(13 * rIdx).toFixed(3)}deg) translate(604px, -50%)`,
                          opacity: Math.max(0.04, 1 - 0.28 * rIdx),
                        }}
                      >
                        {/* Bouncing Glowing Cube for this line */}
                        <span
                          ref={(el) => {
                            lineCubesRef.current[rIdx] = el;
                          }}
                          data-cube="true"
                          className="pointer-events-none absolute top-0 left-0 rounded-[3px] will-change-transform"
                          style={{
                            width: 25,
                            height: 25,
                            opacity: rIdx === 0 ? 1 : 0,
                          }}
                        >
                          <span
                            className="absolute inset-[7px] rounded-[1px]"
                            style={{ backgroundColor: 'rgb(0 0 0 / 0.3)' }}
                          />
                        </span>

                        <span
                          data-label="true"
                          className="mr-[0.7em] font-normal tracking-[0.04em] transition-colors duration-200"
                          style={{ color: rIdx === 0 ? COLOR_EMBER : COLOR_SUB, fontSize: 19 }}
                        >
                          {row.label}
                        </span>

                        {row.tokens.map((tok, tIdx) => {
                          return (
                            <span
                              key={tIdx}
                              data-token="true"
                              className="mr-[0.22em] inline-block origin-bottom rounded-[10px] px-[0.16em] py-[0.06em] transition-all duration-150"
                              style={{
                                color: COLOR_MUTED,
                              }}
                            >
                              {tok.text}
                            </span>
                          );
                        })}

                        {row.echo.length > 0 && (
                          <span
                            className="ml-[0.3em] inline-flex gap-[0.4em] self-start text-[22px] font-medium"
                            style={{ color: COLOR_EMBER, opacity: 0.85 }}
                          >
                            {row.echo.map((e, eIdx) => (
                              <span key={eIdx}>{e.text}</span>
                            ))}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Metallic Hardware Tonearm SVG */}
                <svg
                  ref={tonearmSvgRef}
                  data-tonearm="true"
                  className="pointer-events-none absolute inset-0 overflow-visible will-change-[filter]"
                  width={BOARD_W}
                  height={BOARD_H}
                  style={{
                    filter: 'drop-shadow(6px 10px 8px rgb(0 0 0 / 0.6))',
                  }}
                >
                  <g transform={`translate(${PIVOT_X} ${PIVOT_Y})`}>
                    <g
                      ref={armRef}
                      data-arm="true"
                      transform={`rotate(${getArmAngle(490).toFixed(2)})`}
                    >
                      <image
                        href="/concepts/spotify-lyrics/tonearm.webp"
                        transform="rotate(-90)"
                        x={Math.round(-ARM_Z.x * ARM_SCALE)}
                        y={Math.round(-ARM_Z.y * ARM_SCALE)}
                        width={Math.round(ARM_V * ARM_SCALE)}
                        height={Math.round(ARM_P * ARM_SCALE)}
                      />
                    </g>
                  </g>
                </svg>
              </div>

              {/* Top Right Song Info */}
              <div className="absolute top-[52px] right-[64px] text-right pointer-events-none">
                <div
                  className="font-medium tracking-tight text-white text-[19px]"
                  style={{ color: COLOR_WHITE }}
                >
                  Soft Static
                </div>
                <div
                  className="mt-[4px] tracking-[0.01em] text-[15px] flex items-center justify-end gap-[0.45em]"
                  style={{ color: COLOR_SUB }}
                >
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="#d97757">
                    <path d={CLAUDE_LOGO_PATH} />
                  </svg>
                  <span>Claude Code</span>
                </div>
              </div>

              {/* Bottom Center Controls */}
              <div
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-[30px]"
                style={{ bottom: 34, color: COLOR_SUB }}
              >
                {/* Back to Start */}
                <button
                  type="button"
                  onClick={handleRewind}
                  className="cursor-pointer transition-colors hover:text-white p-2"
                  aria-label="Back to start"
                >
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.5v11L10.5 12zM6 6h2.2v12H6z" />
                  </svg>
                </button>

                {/* Play / Pause Toggle Button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex cursor-pointer items-center justify-center rounded-full border transition-transform active:scale-95 hover:text-white"
                  style={{
                    borderColor: 'rgb(244 240 234 / 0.14)',
                    width: 46,
                    height: 46,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  }}
                  aria-label="Play or pause"
                >
                  {isPlaying ? (
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z" />
                    </svg>
                  ) : (
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 4.5v15L19.5 12z" />
                    </svg>
                  )}
                </button>

                {/* Next Phrase */}
                <button
                  type="button"
                  onClick={handleForward}
                  className="cursor-pointer transition-colors hover:text-white p-2"
                  aria-label="Next phrase"
                >
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 6.5v11l8.5-5.5zM15.8 6H18v12h-2.2z" />
                  </svg>
                </button>
              </div>

              {/* Bottom Right Clock Timecode */}
              <div
                className="absolute right-[64px] tabular-nums tracking-[0.02em] font-mono"
                style={{ bottom: 44, color: COLOR_SUB, fontSize: 15 }}
              >
                <span style={{ color: COLOR_WHITE }}>{timeFormatted}</span>
                {' / '}
                {totalFormatted}
              </div>
            </div>
          </Artboard>
        </div>
      </main>

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />

      <McpModal
        isOpen={isMcpOpen}
        onClose={() => setIsMcpOpen(false)}
      />
    </div>
  );
};
