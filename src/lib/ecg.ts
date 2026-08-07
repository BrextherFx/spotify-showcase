// Geometry + bitmap font ported 1:1 from the MicroPython watchface renderer.
export const W = 250;
export const H = 122;

export const LBL_HR_Y = 1;
export const GRID_TOP = 11;
export const BL = 61;
export const GRID_BOT = 110;
export const LBL_MN_Y = 113;

export const X0 = 7;
export const X1 = 242;
const XR = X1 - X0;

export const ECG_HW = 22;
export const PK = 42;

const ECG: [number, number][] = [
  [-1.0, 0.0],
  [-0.75, 0.0],
  [-0.62, 0.08],
  [-0.5, 0.15],
  [-0.38, 0.08],
  [-0.29, 0.0],
  [-0.21, 0.0],
  [-0.12, -0.1],
  [-0.04, 0.2],
  [0.0, 1.0],
  [0.04, 0.15],
  [0.08, -0.18],
  [0.17, -0.03],
  [0.25, 0.0],
  [0.37, 0.05],
  [0.5, 0.22],
  [0.62, 0.05],
  [0.75, 0.0],
  [1.0, 0.0],
];

export const FONT: Record<string, number[]> = {
  " ": [0, 0, 0, 0, 0, 0, 0, 0],
  "0": [0x3c, 0x66, 0x6e, 0x7e, 0x76, 0x66, 0x3c, 0x00],
  "1": [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7e, 0x00],
  "2": [0x3c, 0x66, 0x06, 0x1c, 0x30, 0x66, 0x7e, 0x00],
  "3": [0x3c, 0x66, 0x06, 0x1c, 0x06, 0x66, 0x3c, 0x00],
  "4": [0x0c, 0x1c, 0x3c, 0x6c, 0x7e, 0x0c, 0x0c, 0x00],
  "5": [0x7e, 0x60, 0x7c, 0x06, 0x06, 0x66, 0x3c, 0x00],
  "6": [0x1c, 0x30, 0x60, 0x7c, 0x66, 0x66, 0x3c, 0x00],
  "7": [0x7e, 0x66, 0x06, 0x0c, 0x18, 0x18, 0x18, 0x00],
  "8": [0x3c, 0x66, 0x66, 0x3c, 0x66, 0x66, 0x3c, 0x00],
  "9": [0x3c, 0x66, 0x66, 0x3e, 0x06, 0x0c, 0x38, 0x00],
  A: [0x18, 0x3c, 0x66, 0x66, 0x7e, 0x66, 0x66, 0x00],
  M: [0x63, 0x77, 0x7f, 0x6b, 0x63, 0x63, 0x63, 0x00],
  P: [0x7c, 0x66, 0x66, 0x7c, 0x60, 0x60, 0x60, 0x00],
};

export const hx = (h: number) => X0 + Math.floor(((h - 1) * 5 * XR) / 60);
export const mx = (m: number) => (m ? X0 + Math.floor((m * XR) / 60) : X0);

function amp(t: number): number {
  if (t <= -1 || t >= 1) return 0;
  for (let i = 0; i < ECG.length - 1; i++) {
    const p0 = ECG[i]!;
    const p1 = ECG[i + 1]!;
    const [t0, a0] = p0;
    const [t1, a1] = p1;
    if (t0 <= t && t <= t1) {
      const f = t1 !== t0 ? (t - t0) / (t1 - t0) : 0;
      return a0 + f * (a1 - a0);
    }
  }
  return 0;
}

/** Polyline path across the full width with one PQRST complex at `peakX`. */
export function tracePath(peakX: number, sign: 1 | -1): string {
  const pts: string[] = [];
  for (let x = 0; x < W; x++) {
    const d = x - peakX;
    const off = d >= -ECG_HW && d <= ECG_HW ? amp(d / ECG_HW) * PK : 0;
    pts.push(`${x},${(BL + sign * off).toFixed(2)}`);
  }
  return "M" + pts.join(" L");
}

export type Px = { x: number; y: number };

/** Bitmap glyph pixels for a string, centered on cx. */
export function textPixels(s: string, cx: number, y: number) {
  const tw = s.length * 8;
  const tx = Math.max(cx - Math.floor(tw / 2), 0);
  const on: Px[] = [];
  for (let ci = 0; ci < s.length; ci++) {
    const bitmap = FONT[s[ci] ?? " "] ?? FONT[" "]!;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((bitmap[row] ?? 0) & (1 << (7 - col)))
          on.push({ x: tx + ci * 8 + col, y: y + row });
      }
    }
  }
  return { on, tx, tw };
}

export function nearest5(minute: number) {
  const n = Math.floor((minute + 2) / 5) * 5;
  return n > 60 ? 60 : n;
}
