import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Artboard } from '../components/Artboard';
import { Header } from '../components/Header';
import { WaitlistModal } from '../components/WaitlistModal';
import { TypewriterToolbar } from '../components/typewriter/TypewriterToolbar';
import { TypewriterGetCodeModal } from '../components/typewriter/TypewriterGetCodeModal';
import { McpModal } from '../components/mcp/McpModal';
import { typewriterSound as A } from '../audio/typewriterAudio';

// --- Assets and Constants ---
const ASSET_PATH = '/typewriter';

const MACHINE_PARTS: Record<string, { x: number; y: number; width: number; height: number }> = {
  body: { x: 574, y: 498, width: 4372, height: 2286 },
  back: { x: 766, y: 260, width: 4014, height: 556 },
  bail: { x: 1222, y: 340, width: 3016, height: 170 },
  lever: { x: 446, y: 232, width: 654, height: 648 },
  shadow: { x: 54, y: -22, width: 5412, height: 3324 },
};

export const KEYS = [
  { id: '1', label: '1', x: 1177, y: 1351, width: 218, height: 98 },
  { id: '2', label: '2', x: 1461, y: 1350, width: 214, height: 98 },
  { id: '3', label: '3', x: 1744, y: 1350, width: 214, height: 98 },
  { id: '4', label: '4', x: 2027, y: 1350, width: 212, height: 98 },
  { id: '5', label: '5', x: 2311, y: 1350, width: 212, height: 98 },
  { id: '6', label: '6', x: 2593, y: 1350, width: 214, height: 98 },
  { id: '7', label: '7', x: 2875, y: 1351, width: 210, height: 98 },
  { id: '8', label: '8', x: 3158, y: 1351, width: 212, height: 98 },
  { id: '9', label: '9', x: 3439, y: 1351, width: 212, height: 98 },
  { id: '0', label: '0', x: 3720, y: 1350, width: 212, height: 98 },
  { id: '-', label: '-', x: 4003, y: 1350, width: 214, height: 98 },
  { id: 'backspace', label: '⌫', x: 4283, y: 1350, width: 214, height: 98 },
  { id: 'q', label: 'Q', x: 1296, y: 1570, width: 216, height: 104 },
  { id: 'w', label: 'W', x: 1584, y: 1570, width: 216, height: 106 },
  { id: 'e', label: 'E', x: 1871, y: 1571, width: 216, height: 106 },
  { id: 'r', label: 'R', x: 2158, y: 1571, width: 216, height: 106 },
  { id: 't', label: 'T', x: 2447, y: 1571, width: 216, height: 106 },
  { id: 'y', label: 'Y', x: 2732, y: 1570, width: 216, height: 106 },
  { id: 'u', label: 'U', x: 3019, y: 1570, width: 216, height: 106 },
  { id: 'i', label: 'I', x: 3306, y: 1571, width: 216, height: 106 },
  { id: 'o', label: 'O', x: 3592, y: 1570, width: 216, height: 106 },
  { id: 'p', label: 'P', x: 3876, y: 1571, width: 216, height: 106 },
  { id: '[', label: '[', x: 4163, y: 1571, width: 216, height: 106 },
  { id: ']', label: ']', x: 4451, y: 1571, width: 218, height: 106 },
  { id: 'caps', label: '⇪', x: 1061, y: 1790, width: 222, height: 108 },
  { id: 'a', label: 'A', x: 1355, y: 1791, width: 222, height: 108 },
  { id: 's', label: 'S', x: 1646, y: 1791, width: 220, height: 108 },
  { id: 'd', label: 'D', x: 1939, y: 1791, width: 220, height: 110 },
  { id: 'f', label: 'F', x: 2229, y: 1791, width: 218, height: 110 },
  { id: 'g', label: 'G', x: 2521, y: 1792, width: 218, height: 110 },
  { id: 'h', label: 'H', x: 2809, y: 1791, width: 218, height: 110 },
  { id: 'j', label: 'J', x: 3101, y: 1791, width: 218, height: 110 },
  { id: 'k', label: 'K', x: 3391, y: 1791, width: 216, height: 108 },
  { id: 'l', label: 'L', x: 3682, y: 1791, width: 218, height: 108 },
  { id: ';', label: ';', x: 3973, y: 1791, width: 218, height: 110 },
  { id: "'", label: "'", x: 4261, y: 1791, width: 218, height: 108 },
  { id: 'shift', label: '⇧', x: 1116, y: 2001, width: 322, height: 128 },
  { id: 'z', label: 'Z', x: 1481, y: 1999, width: 224, height: 116 },
  { id: 'x', label: 'X', x: 1778, y: 1999, width: 222, height: 116 },
  { id: 'c', label: 'C', x: 2075, y: 2000, width: 224, height: 116 },
  { id: 'v', label: 'V', x: 2370, y: 2000, width: 226, height: 116 },
  { id: 'b', label: 'B', x: 2665, y: 2000, width: 222, height: 116 },
  { id: 'n', label: 'N', x: 2959, y: 2000, width: 224, height: 116 },
  { id: 'm', label: 'M', x: 3254, y: 2000, width: 222, height: 116 },
  { id: ',', label: ',', x: 3549, y: 2000, width: 224, height: 116 },
  { id: '.', label: '.', x: 3844, y: 1999, width: 224, height: 116 },
  { id: '/', label: '/', x: 4140, y: 2000, width: 222, height: 116 },
  { id: 'shift-right', label: '⇧', x: 4472, y: 2000, width: 320, height: 126 },
];

const ROLLER_SLOTS = [1769, 3482];
const BASKET_RADIUS = 343;
const BASKET_WIDTH = 179;
const V_DIST = 917;
const K_DIST = 193;

const COLOR_INK = '#22232a';
const COLOR_ACCENT = '#f0702e';
const COLOR_MUTED = 'rgb(34 35 42 / 0.55)';
const COLOR_BG = '#e7e7e8';
const COLOR_RED = '#c4302b';
const COLOR_GRID_LINE = 'rgb(34 35 42 / 0.26)';
const COLOR_CROSS = 'rgb(34 35 42 / 0.55)';
const TRANSITION_GRID = '0.9s cubic-bezier(0.65, 0, 0.2, 1)';

const PAPER_X = 1478;
const PAPER_Y = -328;

const NOISE_PATTERN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.3 0 0 0 0 0.24 0 0 0 0.1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const CAMERA_HERO = { scale: 0.165, x: 1090, y: 415 };
const CAMERA_TEST = { scale: 0.175, x: 800, y: 560 };

const TEXT_DATA = {
  title: ['Typos stay', 'on paper'],
  red: 5,
  description:
    'Test your typing speed on a real typewriter. Every key hits the paper and the bell rings at the end of each line',
  start: 'Start typing',
  secondary: 'Leaderboard',
  nav: ['Practice', 'Leaderboard', 'Pricing'],
  signIn: 'Sign in',
  again: 'Try again',
  download: 'Download',
  words: 'wpm',
  chars: 'cpm',
  accuracy: 'accuracy',
  typos: (n: number) => (1 === n ? 'typo' : 'typos'),
  minutes: 'min',
  locale: 'en-US',
  note: [
    'Hello there. This machine has no',
    'backspace, so every letter counts.',
    'Press start when you are ready.',
  ],
  passages: [
    'every key you press lands on real paper and every mistake stays where you made it',
    'there is no undo on a typewriter only you and a sheet of paper that remembers everything',
    'type like the ink costs money and press the keys a little harder just for the sound',
    'somewhere a writer is still waiting for the bell before reaching for the lever',
  ],
};

let globalUID = 0;

function Z(e: number, t: number) {
  let a =
    Math.imul(0x9e3779b9 ^ e, 0x85ebca6b) ^
    Math.imul(t + 0x632be5ab, 0xc2b2ae35);
  a = Math.imul(a ^ (a >>> 15), 0x2c1b3c6d);
  return (((a ^= a >>> 13) >>> 0) / 0x100000000);
}

interface Strike {
  id: number;
  line: number;
  col: number;
  char: string;
  red: boolean;
  dx: number;
  dy: number;
  tilt: number;
  ink: number;
}

function createStrike(
  line: number,
  col: number,
  char: string,
  red: boolean,
  id = globalUID++
): Strike {
  return {
    id,
    line,
    col,
    char,
    red,
    dx: (Z(id, 1) - 0.5) * 3,
    dy: (Z(id, 2) - 0.5) * 4,
    tilt: (Z(id, 3) - 0.5) * 1.6,
    ink: 0.76 + 0.24 * Z(id, 4),
  };
}

function getCharKeyId(char: string) {
  if (char === ' ') return 'space';
  const match = KEYS.find((k) => k.id === char.toLowerCase());
  return match ? match.id : null;
}

function computeBounds(spanWidth: number) {
  const edge = (1600 - spanWidth) / 2;
  return { edge, inner: edge + 8, span: spanWidth - 16 };
}

const BOUNDS = {
  hero: computeBounds(1360),
  test: computeBounds(1200),
};

function createGameState(
  passages: string[],
  round: number,
  sheet: number,
  firstLine: number,
  strikes: Strike[],
  prevLine: number,
  prevCol: number
) {
  const text = passages[round % passages.length];
  const spots: { line: number; col: number; wrap: boolean }[] = [];
  let curLine = 0;
  let curCol = 0;
  let wordCount = 0;

  for (const word of text.split(' ')) {
    if (wordCount > 0) {
      const willWrap = curCol + 1 + word.length > 34;
      spots.push({ line: curLine, col: curCol, wrap: willWrap });
      wordCount++;
      if (willWrap) {
        curLine++;
        curCol = 0;
      } else {
        curCol++;
      }
    }
    for (let i = 0; i < word.length; i++) {
      spots.push({ line: curLine, col: curCol, wrap: false });
      curCol++;
      wordCount++;
    }
  }

  return {
    phase: 'typing' as 'hero' | 'typing' | 'done',
    sheet,
    round,
    text,
    spots,
    first: firstLine,
    typed: Array<string | null>(text.length).fill(null),
    pos: 0,
    keystrokes: 0,
    mistakes: 0,
    started: 0,
    carriage: {
      line: firstLine,
      col: 0,
      sweep: prevLine !== firstLine || 0 !== prevCol,
    },
    strikes,
    result: null as {
      wpm: number;
      cpm: number;
      accuracy: number;
      seconds: number;
      typos: number;
      date: number;
    } | null,
  };
}

// Group contiguous error ranges for red markup loops
function groupTypos(strikes: Strike[]) {
  const result: { line: number; from: number; to: number }[] = [];
  const uniquePositions = [...new Set(strikes.map((s) => `${s.line}:${s.col}`))]
    .map((s) => s.split(':').map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  for (const [line, col] of uniquePositions) {
    const last = result[result.length - 1];
    if (last && last.line === line && col - last.to <= 2) {
      last.to = col;
    } else {
      result.push({ line, from: col, to: col });
    }
  }
  return result;
}

// Generate and trigger download of high-resolution typewriter score receipt PNG
function downloadReceiptImage(game: ReturnType<typeof createGameState>) {
  const result = game.result;
  if (!result) return;

  const canvas = document.createElement('canvas');
  const dpr = 2;
  const width = 480;
  const lineCount = Math.max(0, ...game.spots.map((s) => s.line)) + 1;
  const contentHeight = Math.max(80, lineCount * 26);
  const height = 350 + contentHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);

  // 1. Paper background
  ctx.fillStyle = '#fefdfa';
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(0, 0, width, height, 8);
  } else {
    ctx.rect(0, 0, width, height);
  }
  ctx.fill();

  // Paper edge border
  ctx.strokeStyle = 'rgba(70, 60, 50, 0.16)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. Header
  ctx.font = 'bold 20px "Courier New", Courier, monospace';
  ctx.fillStyle = '#22232a';
  ctx.fillText('clack', 32, 42);

  const dateStr = new Date(result.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  ctx.font = '14px "Courier New", Courier, monospace';
  ctx.fillStyle = 'rgba(34, 35, 42, 0.55)';
  const dateW = ctx.measureText(dateStr).width;
  ctx.fillText(dateStr, width - 32 - dateW, 42);

  // 3. Typed text & strikes
  ctx.font = '19px "Courier New", Courier, monospace';
  const textTop = 84;
  const strikes = game.strikes.filter(
    (s) => s.line >= game.first && s.line < game.first + lineCount
  );

  for (const s of strikes) {
    const cx = 32 + s.col * 11.4 + s.dx * 0.2;
    const cy = textTop + (s.line - game.first) * 26 + s.dy * 0.2;
    ctx.fillStyle = s.red ? '#c4302b' : '#1e2024';
    ctx.fillText(s.char, cx, cy);
  }

  // Typos markup circles
  const typosList = groupTypos(strikes.filter((s) => s.red));
  ctx.strokeStyle = '#c4302b';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  for (const t of typosList) {
    const rx = 32 + t.from * 11.4 - 3;
    const ry = textTop + (t.line - game.first) * 26 - 19;
    const rw = (t.to - t.from + 1) * 11.4 + 6;
    const rh = 24;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(rx, ry, rw, rh, 11);
    } else {
      ctx.rect(rx, ry, rw, rh);
    }
    ctx.stroke();
  }

  // 4. Dashed divider
  const divY = textTop + contentHeight + 14;
  ctx.strokeStyle = 'rgba(34, 35, 42, 0.22)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(32, divY);
  ctx.lineTo(width - 32, divY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 5. Big WPM & CPM
  const statsY = divY + 54;
  ctx.font = 'bold 64px "Courier New", Courier, monospace';
  ctx.fillStyle = '#22232a';
  const wpmText = `${result.wpm}`;
  ctx.fillText(wpmText, 32, statsY);

  const wpmWidth = ctx.measureText(wpmText).width;
  ctx.font = '22px "Courier New", Courier, monospace';
  ctx.fillText('wpm', 32 + wpmWidth + 8, statsY);

  const cpmX = 32 + wpmWidth + 64;
  ctx.font = 'bold 40px "Courier New", Courier, monospace';
  ctx.fillStyle = 'rgba(34, 35, 42, 0.72)';
  const cpmText = `${result.cpm}`;
  ctx.fillText(cpmText, cpmX, statsY);

  const cpmWidth = ctx.measureText(cpmText).width;
  ctx.font = '18px "Courier New", Courier, monospace';
  ctx.fillText('cpm', cpmX + cpmWidth + 6, statsY);

  // 6. Sub-stats
  const subY = statsY + 36;
  ctx.font = '500 15px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(34, 35, 42, 0.65)';
  const secs = Math.round(result.seconds);
  const timeStr = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} min`;

  ctx.fillText(`Target: ${result.accuracy}% accuracy`, 32, subY);
  if (result.typos > 0) {
    ctx.fillStyle = '#c4302b';
  }
  ctx.fillText(`Typos: ${result.typos}`, 200, subY);
  ctx.fillStyle = 'rgba(34, 35, 42, 0.65)';
  ctx.fillText(`Time: ${timeStr}`, 300, subY);

  // 7. Footer tag
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(34, 35, 42, 0.35)';
  ctx.fillText('Key UI • Typewriter Test', 32, height - 16);

  // Trigger download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `typewriter-score-${result.wpm}wpm.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

export const TypewriterPage: React.FC = () => {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isGetCodeOpen, setIsGetCodeOpen] = useState(false);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [spareOffset, setSpareOffset] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onResize = () => {
      const scale = Math.min(el.clientWidth / 1600, el.clientHeight / 1000);
      if (scale) {
        setSpareOffset({
          x: Math.max(0, (el.clientWidth / scale - 1600) / 2),
          y: Math.max(0, (el.clientHeight / scale - 1000) / 2),
        });
      }
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [game, setGame] = useState(() => ({
    ...createGameState(TEXT_DATA.passages, 0, 0, 3, [], 3, 0),
    phase: 'hero' as 'hero' | 'typing' | 'done',
    carriage: { line: 3, col: 17, sweep: false },
  }));

  const gameRef = useRef(game);
  gameRef.current = game;

  const [pressedKeys, setPressedKeys] = useState<Record<string, number>>({});
  const [swings, setSwings] = useState<
    { id: number; x: number; y: number; rest: number; hit: number; short: number; long: number }[]
  >([]);
  const [glowKeys, setGlowKeys] = useState<Record<string, { mark: number; miss: boolean }>>({});
  const [strikeFadeId, setStrikeFadeId] = useState<number | null>(null);
  const [isEjecting, setIsEjecting] = useState(false);
  const [isReceiptShown, setIsReceiptShown] = useState(false);
  const [isCtaPressed, setIsCtaPressed] = useState(false);

  const timeoutIds = useRef<number[]>([]);
  const introTimeoutIds = useRef<number[]>([]);

  const safeSetTimeout = (delay: number, fn: () => void) => {
    const tid = window.setTimeout(fn, delay);
    timeoutIds.current.push(tid);
    return tid;
  };

  const safeSetIntroTimeout = (delay: number, fn: () => void) => {
    const tid = window.setTimeout(fn, delay);
    introTimeoutIds.current.push(tid);
    return tid;
  };

  const clearIntroTimers = () => {
    introTimeoutIds.current.splice(0).forEach((t) => window.clearTimeout(t));
  };

  const triggerKeyAction = (keyId: string | null, isMiss = false) => {
    if (!keyId) return;
    const mark = globalUID++;
    setPressedKeys((prev) => ({ ...prev, [keyId]: mark }));
    setGlowKeys((prev) => ({ ...prev, [keyId]: { mark, miss: isMiss } }));
    safeSetTimeout(110, () => {
      setPressedKeys((prev) => {
        if (prev[keyId] !== mark) return prev;
        const copy = { ...prev };
        delete copy[keyId];
        return copy;
      });
    });
  };

  const triggerTypebarSwing = (keyId: string | null) => {
    const keyIndex = KEYS.findIndex((k) => k.id === keyId);
    if (keyIndex < 0) return;

    // Angle and trajectory across basket towards the platen center
    const angle = Math.PI * (0.94 - (keyIndex / (KEYS.length - 1)) * 0.88);
    const originX = 2757 + BASKET_RADIUS * Math.cos(angle);
    const originY = 817 + BASKET_WIDTH * Math.sin(angle);
    const targetSlot = { x: 2757 + V_DIST * Math.cos(angle), y: 817 + K_DIST * Math.sin(angle) };
    const platenCenter = { x: 2755, y: 492 };

    const shortLen = Math.hypot(targetSlot.x - originX, targetSlot.y - originY);
    const longLen = Math.hypot(platenCenter.x - originX, platenCenter.y - originY);
    const hitAngle = (180 * Math.atan2(platenCenter.y - originY, platenCenter.x - originX)) / Math.PI;
    let restAngle =
      shortLen < 140
        ? hitAngle
        : (180 * Math.atan2(targetSlot.y - originY, targetSlot.x - originX)) / Math.PI;

    while (restAngle - hitAngle > 180) restAngle -= 360;
    while (hitAngle - restAngle > 180) restAngle += 360;

    const swingItem = {
      x: originX,
      y: originY,
      rest: restAngle,
      hit: hitAngle,
      short: Math.max(shortLen, 40),
      long: longLen,
      id: globalUID++,
    };

    setSwings((prev) => [...prev.slice(-3), swingItem]);
    safeSetTimeout(190, () => {
      setSwings((prev) => prev.filter((s) => s.id !== swingItem.id));
    });
  };

  // Start Typing CTA transition
  const handleStartTyping = () => {
    const current = gameRef.current;
    if (current.phase !== 'hero') return;

    clearIntroTimers();
    A.wake();
    A.press();

    const targetLine = current.carriage.line + 2 * (current.strikes.length ? 1 : 0);
    setGame({ ...current, phase: 'typing', first: targetLine });

    if (current.strikes.length) {
      const maxId = Math.max(...current.strikes.map((s) => s.id));
      setStrikeFadeId(maxId);
      safeSetTimeout(500, () => {
        setGame((prev) => ({
          ...prev,
          strikes: prev.strikes.filter((s) => s.id > maxId),
        }));
        setStrikeFadeId(null);
      });
    }

    safeSetIntroTimeout(650, () => {
      if (targetLine !== gameRef.current.carriage.line) A.feed();
      A.sweep(0.42);
      setGame((prev) => ({
        ...prev,
        carriage: { line: targetLine, col: 0, sweep: true },
      }));
    });
  };

  // Reset / Try Again CTA
  const handleResetGame = () => {
    const current = gameRef.current;
    if (current.phase === 'hero') return;

    clearIntroTimers();
    setIsEjecting(false);
    setIsReceiptShown(false);
    A.sweep(0.3);

    setGame(
      createGameState(
        TEXT_DATA.passages,
        current.round + 1,
        current.sheet + 1,
        0,
        [],
        current.carriage.line,
        current.carriage.col
      )
    );
  };

  // Autonomous Typewriter demo typing the intro note
  useEffect(() => {
    const note = TEXT_DATA.note;
    let delay = 900;

    note.forEach((lineText, lineIdx) => {
      const targetLine = gameRef.current.carriage.line + lineIdx;

      safeSetIntroTimeout(delay, () => {
        const cur = gameRef.current;
        if (cur.carriage.col !== 0 || cur.carriage.line !== targetLine) {
          if (lineIdx > 0) A.ding();
          if (cur.carriage.line !== targetLine) A.feed();
          A.sweep(0.36);
          setGame((prev) => ({
            ...prev,
            carriage: { line: targetLine, col: 0, sweep: true },
          }));
        }
      });

      delay += 760;

      Array.from(lineText).forEach((char, colIdx) => {
        safeSetIntroTimeout(delay, () => {
          const cur = gameRef.current;
          const keyId = char === '%' ? '5' : char.toLowerCase();
          if (char === '%' || char !== keyId) triggerKeyAction('shift');
          triggerKeyAction(getCharKeyId(char));

          if (char === ' ') {
            A.space();
          } else {
            triggerTypebarSwing(getCharKeyId(char));
            A.strike(0.9);
          }

          const strikes =
            char === ' '
              ? cur.strikes
              : [...cur.strikes, createStrike(targetLine, colIdx, char, false)];

          setGame({
            ...cur,
            strikes,
            carriage: { line: targetLine, col: colIdx + 1, sweep: false },
          });
        });

        delay +=
          115 +
          95 * Z(100 * lineIdx + colIdx, 7) +
          (char === '.' || char === ',' ? 280 : 50 * (char === ' ' ? 1 : 0));
      });

      delay += 420;
    });

    safeSetIntroTimeout(delay + 500, () => {
      A.sweep(0.34);
      setGame((prev) => ({
        ...prev,
        carriage: { ...prev.carriage, col: 17, sweep: true },
      }));
    });

    return () => {
      clearIntroTimers();
    };
  }, []);

  // Keyboard Event Handlers for Interactive Typing Test
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      A.wake();
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const current = gameRef.current;

      if (current.phase === 'hero') {
        if (e.key === 'Enter' && !e.repeat) {
          e.preventDefault();
          setIsCtaPressed(true);
          safeSetTimeout(130, () => {
            setIsCtaPressed(false);
            handleStartTyping();
          });
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        handleResetGame();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (current.phase !== 'typing' || current.pos === 0 || current.pos >= current.text.length)
          return;

        const prevSpot = current.spots[current.pos - 1];
        if (prevSpot.wrap) return;

        const typedCopy = current.typed.slice();
        typedCopy[current.pos - 1] = null;
        A.back();
        triggerKeyAction('backspace');
        setGame({
          ...current,
          typed: typedCopy,
          pos: current.pos - 1,
          carriage: {
            line: current.first + prevSpot.line,
            col: prevSpot.col,
            sweep: false,
          },
        });
        return;
      }

      if (e.key.length === 1 && !e.repeat) {
        e.preventDefault();
        const inputChar = e.key.toLowerCase();
        if (current.phase !== 'typing' || current.pos >= current.text.length) return;

        if (current.pos === 0) clearIntroTimers();

        const spot = current.spots[current.pos];
        const targetChar = current.text[current.pos];
        const linePos = current.first + spot.line;
        const typedCopy = current.typed.slice();
        typedCopy[current.pos] = inputChar;

        const isMismatch = inputChar !== targetChar;
        const newStrikes =
          inputChar === ' '
            ? current.strikes
            : [...current.strikes, createStrike(linePos, spot.col, inputChar, isMismatch)];

        const nextPos = current.pos + 1;
        const startTime = current.started || performance.now();

        let newCarriage;
        if (spot.wrap) {
          newCarriage = { line: linePos + 1, col: 0, sweep: true };
          if (inputChar !== ' ') A.strike();
          A.ding();
          safeSetTimeout(70, () => A.feed());
          A.sweep(0.38);
        } else {
          newCarriage = {
            line: linePos,
            col: nextPos < current.text.length ? current.spots[nextPos].col : spot.col + 1,
            sweep: false,
          };
          if (inputChar === ' ') A.space();
          else A.strike();
        }

        triggerKeyAction(getCharKeyId(inputChar), isMismatch);
        if (inputChar !== ' ') triggerTypebarSwing(getCharKeyId(inputChar));

        const updatedState = {
          ...current,
          typed: typedCopy,
          pos: nextPos,
          strikes: newStrikes,
          started: startTime,
          carriage: newCarriage,
          keystrokes: current.keystrokes + 1,
          mistakes: current.mistakes + (isMismatch ? 1 : 0),
        };

        setGame(updatedState);

        // Completion check
        if (nextPos === current.text.length) {
          const totalSec = (performance.now() - startTime) / 1000;
          const correctChars = typedCopy.filter((c, i) => c === current.text[i]).length;
          const mins = Math.max(totalSec / 60, 1 / 60);
          const wpm = Math.round(correctChars / 5 / mins);
          const cpm = Math.round(correctChars / mins);
          const accuracy = updatedState.keystrokes
            ? Math.round((correctChars / updatedState.keystrokes) * 100)
            : 100;

          const statsResult = {
            wpm,
            cpm,
            accuracy,
            seconds: totalSec,
            typos: updatedState.mistakes,
            date: Date.now(),
          };

          safeSetIntroTimeout(250, () => {
            A.eject();
            setIsEjecting(true);
            setGame((prev) => ({
              ...prev,
              phase: 'done',
              result: statsResult,
            }));
          });

          safeSetIntroTimeout(1500, () => {
            setIsReceiptShown(true);
            A.land();
          });

          groupTypos(updatedState.strikes.filter((s) => s.red)).forEach((_, idx) => {
            safeSetIntroTimeout(2400 + 380 * idx, () => A.pen());
          });
        }
      }
    };

    const onPointerDown = () => A.wake();

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('pointerdown', onPointerDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('pointerdown', onPointerDown);
      timeoutIds.current.forEach((t) => window.clearTimeout(t));
      introTimeoutIds.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const isHero = game.phase === 'hero';
  const isTyping = game.phase === 'typing';
  const isDone = game.phase === 'done';

  const camera = isTyping ? CAMERA_TEST : CAMERA_HERO;
  const bounds = isTyping ? BOUNDS.test : BOUNDS.hero;

  const currentWordsCount =
    game.pos >= game.text.length
      ? game.text.split(' ').length
      : game.text.slice(0, game.pos).split(' ').length - 1;
  const totalWordsCount = game.text.split(' ').length;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden select-none bg-[#e7e7e8] text-[#22232a]"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
      }}
    >
      {/* Top Header */}
      <Header
        currentPath="/play/typewriter"
        onOpenWaitlist={() => setIsWaitlistOpen(true)}
        onOpenMcp={() => setIsMcpOpen(true)}
      />

      <Artboard width={1600} height={1000}>
        {/* Drafting Grid Guidelines Behind Typewriter */}
        <GridLines
          edge={bounds.edge}
          top={-spareOffset.y}
          sunk={isTyping}
          layer="back"
        />

        {/* 3D Typewriter Assembly */}
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: 5504,
            height: 3072,
            transform: `translate(${camera.x - 2755 * camera.scale}px, ${
              camera.y - 478 * camera.scale
            }px) scale(${camera.scale})`,
            transition: 'transform 1.6s cubic-bezier(0.65, 0, 0.2, 1)',
          }}
        >
          {/* Shadow */}
          <TypewriterSprite name="shadow" />

          {/* Sliding Carriage Component */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translateX(${(17 - game.carriage.col) * 54}px)`,
              transition: game.carriage.sweep
                ? 'transform 420ms cubic-bezier(0.55, 0, 0.25, 1) 70ms'
                : 'transform 110ms cubic-bezier(0.2, 0.8, 0.25, 1) 40ms',
            }}
          >
            {/* Back Carriage */}
            <TypewriterSprite name="back" />

            {/* Paper Sheet in Carriage */}
            <div
              className="absolute overflow-hidden"
              style={{ left: -6000, top: -6000, width: 17504, height: 6606 }}
            >
              <div
                className="absolute"
                style={{
                  left: PAPER_X + 6000,
                  top: PAPER_Y + 6000,
                  width: 2500,
                  height: 3240,
                  transform: isEjecting ? 'translateY(-4200px)' : 'none',
                  opacity: +!isEjecting,
                  transition: isEjecting
                    ? 'transform 0.8s cubic-bezier(0.55, 0, 0.75, 0.15), opacity 0.3s ease 0.5s'
                    : 'none',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    animation: game.sheet
                      ? 'typewriter-feed 0.7s cubic-bezier(0.3, 0, 0.2, 1) both'
                      : undefined,
                  }}
                >
                  <div
                    className="absolute inset-0 font-mono"
                    style={{
                      transform: `translateY(${-92 * game.carriage.line}px)`,
                      transition: 'transform 170ms cubic-bezier(0.3, 0, 0.2, 1)',
                      backgroundColor: '#fefdfa',
                      backgroundImage: `${NOISE_PATTERN}, linear-gradient(90deg, rgb(120 100 80 / 0.05), rgb(120 100 80 / 0) 6%, rgb(120 100 80 / 0) 94%, rgb(120 100 80 / 0.05))`,
                      backgroundSize: '1200px 1200px, 100% 100%',
                      boxShadow:
                        '0 0 0 1.5px rgb(70 60 50 / 0.12), 0 6px 16px rgb(20 24 32 / 0.05), 0 40px 120px rgb(20 24 32 / 0.09)',
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ filter: 'url(#typewriter-ink)' }}
                    >
                      {game.strikes.map((s) => (
                        <span
                          key={s.id}
                          className="absolute text-center"
                          style={{
                            left: 332 + 54 * s.col + s.dx,
                            top: 760 + 92 * s.line + s.dy,
                            width: 54,
                            fontSize: 90,
                            lineHeight: '92px',
                            color: s.red ? COLOR_RED : '#1e2024',
                            opacity:
                              strikeFadeId != null && s.id <= strikeFadeId
                                ? 0
                                : s.ink,
                            transition: 'opacity 0.4s ease',
                            transform: `rotate(${s.tilt}deg)`,
                            animation:
                              s.id >= 0
                                ? 'typewriter-ink 1ms linear 50ms both'
                                : undefined,
                          }}
                        >
                          {s.char}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Roller Shadows & Platen Highlights */}
              <div
                className="absolute inset-0"
                style={{
                  opacity: +!isEjecting,
                  transition: isEjecting ? 'opacity 0.4s ease 0.2s' : 'none',
                }}
              >
                <div
                  className="absolute"
                  style={{
                    left: PAPER_X + 6000,
                    top: 6230,
                    width: 2500,
                    height: 120,
                    background:
                      'linear-gradient(rgb(24 28 36 / 0), rgb(24 28 36 / 0.06) 50%, rgb(24 28 36 / 0))',
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    left: PAPER_X + 6000,
                    top: 6336,
                    width: 2500,
                    height: 60,
                    background:
                      'linear-gradient(rgb(12 14 18 / 0.24), rgb(12 14 18 / 0))',
                  }}
                />
                {ROLLER_SLOTS.map((slot) => (
                  <div
                    key={slot}
                    className="absolute rounded-[40px]"
                    style={{
                      left: 6000 + slot - 14,
                      top: 6348,
                      width: 236,
                      height: 84,
                      background: 'rgb(12 14 18 / 0.3)',
                      filter: 'blur(14px)',
                    }}
                  />
                ))}
                <div
                  className="absolute"
                  style={{
                    left: PAPER_X + 6000,
                    top: 6512,
                    width: 2500,
                    height: 94,
                    background:
                      'linear-gradient(rgb(24 28 36 / 0), rgb(24 28 36 / 0.3))',
                  }}
                />
              </div>
            </div>

            {/* Paper Bail Bar */}
            <TypewriterSprite
              name="bail"
              style={{ top: MACHINE_PARTS.bail.y - 110 }}
            />
          </div>

          {/* Machine Body */}
          <TypewriterSprite name="body" />

          {/* 44 Individual Mechanical Keycaps */}
          {KEYS.map((k) => (
            <Keycap
              key={k.id}
              cap={k}
              label={k.label}
              down={pressedKeys[k.id] != null}
              glow={glowKeys[k.id]}
            />
          ))}

          {/* Spacebar */}
          <Spacebar
            down={pressedKeys.space != null}
            glow={glowKeys.space}
          />

          {/* Swinging Typebars */}
          {swings.map((s) => (
            <TypebarStriker key={s.id} swing={s} />
          ))}

          {/* Carriage Return Lever */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translateX(${(17 - game.carriage.col) * 54}px)`,
              transition: game.carriage.sweep
                ? 'transform 420ms cubic-bezier(0.55, 0, 0.25, 1) 70ms'
                : 'transform 110ms cubic-bezier(0.2, 0.8, 0.25, 1) 40ms',
            }}
          >
            <TypewriterSprite name="lever" />
          </div>
        </div>

        {/* Top Vignette Gradient */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: bounds.edge - 40 + 1,
            right: bounds.edge - 40 + 1,
            top: -spareOffset.y,
            height: 330 + spareOffset.y,
            background: `linear-gradient(${COLOR_BG} ${
              231 + spareOffset.y
            }px, rgb(231 231 232 / 0) ${330 + spareOffset.y}px)`,
            opacity: +!!isTyping,
            transition: `opacity 0.8s ease 0.6s, left ${TRANSITION_GRID}, right ${TRANSITION_GRID}`,
          }}
        />

        {/* Grid Guidelines In Front */}
        <GridLines
          edge={bounds.edge}
          top={-spareOffset.y}
          sunk={isTyping}
          layer="front"
        />

        {/* Hero Section */}
        <div
          className="absolute flex flex-col items-start text-left"
          style={{
            left: BOUNDS.hero.inner,
            top: 348,
            color: COLOR_INK,
            opacity: +isHero,
            transform: !isHero
              ? `translateX(${BOUNDS.test.edge - BOUNDS.hero.edge}px)`
              : 'none',
            filter: !isHero ? 'blur(6px)' : 'none',
            pointerEvents: isHero ? 'auto' : 'none',
            transition: `opacity 0.5s ease, transform ${TRANSITION_GRID}, filter 0.5s ease`,
          }}
        >
          <h1
            className="font-mono"
            style={{
              fontSize: 68,
              lineHeight: '68px',
              fontWeight: 400,
              letterSpacing: -2,
              filter: 'url(#typewriter-ink-fine)',
            }}
          >
            {TEXT_DATA.title.map((line, lineIndex) => (
              <span key={line} className="block whitespace-nowrap">
                {Array.from(line).map((char, charIndex) => {
                  const seed =
                    TEXT_DATA.title.slice(0, lineIndex).join('').length +
                    charIndex;
                  return char === ' ' ? (
                    <span
                      key={charIndex}
                      className="inline-block"
                      style={{ width: '0.38em' }}
                    />
                  ) : (
                    <span
                      key={charIndex}
                      className="inline-block"
                      style={{
                        color:
                          0 === lineIndex && charIndex < TEXT_DATA.red
                            ? COLOR_RED
                            : COLOR_INK,
                        opacity: Number((0.84 + 0.16 * Z(seed, 9)).toFixed(3)),
                        transform: `translateY(${((Z(seed, 5) - 0.5) * 3).toFixed(
                          2
                        )}px) rotate(${((Z(seed, 6) - 0.5) * 2).toFixed(2)}deg)`,
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
                {1 === lineIndex && (
                  <span
                    className="ml-2 inline-block rounded-full align-[-7px]"
                    style={{
                      width: 4,
                      height: 54,
                      background: COLOR_RED,
                      animationName: 'typewriter-blink',
                      animationDuration: '1.1s',
                      animationIterationCount: 'infinite',
                      animationTimingFunction: 'steps(1)',
                    }}
                  />
                )}
              </span>
            ))}
          </h1>

          <p
            className="mt-3 max-w-[500px] text-balance text-[17px] leading-[27px]"
            style={{ color: COLOR_MUTED }}
          >
            {TEXT_DATA.description}
          </p>

          <div className="mt-8 flex items-center gap-3">
            <span className="group/cta relative inline-flex">
              {/* Rays */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-full z-0 h-[92px] opacity-0 transition-opacity duration-700 group-hover/cta:opacity-100"
              >
                <span className="typewriter-ray typewriter-ray-wide" />
                <span className="typewriter-ray typewriter-ray-narrow" />
              </span>

              {/* Tiny Paper Bookmark Tag Peek */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-1/2 left-1/2 z-0 h-24 w-24 -translate-x-1/2 overflow-hidden"
              >
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full rotate-6 transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] group-hover/cta:translate-y-[6px] group-hover/cta:-rotate-3">
                  <span
                    className="flex h-[62px] w-[50px] flex-col gap-[5px] rounded-[3px] px-[8px] pt-[11px]"
                    style={{
                      backgroundColor: '#fcfbf7',
                      boxShadow:
                        '0 0 0 1px rgb(70 60 50 / 0.12), 0 4px 10px rgb(20 24 32 / 0.16)',
                    }}
                  >
                    <span className="h-[2px] w-full rounded-full bg-[#2a2c31]/70" />
                    <span className="h-[2px] w-[80%] rounded-full bg-[#2a2c31]/70" />
                    <span
                      className="h-[2px] w-[55%] rounded-full"
                      style={{ background: COLOR_RED }}
                    />
                  </span>
                </span>
              </span>

              <button
                type="button"
                onClick={handleStartTyping}
                data-pressed={isCtaPressed || undefined}
                className="typewriter-cta relative z-10 flex h-12 cursor-pointer items-center gap-2.5 rounded-full pr-[7px] pl-[22px] text-[16px] font-[590]"
              >
                {TEXT_DATA.start}
                <span
                  className="grid size-[34px] place-items-center rounded-full"
                  style={{
                    background: 'rgb(255 255 255 / 0.1)',
                    boxShadow:
                      'inset 0 1px 0 rgb(255 255 255 / 0.16), inset 0 -1px 0 rgb(0 0 0 / 0.3)',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 1px 0 rgb(0 0 0 / 0.4))' }}
                  >
                    <path d="M13 3.5v4.25a2 2 0 0 1-2 2H3.5M6.5 6.5l-3 3.25 3 3.25" />
                  </svg>
                </span>
              </button>
            </span>

            <button
              type="button"
              className="flex h-12 cursor-pointer items-center gap-2 rounded-full px-5 text-[16px] font-medium transition-colors duration-200 hover:bg-black/[0.04]"
              style={{
                color: COLOR_INK,
                boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 0.2)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M5 2.75h6v3.5a3 3 0 0 1-6 0v-3.5ZM5 4H2.75v.75A2.25 2.25 0 0 0 5 7M11 4h2.25v.75A2.25 2.25 0 0 1 11 7M8 9.25v2.5M5.5 13.25h5M6.25 11.75h3.5" />
              </svg>
              {TEXT_DATA.secondary}
            </button>
          </div>
        </div>

        {/* Text Prompter Above Typewriter */}
        <div
          className="absolute"
          style={{
            left: BOUNDS.test.inner,
            top: 140 - spareOffset.y,
            width: BOUNDS.test.span,
            opacity: !isHero && !isDone ? 1 : 0,
            transition:
              !isHero && !isDone ? 'opacity 0.6s ease 0.9s' : 'opacity 0.4s ease',
          }}
        >
          <div
            className="absolute -top-9 left-0 text-[19px] font-mono font-medium"
            style={{ color: COLOR_ACCENT }}
          >
            {currentWordsCount}/{totalWordsCount}
          </div>
          <TypingPrompter
            key={game.round}
            text={game.text}
            typed={game.typed}
            pos={game.pos}
          />
        </div>

        {/* Score Receipt Card on Test Completion */}
        <ScoreReceipt
          game={game}
          shown={isReceiptShown}
          left={BOUNDS.hero.inner + 12}
          top={283}
        />

        {/* Post-Test Restart & Download Buttons */}
        <div
          className="absolute flex items-center gap-3"
          style={{
            left: BOUNDS.hero.inner + 12,
            top: 679,
            opacity: +isReceiptShown,
            transform: isReceiptShown ? 'none' : 'translateY(10px)',
            pointerEvents: isReceiptShown ? 'auto' : 'none',
            transition: isReceiptShown
              ? 'opacity 0.5s ease 0.9s, transform 0.5s ease 0.9s'
              : 'none',
          }}
        >
          <button
            type="button"
            onClick={handleResetGame}
            className="typewriter-cta relative z-10 flex h-12 cursor-pointer items-center gap-2.5 rounded-full pr-[7px] pl-[22px] text-[16px] font-[590]"
          >
            {TEXT_DATA.again}
            <span
              className="grid h-[34px] min-w-[34px] place-items-center rounded-full px-2 text-[12px] font-semibold"
              style={{
                background: 'rgb(255 255 255 / 0.1)',
                boxShadow:
                  'inset 0 1px 0 rgb(255 255 255 / 0.16), inset 0 -1px 0 rgb(0 0 0 / 0.3)',
              }}
            >
              Tab
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              A.wake();
              A.pen();
              downloadReceiptImage(game);
            }}
            className="flex h-12 cursor-pointer items-center gap-2 rounded-full px-5 text-[16px] font-medium transition-all duration-200 hover:bg-black/[0.05] active:scale-95"
            style={{
              color: COLOR_INK,
              boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 0.2)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M8 2.75v7.5M5 7.5l3 3 3-3M3 13.25h10" />
            </svg>
            {TEXT_DATA.download}
          </button>
        </div>

        {/* SVG Filters & CSS Animations */}
        <svg className="absolute size-0">
          <filter id="typewriter-ink">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.35"
              numOctaves="2"
              seed="4"
            />
            <feDisplacementMap in="SourceGraphic" scale="5" />
          </filter>
          <filter id="typewriter-ink-fine">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed="7"
            />
            <feDisplacementMap in="SourceGraphic" scale="1.6" />
          </filter>
        </svg>

        <style>{`
          .typewriter-cta {
            position: relative;
            isolation: isolate;
            color: #fff;
            background-image: linear-gradient(100deg, #191a1f 0%, #23252c 22%, #383b45 46%, #40434d 54%, #292b33 78%, #1a1b21 100%);
            text-shadow: 0 1px 0 rgb(8 10 16 / 0.45);
            box-shadow: 0 0 0 1px #0c0d11, 0 4px 12px rgb(18 20 28 / 0.3);
            transition: transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
          }
          .typewriter-cta::before {
            content: "";
            position: absolute;
            inset: 0;
            z-index: -1;
            border-radius: inherit;
            background: rgb(255 255 255 / 0.07);
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
          }
          .typewriter-cta::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1px;
            background: linear-gradient(180deg, rgb(255 255 255 / 0.32), rgb(255 255 255 / 0));
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
            pointer-events: none;
          }
          .typewriter-cta:hover::before {
            opacity: 1;
          }
          .typewriter-cta:hover {
            box-shadow: 0 0 0 1px #0c0d11, 0 2px 8px rgb(18 20 28 / 0.26);
          }
          .typewriter-cta:active, .typewriter-cta[data-pressed] {
            transform: translateY(1px) scale(0.975);
          }
          .typewriter-ray {
            position: absolute;
            bottom: 0;
            left: 50%;
            height: 100%;
            translate: -50% 0;
          }
          .typewriter-ray-wide {
            width: 140%;
            clip-path: polygon(0 0, 100% 0, 80% 100%, 20% 100%);
            background: linear-gradient(180deg, rgb(34 35 42 / 0) 22%, rgb(34 35 42 / 0.06) 100%);
          }
          .typewriter-ray-narrow {
            width: 104%;
            clip-path: polygon(0 0, 100% 0, 78.8% 100%, 21.2% 100%);
            background: linear-gradient(180deg, rgb(34 35 42 / 0) 0%, rgb(34 35 42 / 0.06) 100%);
          }
          @keyframes typewriter-feed {
            from { transform: translateY(900px); }
            to { transform: none; }
          }
          @keyframes typewriter-ink {
            from { visibility: hidden; }
            to { visibility: visible; }
          }
          @keyframes typewriter-blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
          }
          @keyframes typewriter-fade {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes typewriter-pen {
            to { stroke-dashoffset: 0; }
          }
          @keyframes typewriter-legend {
            from {
              color: var(--glow);
              text-shadow: 0 0 6px var(--glow), 0 0 24px var(--glow);
            }
            to {
              color: rgb(226 229 236 / 0.92);
              text-shadow: 0 0 0 transparent;
            }
          }
          @keyframes typewriter-swing {
            0% {
              transform: rotate(var(--rest));
              width: var(--short);
            }
            34%, 48% {
              transform: rotate(var(--hit));
              width: var(--long);
            }
            100% {
              transform: rotate(var(--rest));
              width: var(--short);
            }
          }
        `}</style>
      </Artboard>

      {/* Floating Toolbar with "Get code", restart & download */}
      <TypewriterToolbar
        onOpenGetCode={() => setIsGetCodeOpen(true)}
        onRestart={handleResetGame}
        onDownloadPaper={() => {
          A.wake();
          A.pen();
          downloadReceiptImage(game);
        }}
        isComplete={isReceiptShown}
      />

      {/* Get Code Modal */}
      <TypewriterGetCodeModal
        isOpen={isGetCodeOpen}
        onClose={() => setIsGetCodeOpen(false)}
        onOpenMcpFull={() => setIsMcpOpen(true)}
      />

      {/* MCP Dedicated Modal */}
      <McpModal
        isOpen={isMcpOpen}
        onClose={() => setIsMcpOpen(false)}
      />

      {/* Waitlist Modal */}
      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </div>
  );
};

// --- Subcomponents ---

const TypewriterSprite: React.FC<{
  name: string;
  style?: React.CSSProperties;
}> = ({ name, style }) => {
  const info = MACHINE_PARTS[name];
  if (!info) return null;
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: info.x,
        top: info.y,
        width: info.width,
        height: info.height,
        backgroundImage: `url(${ASSET_PATH}/${name}.webp)`,
        backgroundSize: '100% 100%',
        ...style,
      }}
    />
  );
};

const Keycap: React.FC<{
  cap: { x: number; y: number; width: number; height: number };
  label: string;
  down: boolean;
  glow?: { mark: number; miss: boolean };
}> = ({ cap, label, down, glow }) => {
  const bevel = 0.62 * cap.height;
  const bounding = {
    left: cap.x - cap.width / 2 - 6,
    top: cap.y - cap.height / 2 - 6,
    width: cap.width + 12,
    height: cap.height + bevel + 12,
  };
  const isPunctuation = label.length === 1 && !/[A-Z0-9]/.test(label);
  const isWide = cap.width > 280;

  return (
    <React.Fragment>
      {/* Recessed key well shadow */}
      <div
        className="absolute rounded-[50%]"
        style={{
          left: cap.x - cap.width / 2,
          top: cap.y - cap.height / 2,
          width: cap.width,
          height: cap.height + 16,
          background: '#08090b',
          opacity: +down,
        }}
      />
      {/* 3D Keycap surface */}
      <div
        className="absolute"
        style={{
          ...bounding,
          borderRadius: `${bounding.width / 2}px / ${(cap.height + 12) / 2}px`,
          backgroundImage: `url(${ASSET_PATH}/body.webp)`,
          backgroundSize: `${MACHINE_PARTS.body.width}px ${MACHINE_PARTS.body.height}px`,
          backgroundPosition: `${MACHINE_PARTS.body.x - bounding.left}px ${
            MACHINE_PARTS.body.y - bounding.top
          }px`,
          transform: down ? 'translateY(18px)' : 'none',
          filter: down ? 'brightness(0.82)' : 'none',
          transition: down
            ? 'transform 30ms ease-out, filter 30ms'
            : 'transform 140ms cubic-bezier(0.3, 1.5, 0.5, 1), filter 140ms',
        }}
      >
        {glow && (
          <div
            key={glow.mark}
            className="absolute rounded-[50%]"
            style={{
              left: 6,
              top: 6,
              width: cap.width,
              height: cap.height,
              background: `radial-gradient(closest-side, ${
                glow.miss ? 'rgb(240 70 64 / 0.6)' : 'rgb(255 128 56 / 0.6)'
              }, transparent)`,
              mixBlendMode: 'screen',
              animation: 'typewriter-fade 0.9s ease-out both',
            }}
          />
        )}
        <div
          className="absolute inset-x-0 text-center select-none"
          style={{
            top: 6 + cap.height / 2,
            fontSize: isPunctuation || isWide ? 82 : 74,
            lineHeight: 1,
            fontWeight: 500,
            color: 'rgb(226 229 236 / 0.92)',
            transform: `translateY(-50%) scaleY(${Math.min(
              0.78,
              Math.max(0.55, (cap.height / cap.width) * 1.45)
            )})`,
          }}
        >
          <span
            key={glow?.mark}
            style={
              glow
                ? ({
                    '--glow': glow.miss ? '#ff5a52' : '#ff8a4a',
                    animation: 'typewriter-legend 0.9s ease-out both',
                  } as React.CSSProperties)
                : undefined
            }
          >
            {label}
          </span>
        </div>
      </div>
    </React.Fragment>
  );
};

const Spacebar: React.FC<{
  down: boolean;
  glow?: { mark: number; miss: boolean };
}> = ({ down, glow }) => {
  return (
    <React.Fragment>
      <div
        className="absolute rounded-[40px]"
        style={{
          left: 1500,
          top: 2188,
          width: 2518,
          height: 110,
          background: '#08090b',
          opacity: +down,
        }}
      />
      <div
        className="absolute rounded-[44px]"
        style={{
          left: 1490,
          top: 2182,
          width: 2538,
          height: 190,
          backgroundImage: `url(${ASSET_PATH}/body.webp)`,
          backgroundSize: `${MACHINE_PARTS.body.width}px ${MACHINE_PARTS.body.height}px`,
          backgroundPosition: `${MACHINE_PARTS.body.x - 1490}px ${
            MACHINE_PARTS.body.y - 2182
          }px`,
          transform: down ? 'translateY(16px)' : 'none',
          filter: down ? 'brightness(0.85)' : 'none',
          transition: down
            ? 'transform 30ms ease-out, filter 30ms'
            : 'transform 150ms cubic-bezier(0.3, 1.4, 0.5, 1), filter 150ms',
        }}
      >
        {glow && (
          <div
            key={glow.mark}
            className="absolute inset-x-[6%] top-[4px] h-[96px] rounded-[50%]"
            style={{
              background: `radial-gradient(closest-side, ${
                glow.miss ? 'rgb(240 70 64 / 0.5)' : 'rgb(255 128 56 / 0.5)'
              }, transparent)`,
              mixBlendMode: 'screen',
              animation: 'typewriter-fade 0.9s ease-out both',
            }}
          />
        )}
      </div>
    </React.Fragment>
  );
};

const TypebarStriker: React.FC<{
  swing: {
    x: number;
    y: number;
    rest: number;
    hit: number;
    short: number;
    long: number;
  };
}> = ({ swing }) => {
  const vars = {
    '--rest': `${swing.rest}deg`,
    '--hit': `${swing.hit}deg`,
    '--short': `${swing.short}px`,
    '--long': `${swing.long}px`,
  } as React.CSSProperties;

  return (
    <div
      className="absolute rounded-full"
      style={{
        ...vars,
        left: swing.x,
        top: swing.y - 11,
        height: 22,
        transformOrigin: '0 50%',
        background: 'linear-gradient(#a3a9b3, #40444c 45%, #1b1e24)',
        animation: 'typewriter-swing 170ms cubic-bezier(0.3, 0, 0.3, 1) both',
      }}
    >
      <div
        className="absolute top-1/2 right-0 -translate-y-1/2 rounded-[6px]"
        style={{
          width: 50,
          height: 40,
          background: 'linear-gradient(#d3d8df, #7d838e)',
        }}
      />
    </div>
  );
};

const GridLines: React.FC<{
  edge: number;
  top: number;
  sunk: boolean;
  layer: 'back' | 'front';
}> = ({ edge, top, sunk, layer }) => {
  const r = top + 70;
  const n = sunk ? 1000 - top + 80 : 1000 - top - 70;
  const l =
    layer === 'front'
      ? [{ y: r, style: {} }]
      : [
          {
            y: n,
            style: {
              opacity: +!sunk,
              transition:
                'top 1s cubic-bezier(0.65, 0, 0.2, 1), opacity 0.7s ease 0.2s',
            },
          },
        ];

  return (
    <div
      className="pointer-events-none absolute overflow-hidden"
      style={{ left: -3000, top: -3000, width: 7600, height: 7000 }}
    >
      <div
        className="absolute"
        style={{ left: 3000, top: 3000, width: 1600, height: 1000 }}
      >
        {layer === 'back' &&
          [
            { left: -3000, width: 3000 + edge - 40 },
            { left: 1600 - edge + 40 + 1, width: 3000 },
          ].map((item, idx) => (
            <div
              key={idx}
              className="absolute"
              style={{
                ...item,
                top: r + 1,
                height: n - r - 1,
                backgroundImage:
                  'repeating-linear-gradient(-45deg, rgb(34 35 42 / 0.11) 0 1px, transparent 1px 9px)',
                transition: `height 1s cubic-bezier(0.65, 0, 0.2, 1), left ${TRANSITION_GRID}, width ${TRANSITION_GRID}`,
              }}
            />
          ))}

        {layer === 'back' &&
          [edge - 40, 1600 - edge + 40].map((lineX, idx) => (
            <div
              key={idx}
              className="absolute w-px"
              style={{
                left: lineX,
                top: -3000,
                height: 7000,
                backgroundImage: `repeating-linear-gradient(${COLOR_GRID_LINE} 0 6px, transparent 6px 12px)`,
                transition: `left ${TRANSITION_GRID}`,
              }}
            />
          ))}

        {l.map(({ y, style }, lineIdx) => (
          <div key={lineIdx}>
            <div
              className="absolute h-px"
              style={{
                left: -3000,
                top: y,
                width: 7600,
                backgroundImage: `repeating-linear-gradient(90deg, ${COLOR_GRID_LINE} 0 6px, transparent 6px 12px)`,
                ...style,
              }}
            />
            {[edge - 40, 1600 - edge + 40].map((crossX, crossIdx) => (
              <div
                key={crossIdx}
                className="absolute"
                style={{
                  left: crossX - 5,
                  top: y - 5,
                  width: 11,
                  height: 11,
                  ...style,
                  transition: [style.transition, `left ${TRANSITION_GRID}`]
                    .filter(Boolean)
                    .join(', '),
                }}
              >
                <div
                  className="absolute top-[5px] left-0 h-px w-full"
                  style={{ background: COLOR_CROSS }}
                />
                <div
                  className="absolute top-0 left-[5px] h-full w-px"
                  style={{ background: COLOR_CROSS }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const TypingPrompter: React.FC<{
  text: string;
  typed: (string | null)[];
  pos: number;
}> = ({ text, typed, pos }) => {
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [caret, setCaret] = useState({ x: 0, y: 0, ready: false });
  const [scrollY, setScrollY] = useState(0);

  useLayoutEffect(() => {
    const el = spanRefs.current[Math.min(pos, text.length - 1)];
    if (!el) return;
    const x = pos >= text.length ? el.offsetLeft + el.offsetWidth : el.offsetLeft;
    const y = el.offsetTop;
    setCaret({ x, y, ready: true });
    setScrollY(44 * Math.max(0, Math.round(y / 44) - 1));
  }, [pos, text]);

  let charIdx = 0;
  const wordSpans = text.split(' ').map((word, wordI, words) => {
    const letterSpans = Array.from(word).map((letter) => {
      const idx = charIdx++;
      const userChar = typed[idx];
      return (
        <span
          key={idx}
          ref={(e) => {
            spanRefs.current[idx] = e;
          }}
          style={{
            color:
              userChar == null
                ? 'rgb(34 35 42 / 0.26)'
                : userChar === letter
                ? COLOR_INK
                : '#e5484d',
            transition: 'color 80ms',
          }}
        >
          {letter}
        </span>
      );
    });

    const spaceIdx = wordI < words.length - 1 ? charIdx++ : -1;

    return (
      <span key={wordI}>
        <span className="inline-block whitespace-nowrap">{letterSpans}</span>
        {spaceIdx >= 0 && (
          <span
            ref={(e) => {
              spanRefs.current[spaceIdx] = e;
            }}
            style={{
              backgroundImage:
                typed[spaceIdx] != null && typed[spaceIdx] !== ' '
                  ? 'linear-gradient(#e5484d, #e5484d)'
                  : 'none',
              backgroundSize: '100% 3px',
              backgroundPosition: '0 88%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {' '}
          </span>
        )}
      </span>
    );
  });

  return (
    <div
      className="relative overflow-hidden font-mono"
      style={{
        height: 132,
        fontSize: 30,
        lineHeight: '44px',
        fontWeight: 400,
      }}
    >
      <div
        className="relative"
        style={{
          transform: `translateY(${-scrollY}px)`,
          transition: 'transform 0.28s cubic-bezier(0.3, 0, 0.2, 1)',
        }}
      >
        {wordSpans}
        <div
          className={`absolute top-0 left-0 rounded-full ${
            pos === 0 ? 'animate-pulse' : ''
          }`}
          style={{
            width: 3,
            height: 33,
            background: COLOR_ACCENT,
            opacity: +caret.ready,
            transform: `translate(${caret.x - 1}px, ${caret.y + 5.5}px)`,
            transition: 'transform 150ms cubic-bezier(0.35, 0.1, 0.25, 1)',
          }}
        />
      </div>
    </div>
  );
};

const ScoreReceipt: React.FC<{
  game: ReturnType<typeof createGameState>;
  shown: boolean;
  left: number;
  top: number;
}> = ({ game, shown, left, top }) => {
  const lineCount = Math.max(0, ...game.spots.map((s) => s.line)) + 1;
  const currentStrikes = game.strikes.filter(
    (s) => s.line >= game.first && s.line < game.first + lineCount
  );
  const typoStrikes = currentStrikes.filter((s) => s.red);
  const result = game.result;
  const typos = result?.typos ?? 0;
  const seconds = Math.round(result?.seconds ?? 0);
  const dateStr = result?.date
    ? new Date(result.date).toLocaleDateString(TEXT_DATA.locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left,
        top,
        width: 470,
        transformOrigin: '50% 0',
        transform: shown ? 'rotate(-3deg)' : 'translateY(-900px) rotate(-14deg)',
        opacity: +shown,
        transition: shown
          ? 'transform 0.95s cubic-bezier(0.2, 1.25, 0.35, 1), opacity 0.2s ease'
          : 'none',
      }}
    >
      <div
        className="relative rounded-[3px] px-8 pt-7 pb-7"
        style={{
          backgroundColor: '#fefdfa',
          backgroundImage: NOISE_PATTERN,
          backgroundSize: '300px 300px',
          boxShadow:
            [1, 2, 4, 8, 16, 32]
              .map((e) => `0 ${e}px ${e}px rgb(20 22 30 / 0.06)`)
              .join(', ') + ', 0 0 0 1px rgb(70 60 50 / 0.08)',
        }}
      >
        <div
          className="flex items-baseline justify-between font-mono"
          style={{ color: COLOR_INK }}
        >
          <span style={{ fontSize: 18, fontWeight: 700 }}>clack</span>
          <span style={{ fontSize: 14, color: COLOR_MUTED }}>{dateStr}</span>
        </div>

        <div
          className="relative mt-6 font-mono"
          style={{ height: 23 * lineCount }}
        >
          {currentStrikes.map((s) => (
            <span
              key={s.id}
              className="absolute text-center"
              style={{
                left: 11.4 * s.col + 0.2 * s.dx,
                top: (s.line - game.first) * 23 + 0.2 * s.dy,
                width: 11.4,
                fontSize: 19,
                lineHeight: '23px',
                color: s.red ? COLOR_RED : '#1e2024',
                opacity: s.ink,
              }}
            >
              {s.char}
            </span>
          ))}

          {shown && (
            <svg
              className="absolute inset-0 overflow-visible"
              width="100%"
              height="100%"
            >
              {groupTypos(typoStrikes).map((range, idx) => {
                const x = 11.4 * range.from - 4;
                const y = (range.line - game.first) * 23 + 1;
                const w = (range.to - range.from + 1) * 11.4 + 8;
                return (
                  <rect
                    key={`${range.line}-${range.from}`}
                    x={x}
                    y={y}
                    width={w}
                    height={23}
                    rx={11.5}
                    pathLength={1}
                    fill="none"
                    stroke={COLOR_RED}
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    transform={`rotate(${-2 + 4 * Z(range.from + 40 * range.line, 11)} ${
                      x + w / 2
                    } ${y + 11.5})`}
                    style={{
                      strokeDasharray: 1.04,
                      strokeDashoffset: 1.04,
                      animation: `typewriter-pen 0.4s ease-out ${
                        0.9 + 0.38 * idx
                      }s forwards`,
                    }}
                  />
                );
              })}
            </svg>
          )}
        </div>

        <div
          className="my-6 h-px"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${COLOR_GRID_LINE} 0 6px, transparent 6px 12px)`,
          }}
        />

        <div
          className="flex items-baseline font-mono"
          style={{ color: COLOR_INK }}
        >
          <span style={{ fontSize: 64, lineHeight: '56px', letterSpacing: -2 }}>
            {result?.wpm ?? 0}
          </span>
          <span className="ml-2" style={{ fontSize: 22 }}>
            {TEXT_DATA.words}
          </span>
          <span
            className="ml-8"
            style={{
              fontSize: 40,
              lineHeight: '40px',
              letterSpacing: -1,
              color: 'rgb(34 35 42 / 0.72)',
            }}
          >
            {result?.cpm ?? 0}
          </span>
          <span
            className="ml-1.5"
            style={{ fontSize: 18, color: 'rgb(34 35 42 / 0.72)' }}
          >
            {TEXT_DATA.chars}
          </span>
        </div>

        <div
          className="mt-4 flex gap-6 text-[15px] font-medium"
          style={{ color: COLOR_MUTED }}
        >
          <span className="flex items-center gap-1.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="8" cy="8" r="5.75" />
              <circle cx="8" cy="8" r="2.25" />
            </svg>
            {result?.accuracy ?? 0}% {TEXT_DATA.accuracy}
          </span>
          <span
            className="flex items-center gap-1.5"
            style={typos ? { color: COLOR_RED } : undefined}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M10.6 2.9l2.5 2.5-7.2 7.2-3.2.7.7-3.2 7.2-7.2Z" />
            </svg>
            {typos} {TEXT_DATA.typos(typos)}
          </span>
          <span className="flex items-center gap-1.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="8" cy="8" r="5.75" />
              <path d="M8 5v3.25l2 1.25" />
            </svg>
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}{' '}
            {TEXT_DATA.minutes}
          </span>
        </div>
      </div>
    </div>
  );
};
