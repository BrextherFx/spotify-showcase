// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { createSeaFluid, emptySea, SeaFluid, SeaFrame } from './seaFluid';
import { createAquariumAudio, AquariumAudio } from './aquariumAudio';

// Color definitions matching Living UI design tokens
const COLORS = {
  ink: [21, 20, 19],          // #151413
  text: [239, 233, 222],      // #efe9de
  core: [255, 244, 228],      // #fff4e4
  accent: [236, 228, 212],    // #ece4d4
  deep: [3, 19, 26],          // #03131a
  sea: [58, 163, 184],        // #3aa3b8
  ember: [255, 125, 56],      // #ff7d38
  flame: [255, 180, 112],     // #ffb470
  kelpRoot: [31, 43, 14],     // #1f2b0e
  kelp: [93, 110, 34],        // #5d6e22
  kelpTip: [178, 173, 85],    // #b2ad55
  fish: [29, 40, 45],         // #1d282d
  fishBelly: [110, 129, 135], // #6e8187
  crab: [196, 71, 43],        // #c4472b
  crabDark: [106, 31, 18],    // #6a1f12
  clown: [242, 107, 33],      // #f26b21
  clownBand: [244, 239, 230], // #f4efe6
  tang: [36, 87, 214],        // #2457d6
  tangTail: [243, 197, 60],   // #f3c53c
  sand: [221, 181, 101],      // #ddb565
  sandDeep: [90, 69, 39],     // #5a4527
};

const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
const lerpColor = (c1: number[], c2: number[], t: number) =>
  c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
const colorRgbStr = (c: number[]) => c.join(', ');
const lerpColorStr = (c1: number[], c2: number[], t: number) =>
  lerpColor(c1, c2, t).join(', ');

export interface AquariumCanvasProps {
  onAudioChange?: (active: boolean) => void;
  isAudioOn?: boolean;
}

export const AquariumCanvas: React.FC<AquariumCanvasProps> = ({
  onAudioChange,
  isAudioOn,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<AquariumAudio | null>(null);
  const isAudioOnRef = useRef(isAudioOn);
  useEffect(() => {
    isAudioOnRef.current = isAudioOn;
  }, [isAudioOn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize Audio
    const audio = createAquariumAudio();
    audioRef.current = audio;
    if (typeof window !== "undefined") {
      (window as any).__aquariumAudio = audio;
    }

    // Fluid simulation instance
    let fluidInstance = createSeaFluid();
    let currentFrame: SeaFrame = emptySea();
    let sizeConfig: { width: number; height: number; floor: Float32Array; level: number; share: number } | null = null;
    let stepInput = { gx: 0, gy: 0, kickX: 0, kickY: 0, nudges: [] as number[], share: 1.0 };

    const fluidController = {
      get frame() {
        return currentFrame;
      },
      resize: (w: number, h: number, floorArr: Float32Array, level: number, share: number) => {
        sizeConfig = { width: w, height: h, floor: floorArr, level, share };
        fluidInstance.resize(w, h, floorArr, level);
        fluidInstance.pour(share);
        currentFrame = fluidInstance.frame();
      },
      step: (gx: number, gy: number, kickX: number, kickY: number, share: number) => {
        stepInput.gx = gx;
        stepInput.gy = gy;
        stepInput.kickX += kickX;
        stepInput.kickY += kickY;
        stepInput.share = share;

        for (let i = 0; i < stepInput.nudges.length; i += 5) {
          fluidInstance.nudge(
            stepInput.nudges[i],
            stepInput.nudges[i + 1],
            stepInput.nudges[i + 2],
            stepInput.nudges[i + 3],
            stepInput.nudges[i + 4]
          );
        }
        stepInput.nudges = [];
        fluidInstance.pour(stepInput.share);
        fluidInstance.step(stepInput.gx, stepInput.gy, stepInput.kickX, stepInput.kickY);
        stepInput.kickX = 0;
        stepInput.kickY = 0;
        currentFrame = fluidInstance.frame();
      },
      nudge: (x: number, y: number, r: number, vx: number, vy: number) => {
        stepInput.nudges.push(x, y, r, vx, vy);
      },
      top: (x: number) => {
        const { tops, h, height } = currentFrame;
        if (!tops || !tops.length) return waterLevel;
        const norm = Math.min(tops.length - 1, Math.max(0, x / h - 0.5));
        const idx = Math.floor(norm);
        const next = Math.min(tops.length - 1, idx + 1);
        return tops[idx] + (tops[next] - tops[idx]) * (norm - idx);
      },
      inside: (x: number, y: number) => {
        const { h, nx, ny, wet } = currentFrame;
        if (!nx || !wet || !wet.length) return y >= waterLevel;
        const col = Math.min(nx - 1, Math.max(0, Math.floor((x + h) / h)));
        const row = Math.min(ny - 1, Math.max(0, Math.floor((y + h) / h)));
        const idx = col * ny + row;
        return idx >= 0 && wet[idx] === 1;
      },
      flow: (x: number, y: number): [number, number] | null => {
        const { h, nx, ny, wet, flowX, flowY } = currentFrame;
        if (!nx || !wet || !flowX) return null;
        const col = Math.min(nx - 1, Math.max(0, Math.floor((x + h) / h)));
        const row = Math.min(ny - 1, Math.max(0, Math.floor((y + h) / h)));
        const idx = col * ny + row;
        if (idx < 0 || !wet[idx]) return null;
        return [flowX[idx], flowY[idx]];
      },
      close: () => {},
    };

    // Inertia & Orientation
    const gravity = { x: 0, y: 1, upright: 0 };
    const screenPos = { x: window.screenX || 0, y: window.screenY || 0, ax: 0, ay: 0 };
    const deviceTilt = { x: 0, y: 0 };
    const motionKick = { x: 0, y: 0 };

    // Offscreen Canvas Buffers
    let foamArray = new Float32Array(0);
    let floorPath = new Path2D();
    let lastFrameId = -1;
    let lastSplashTime = -1;
    let tiltAngle = 0;

    const V = colorRgbStr(COLORS.ink);
    const Y = colorRgbStr(COLORS.text);
    const N = colorRgbStr(COLORS.core);
    const Deep = colorRgbStr(COLORS.deep);
    const Sea = colorRgbStr(COLORS.sea);
    const J = COLORS.sea.map((v, i) => Math.round((v + COLORS.core[i]) / 2)).join(', ');

    // 1/3 scale offscreen canvases for volumetric light & shadows
    const rayCanvas = document.createElement('canvas');
    const rayCtx = rayCanvas.getContext('2d')!;
    const blurCanvas = document.createElement('canvas');
    const blurCtx = blurCanvas.getContext('2d')!;

    // Sunbeam volumetric textures
    const beamTextures = {
      air: document.createElement('canvas'),
      water: document.createElement('canvas'),
      key: '',
    };

    const bubbleCanvas = document.createElement('canvas');
    const starFieldCanvas = document.createElement('canvas');
    const submergedCanvas = document.createElement('canvas');
    const submergedCtx = submergedCanvas.getContext('2d')!;

    // Water Surface Pattern
    const noisePatCanvas = document.createElement('canvas');
    noisePatCanvas.width = 192;
    noisePatCanvas.height = 192;
    const noisePatCtx = noisePatCanvas.getContext('2d')!;
    const noiseImg = noisePatCtx.createImageData(192, 192);
    for (let i = 0; i < noiseImg.data.length; i += 4) {
      const val = 128 + (Math.random() + Math.random() + Math.random() - 1.5) * 60;
      noiseImg.data[i] = val;
      noiseImg.data[i + 1] = val;
      noiseImg.data[i + 2] = val;
      noiseImg.data[i + 3] = 255;
    }
    noisePatCtx.putImageData(noiseImg, 0, 0);
    const waterNoisePattern = ctx.createPattern(noisePatCanvas, 'repeat');

    // Caustic sparkles
    const sparkles = Array.from({ length: 70 }, () => ({
      u: Math.random(),
      v: Math.random(),
      seed: randomRange(0, 9),
      size: randomRange(0.6, 1.6),
    }));

    // Marine snow floating particles
    const marineSnow = Array.from({ length: 120 }, () => ({
      u: Math.random(),
      v: Math.random(),
      size: randomRange(0.4, 1.3),
      seed: randomRange(0, 9),
      alpha: randomRange(0.08, 0.26),
      sink: randomRange(2, 7),
    }));

    // Pre-render bubble texture
    bubbleCanvas.width = 64;
    bubbleCanvas.height = 64;
    const bubbleCtx = bubbleCanvas.getContext('2d')!;
    bubbleCtx.translate(32, 32);
    const bubbleGrad = bubbleCtx.createRadialGradient(0, 0, 13.5, 0, 0, 30);
    bubbleGrad.addColorStop(0, `rgba(${J}, 0)`);
    bubbleGrad.addColorStop(0.7, `rgba(${J}, 0.06)`);
    bubbleGrad.addColorStop(0.92, `rgba(${N}, 0.45)`);
    bubbleGrad.addColorStop(1, `rgba(${N}, 0)`);
    bubbleCtx.fillStyle = bubbleGrad;
    bubbleCtx.beginPath();
    bubbleCtx.arc(0, 0, 30, 0, Math.PI * 2);
    bubbleCtx.fill();
    bubbleCtx.fillStyle = `rgba(${N}, 0.75)`;
    bubbleCtx.beginPath();
    bubbleCtx.arc(-10.8, -12, 5.1, 0, Math.PI * 2);
    bubbleCtx.fill();
    bubbleCtx.fillStyle = `rgba(${N}, 0.2)`;
    bubbleCtx.beginPath();
    bubbleCtx.arc(9, 12.6, 3, 0, Math.PI * 2);
    bubbleCtx.fill();

    // Scene Dimensions & State
    let dpr = 1;
    let canvasW = Math.max(300, canvas.offsetWidth || window.innerWidth);
    let canvasH = Math.max(300, canvas.offsetHeight || window.innerHeight);
    let waterLevel = 0.6 * canvasH;
    let topsAvg = waterLevel;
    let pourProgress = 1.0;
    let sunbeamProgress = 1.0;
    let sunbeamIntensity = 1.0;
    let sandAlpha = 1.0;
    let kelpScale = 1.0;
    let fishAlpha = 1.0;

    let digits: any[] = [];
    let bubbles: any[] = [];
    let bubbleVents: number[] = [];
    let kelpList: any[] = [];
    let fishList: any[] = [];
    let crabList: any[] = [];
    let waterSprayList: any[] = [];
    let ty = 0;
    let tM = 0;

    const sandFloorCanvas = document.createElement('canvas');
    const sandLightCanvas = document.createElement('canvas');
    let floorBaseHeight = 40;
    const floorSeed = randomRange(0, 9);

    const floorProfile = (x: number) => {
      const norm = clamp(x / canvasW - 0.5, -0.5, 0.5);
      const curve = Math.pow(Math.max(0, Math.cos(norm * Math.PI)), 1.8);
      return (
        canvasH -
        3 -
        floorBaseHeight * curve * (1 + (0.18 * Math.sin(0.006 * x + floorSeed) + 0.07 * Math.sin(0.017 * x + 2 * floorSeed))) -
        1.2 * Math.sin(0.04 * x + 3 * floorSeed) * curve
      );
    };

    let activeDrag: { digit: any; dx: number; dy: number; px: number; py: number; vx: number; vy: number } | null = null;
    const mousePos = { x: -999, y: -999, vx: 0, vy: 0 };

    let animFrameId = 0;
    let lastAnimTime = performance.now();
    let simAccumulator = 0;
    let simTime = 0;

    const waterTop = (x: number) => fluidController.top(x);
    const panFromX = (x: number) => (x / (canvasW || 1)) * 2 - 1;

    const addFoam = (x: number, power: number, radius = 3) => {
      const col = Math.round(x / (fluidController.frame.h || 12) - 0.5);
      for (let offset = -radius; offset <= radius; offset++) {
        const idx = col + offset;
        if (idx >= 0 && idx < foamArray.length) {
          foamArray[idx] = Math.min(1, foamArray[idx] + power * (1 - Math.abs(offset) / (radius + 1)));
        }
      }
    };

    const triggerPlunge = (x: number, vy: number) => {
      const p = Math.min(vy, 13);
      const sprayCount = Math.min(22, Math.round(1.7 * p));
      for (let i = 0; i < sprayCount; i++) {
        waterSprayList.push({
          x: x + randomRange(-34, 34),
          y: waterTop(x) - 2,
          vx: randomRange(-2.6, 2.6),
          vy: -randomRange(0.35, 0.85) * p,
          r: randomRange(1, 2.6),
        });
      }
      for (let i = 0; i < Math.round(p); i++) {
        bubbles.push({
          x: x + randomRange(-40, 40),
          y: waterTop(x) + randomRange(20, 80),
          r: randomRange(1.5, 4.5),
          speed: randomRange(0.6, 1.5),
          seed: randomRange(0, 9),
          age: 0,
          wobble: randomRange(0.2, 0.6),
          loud: true,
        });
      }
      addFoam(x, Math.min(1, p / 10), 5);
      audio.plunge(p / 16, panFromX(x));
    };

    // Convex Hull Algorithm for SAT polygon collision
    const computeConvexHull = (canvasElem: HTMLCanvasElement, scaleVal: number, cx: number, cy: number) => {
      const imgData = canvasElem.getContext('2d')!.getImageData(0, 0, canvasElem.width, canvasElem.height);
      const { data, width: w, height: h } = imgData;
      const pts: [number, number][] = [];
      const step = Math.max(1, Math.round(scaleVal));

      for (let y = 0; y < h; y += step) {
        let minX = -1;
        let maxX = -1;
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] >= 60) {
            if (minX < 0) minX = x;
            maxX = x;
          }
        }
        if (minX >= 0) {
          pts.push([minX / scaleVal - cx, y / scaleVal - cy], [(maxX + 1) / scaleVal - cx, y / scaleVal - cy]);
        }
      }
      pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

      const cross = (a: [number, number], b: [number, number], c: [number, number]) =>
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

      const halfHull = (arr: [number, number][]) => {
        const hList: [number, number][] = [];
        for (const pt of arr) {
          while (hList.length >= 2 && cross(hList[hList.length - 2], hList[hList.length - 1], pt) <= 0) {
            hList.pop();
          }
          hList.push(pt);
        }
        hList.pop();
        return hList;
      };

      const hull = [...halfHull(pts), ...halfHull([...pts].reverse())];
      while (hull.length > 12) {
        let removeIdx = 0;
        let minCost = Infinity;
        hull.forEach((pt, i) => {
          const prev = hull[(i - 1 + hull.length) % hull.length];
          const next = hull[(i + 1) % hull.length];
          const dist = Math.hypot(next[0] - prev[0], next[1] - prev[1]) || 1;
          const cost = Math.abs(cross(prev, pt, next)) / dist;
          if (cost < minCost) {
            minCost = cost;
            removeIdx = i;
          }
        });
        hull.splice(removeIdx, 1);
      }
      return Float32Array.from(hull.flat());
    };

    // Rasterize 3D Extruded Digits
    const createDigitArt = (char: string, fontSize: number, fontFamily: string) => {
      const measurer = document.createElement('canvas').getContext('2d')!;
      measurer.font = `600 ${fontSize}px ${fontFamily}`;
      const metrics = measurer.measureText(char);
      const textW = Math.ceil(metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight);
      const textH = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
      const depthSteps = Math.round(0.035 * fontSize);
      const pad = Math.ceil(0.06 * fontSize);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      const art = document.createElement('canvas');
      art.width = Math.ceil((textW + 2 * pad) * ratio);
      art.height = Math.ceil((textH + 2 * pad + depthSteps) * ratio);
      const actx = art.getContext('2d')!;
      actx.scale(ratio, ratio);
      actx.font = measurer.font;

      const originX = pad + metrics.actualBoundingBoxLeft;
      const originY = pad + metrics.actualBoundingBoxAscent;

      // 3D Depth Extrusion
      actx.fillStyle = '#3a2c22';
      for (let d = depthSteps; d > 0; d--) {
        actx.fillText(char, originX, originY + d);
      }

      // Front Face Gradient
      const faceGrad = actx.createLinearGradient(0, pad, 0, pad + textH);
      faceGrad.addColorStop(0, `rgb(${N})`);
      faceGrad.addColorStop(1, `rgb(${colorRgbStr(COLORS.accent)})`);
      actx.fillStyle = faceGrad;
      actx.fillText(char, originX, originY);

      // Bevel Glint
      actx.globalCompositeOperation = 'source-atop';
      const glintGrad = actx.createLinearGradient(0, pad, 0, pad + 0.35 * textH);
      glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      actx.fillStyle = glintGrad;
      actx.fillRect(0, 0, textW + 2 * pad, 0.4 * textH + pad);

      // Underwater Dark Tint
      const darkCanvas = document.createElement('canvas');
      darkCanvas.width = art.width;
      darkCanvas.height = art.height;
      const dctx = darkCanvas.getContext('2d')!;
      dctx.drawImage(art, 0, 0);
      dctx.globalCompositeOperation = 'source-atop';
      dctx.fillStyle = `rgb(${V})`;
      dctx.fillRect(0, 0, darkCanvas.width, darkCanvas.height);

      // Ghost Low-res for volumetric shadows
      const ghostCanvas = document.createElement('canvas');
      ghostCanvas.width = Math.max(1, Math.ceil(art.width / ratio / 3));
      ghostCanvas.height = Math.max(1, Math.ceil(art.height / ratio / 3));
      ghostCanvas.getContext('2d')!.drawImage(art, 0, 0, ghostCanvas.width, ghostCanvas.height);

      const hull = computeConvexHull(art, ratio, pad + textW / 2, pad + textH / 2);

      return {
        art,
        dark: darkCanvas,
        ghost: ghostCanvas,
        w: textW,
        h: textH,
        pad,
        hull,
      };
    };

    const initDigits = () => {
      const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
      const targetFontSize = clamp(Math.min(0.2 * canvasW, 0.34 * canvasH), 90, 340);
      const spacing = Math.min(0.8 * targetFontSize, canvasW / 3.6);

      digits = ['4', '0', '4'].map((char, idx) => {
        const artObj = createDigitArt(char, targetFontSize, font);
        const homeX = canvasW / 2 + (idx - 1) * spacing;
        // Position directly at water line so they are immediately visible!
        const initialY = waterLevel - 15 + (idx === 1 ? -15 : 15);
        return {
          char,
          home: homeX,
          x: homeX,
          y: initialY,
          vx: 0,
          vy: 0,
          angle: randomRange(-0.08, 0.08),
          spin: 0,
          w: artObj.w,
          h: artObj.h,
          wet: 0.5,
          art: artObj.art,
          dark: artObj.dark,
          ghost: artObj.ghost,
          light: 0,
          pad: artObj.pad,
          shade: 0.5,
          hull: artObj.hull,
        };
      });
    };

    const nudgeWaterByDigit = (d: any, surfY: number) => {
      if (Math.hypot(d.vx, d.vy) < 1.5 || d.y + d.h / 2 < surfY) return;
      fluidController.nudge(d.x, Math.max(surfY + 8, d.y), 0.55 * d.w, 5 * d.vx, 5 * d.vy);
    };

    const getTransformedHull = (d: any) => {
      const cos = Math.cos(d.angle);
      const sin = Math.sin(d.angle);
      const { hull } = d;
      const res = new Float32Array(hull.length);
      for (let i = 0; i < hull.length; i += 2) {
        res[i] = d.x + hull[i] * cos - hull[i + 1] * sin;
        res[i + 1] = d.y + hull[i] * sin + hull[i + 1] * cos;
      }
      return res;
    };

    const projectPolygon = (pts: Float32Array, nx: number, ny: number) => {
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        const proj = pts[i] * nx + pts[i + 1] * ny;
        if (proj < min) min = proj;
        if (proj > max) max = proj;
      }
      return [min, max];
    };

    const digitMassScale = (d: any) => (activeDrag?.digit === d ? 0.15 : 1);

    const resolveDigitSAT = (d1: any, d2: any, isInitial: boolean) => {
      const h1 = getTransformedHull(d1);
      const h2 = getTransformedHull(d2);

      let minOverlap = Infinity;
      let normX = 0;
      let normY = 0;

      for (const h of [h1, h2]) {
        for (let i = 0; i < h.length; i += 2) {
          const next = (i + 2) % h.length;
          let edgeX = h[i + 1] - h[next + 1];
          let edgeY = h[next] - h[i];
          const len = Math.hypot(edgeX, edgeY);
          if (!len) continue;
          edgeX /= len;
          edgeY /= len;

          const [min1, max1] = projectPolygon(h1, edgeX, edgeY);
          const [min2, max2] = projectPolygon(h2, edgeX, edgeY);
          const overlap = Math.min(max1, max2) - Math.max(min1, min2);
          if (overlap <= 0) return;
          if (overlap < minOverlap) {
            minOverlap = overlap;
            normX = edgeX;
            normY = edgeY;
          }
        }
      }

      if ((d2.x - d1.x) * normX + (d2.y - d1.y) * normY < 0) {
        normX = -normX;
        normY = -normY;
      }

      const m1 = digitMassScale(d1);
      const m2 = digitMassScale(d2);
      const totalM = m1 + m2;
      const sep = (0.8 * Math.min(Math.max(0, minOverlap - 0.5), 6)) / totalM;

      d1.x -= normX * sep * m1;
      d1.y -= normY * sep * m1;
      d2.x += normX * sep * m2;
      d2.y += normY * sep * m2;

      const [, p1Max] = projectPolygon(h1, normX, normY);
      const [p2Min] = projectPolygon(h2, normX, normY);
      const midProj = (p1Max + p2Min) / 2;
      const perpProj = (-normY * (d1.x + d2.x) + normX * (d1.y + d2.y)) / 2;
      const contactX = normX * midProj - normY * perpProj;
      const contactY = normY * midProj + normX * perpProj;

      const relVel = (d2.vx - d1.vx) * normX + (d2.vy - d1.vy) * normY;
      if (relVel >= 0) return;

      const impulse = (-1.2 * relVel) / totalM;
      if (isInitial && relVel < -2) {
        audio.knock(Math.min(1, -relVel / 18), panFromX(contactX), d1.wet + d2.wet > 0.3);
      }

      for (const [body, dir, factor] of [
        [d1, -1, m1],
        [d2, 1, m2],
      ] as const) {
        body.vx += dir * impulse * normX * factor;
        body.vy += dir * impulse * normY * factor;
        const torque = (contactX - body.x) * (dir * impulse * normY) - (contactY - body.y) * (dir * impulse * normX);
        body.spin = clamp(body.spin + (torque * factor) / ((body.w * body.w + body.h * body.h) / 12) * 0.5, -0.12, 0.12);
      }
    };

    const resolveWallBounds = (d: any, playAudio: boolean) => {
      const h = getTransformedHull(d);
      const [minX, maxX] = projectPolygon(h, 1, 0);
      const [minY, maxY] = projectPolygon(h, 0, 1);

      if (minX < 8 || maxX > canvasW - 8) {
        const corr = minX < 8 ? 8 - minX : canvasW - 8 - maxX;
        if (playAudio && Math.abs(d.vx) > 1.5) {
          audio.knock(Math.abs(d.vx) / 18, panFromX(d.x), d.wet > 0.3);
        }
        if (playAudio && Math.abs(d.vx) > 4 && d.wet > 0) {
          triggerPlunge(d.x, 0.6 * Math.abs(d.vx));
        }
        d.x += corr;
        if (d.vx * corr < 0) d.vx *= -0.35;
      }

      const topLimit = -0.05 * d.h;
      if (minY < topLimit && d.vy < 0) {
        if (playAudio && d.vy < -2) audio.knock(-d.vy / 18, panFromX(d.x), false);
        d.y += topLimit - minY;
        if (d.vy < 0) {
          d.vy *= -0.25;
          d.spin *= 0.6;
        }
      }

      const bottomLimit = canvasH - 6;
      if (maxY > bottomLimit) {
        if (playAudio && d.vy > 2) audio.knock(d.vy / 30, panFromX(d.x), true);
        d.y -= maxY - bottomLimit;
        if (d.vy > 0) d.vy *= -0.2;
      }
    };

    // Kelp Setup
    const initKelp = () => {
      kelpList = [];
      const count = 8;
      const baseLen = 0.4 * canvasH;

      for (let i = 0; i < count; i++) {
        const len = baseLen * randomRange(0.32, 0.9);
        kelpList.push({
          x: ((i + 0.5 + randomRange(-0.28, 0.28)) / count) * canvasW,
          length: len,
          base: len * randomRange(0.22, 0.32) * 0.85,
          phase: randomRange(0, 9),
          speed: randomRange(0.45, 0.75),
          back: true,
          bend: randomRange(-0.15, 0.15),
          push: 0,
          drift: 0,
        });
      }

      for (const [startNorm, endNorm] of [
        [0, 0.2],
        [0.8, 1],
      ] as const) {
        [randomRange(0.62, 0.86), randomRange(0.42, 0.58), randomRange(0.24, 0.36)].forEach((l, idx) => {
          const len = baseLen * l;
          kelpList.push({
            x: (startNorm + ((idx + 0.5 + randomRange(-0.25, 0.25)) / 3) * (endNorm - startNorm)) * canvasW,
            length: len,
            base: len * randomRange(0.22, 0.32),
            phase: randomRange(0, 9),
            speed: randomRange(0.45, 0.75),
            back: false,
            bend: randomRange(-0.15, 0.15),
            push: 0,
            drift: 0,
          });
        });
      }
    };

    // Fish Setup
    const initFish = () => {
      fishList = [];
      const rockCount = Math.round(4 + canvasW / 520);
      const verticalSlots = [0.18, 0.5, 0.82];

      for (let i = 0; i < rockCount; i++) {
        const depth = (i % 2 ? 0.25 : 0.75) + randomRange(-0.2, 0.2);
        const sz = (1 - 0.4 * depth) * randomRange(42, 70);
        const slotY = verticalSlots[(2 * i) % verticalSlots.length];
        const posY = 0.6 * canvasH + 40 + (0.4 * canvasH - 80) * (slotY + randomRange(-0.08, 0.08));
        const dir = i % 2 ? -1 : 1;

        fishList.push({
          kind: 'rock',
          x: ((i + 0.5 + randomRange(-0.3, 0.3)) / rockCount) * canvasW,
          y: posY,
          ty: posY,
          dir,
          facing: dir,
          size: sz,
          depth,
          speed: randomRange(0.35, 0.75) * (sz / 40),
          swim: randomRange(0, 9),
          scare: 0,
          phase: randomRange(0, 9),
        });
      }

      const tropicalCount = canvasW > 700 ? 2 : 1;
      for (const kind of ['clown', 'tang'] as const) {
        for (let i = 0; i < tropicalCount; i++) {
          const sz = kind === 'clown' ? randomRange(30, 38) : randomRange(42, 54);
          const posY = 0.6 * canvasH + 60 + (0.4 * canvasH - 120) * randomRange(0.15, 0.85);
          const dir = Math.random() < 0.5 ? -1 : 1;
          fishList.push({
            kind,
            x: randomRange(0.1, 0.9) * canvasW,
            y: posY,
            ty: posY,
            dir,
            facing: dir,
            size: sz,
            depth: randomRange(0.05, 0.35),
            speed: (kind === 'clown' ? randomRange(0.3, 0.45) : randomRange(0.4, 0.6)) * (sz / 40),
            swim: randomRange(0, 9),
            scare: 0,
            phase: randomRange(0, 9),
          });
        }
      }
      fishList.sort((a, b) => b.depth - a.depth);
    };

    // Crabs Setup
    const initCrabs = () => {
      crabList = [];
      const crabCount = canvasW > 900 ? 3 : 2;
      for (let i = 0; i < crabCount; i++) {
        const bigClawIdx = Math.random() < 0.5 ? 0 : 1;
        const claws = [1, 1];
        claws[bigClawIdx] = randomRange(1.05, 1.35);
        claws[1 - bigClawIdx] = randomRange(0.7, 0.95);

        crabList.push({
          x: ((i + 0.5 + randomRange(-0.25, 0.25)) / crabCount) * canvasW,
          dir: Math.random() < 0.5 ? -1 : 1,
          size: [randomRange(27, 32), randomRange(33, 39), randomRange(40, 47)][i % 3],
          speed: randomRange(0.25, 0.6),
          walk: randomRange(0, 9),
          rest: 0,
          timer: randomRange(1, 4),
          snap: 0,
          scare: 0,
          seed: randomRange(0, 9),
          shade: randomRange(0.42, 0.62),
          warmth: randomRange(-0.25, 0.3),
          wide: randomRange(0.32, 0.42),
          claws,
          legs: randomRange(0.85, 1.15),
          stalk: randomRange(0.8, 1.3),
          spots: Array.from({ length: Math.floor(randomRange(0, 4)) }, () => randomRange(-0.7, 0.7)),
        });
      }
    };

    // Sunbeam Geometry (Light originates from upper right sky)
    const getSunbeamProps = () => {
      const top = -0.2 * canvasH;
      const seaLevel = waterLevel;
      const lightCenter = 0.82 * canvasW; // Light origin at upper right
      const slopeRatio = (canvasW * 0.48 - lightCenter) / (seaLevel - 20 - top);
      const centerAtY = (y: number) => lightCenter + (y - top) * slopeRatio;
      const topHalfW = Math.max(100, 0.12 * canvasW);
      const seaHalfW = Math.max(280, 0.32 * canvasW);

      const makeSide = (dir: number) => {
        const fromPt = { x: centerAtY(top) + dir * topHalfW, y: top };
        const hitPt = { x: centerAtY(seaLevel) + dir * seaHalfW, y: seaLevel };
        const slope = (hitPt.x - fromPt.x) / (hitPt.y - fromPt.y);
        const refractedBend = Math.tan(Math.asin(Math.sin(Math.atan(slope)) / 1.33));
        return {
          from: fromPt,
          hit: hitPt,
          slope,
          bend: refractedBend,
          at: (y: number) => (y < seaLevel ? fromPt.x + (y - top) * slope : hitPt.x + (y - seaLevel) * refractedBend),
        };
      };

      const tilt = Math.atan(-slopeRatio);
      return {
        top,
        left: makeSide(-1),
        right: makeSide(1),
        tilt,
        under: Math.asin(Math.sin(tilt) / 1.33),
      };
    };

    const getLightIntensityAt = (x: number, y: number) => {
      const { left, right } = getSunbeamProps();
      const lx = left.at(y);
      const rx = right.at(y);
      return clamp(1 - Math.abs(((x - lx) / (rx - lx || 1)) * 2 - 1), 0, 1);
    };

    // Generate Volumetric Sunbeam Textures
    const updateSunbeamTextures = () => {
      if (rayCanvas.width <= 0 || rayCanvas.height <= 0) return;
      const seaLevel = waterLevel;
      const key = `${rayCanvas.width}x${rayCanvas.height}@${Math.round(seaLevel)}`;
      if (beamTextures.key === key) return;
      beamTextures.key = key;

      const { left, right } = getSunbeamProps();
      const coreColor = COLORS.core;
      const waterColor = COLORS.sea.map((v, i) => Math.round((v + coreColor[i]) / 2));

      const generateTexture = (targetCanvas: HTMLCanvasElement, isWater: boolean) => {
        targetCanvas.width = rayCanvas.width;
        targetCanvas.height = rayCanvas.height;
        const targetCtx = targetCanvas.getContext('2d')!;
        const img = targetCtx.createImageData(rayCanvas.width, rayCanvas.height);
        const color = isWater ? waterColor : coreColor;
        // Peak opacity: prominent warm beam in sky and vivid aqua shaft in water
        const peakAlpha = isWater ? 0.56 : 0.36;

        for (let y = 0; y < rayCanvas.height; y++) {
          const worldY = (y + 0.5) * 3;
          const leftX = isWater ? left.hit.x + (worldY - seaLevel) * left.bend : left.from.x + (worldY - left.from.y) * left.slope;
          const rightX = isWater ? right.hit.x + (worldY - seaLevel) * right.bend : right.from.x + (worldY - right.from.y) * right.slope;
          const vertFade = isWater
            ? Math.exp(-Math.max(0, worldY - seaLevel) / ((canvasH - seaLevel) * 0.8))
            : 0.82 + 0.18 * clamp(worldY / seaLevel, 0, 1);

          for (let x = 0; x < rayCanvas.width; x++) {
            const norm = (((x + 0.5) * 3 - leftX) / (rightX - leftX || 1) - 0.5) / 0.68;
            const pixelIdx = (y * rayCanvas.width + x) * 4;
            if (Math.abs(norm) >= 1) continue;

            const beamShape = Math.pow(Math.cos((norm * Math.PI) / 2), 2.2);
            img.data[pixelIdx] = color[0];
            img.data[pixelIdx + 1] = color[1];
            img.data[pixelIdx + 2] = color[2];
            img.data[pixelIdx + 3] = clamp(peakAlpha * beamShape * vertFade * 255 + Math.random() - 0.5, 0, 255);
          }
        }
        targetCtx.putImageData(img, 0, 0);
      };

      generateTexture(beamTextures.air, false);
      generateTexture(beamTextures.water, true);
    };

    // Resize Handler
    const handleResize = () => {
      dpr = Math.max(0.75, Math.min(window.devicePixelRatio || 1, 1.5));
      canvasW = Math.max(300, canvas.offsetWidth || window.innerWidth);
      canvasH = Math.max(300, canvas.offsetHeight || window.innerHeight);
      canvas.width = Math.round(canvasW * dpr);
      canvas.height = Math.round(canvasH * dpr);

      waterLevel = 0.6 * canvasH;
      topsAvg = topsAvg || waterLevel;
      bubbleVents = Array.from({ length: 4 }, () => randomRange(0.08 * canvasW, 0.92 * canvasW));
      floorBaseHeight = clamp(0.05 * canvasH, 26, 48);

      const floorArr = new Float32Array(Math.ceil(canvasW) + 2);
      for (let i = 0; i < floorArr.length; i++) {
        floorArr[i] = floorProfile(Math.min(i, canvasW));
      }

      fluidController.resize(canvasW, canvasH, floorArr, waterLevel, 1.0);

      rayCanvas.width = Math.max(10, Math.ceil(canvasW / 3));
      rayCanvas.height = Math.max(10, Math.ceil(canvasH / 3));
      blurCanvas.width = rayCanvas.width;
      blurCanvas.height = rayCanvas.height;
      beamTextures.key = ''; // force regenerate

      submergedCanvas.width = canvas.width;
      submergedCanvas.height = canvas.height;
      starFieldCanvas.width = canvas.width;
      starFieldCanvas.height = canvas.height;

      // Celestial dot grid background
      const sctx = starFieldCanvas.getContext('2d')!;
      sctx.scale(dpr, dpr);
      sctx.fillStyle = `rgba(${Y}, 0.1)`;
      for (let y = 11; y < canvasH; y += 22) {
        for (let x = 11; x < canvasW; x += 22) {
          sctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
        }
      }

      initDigits();
      initKelp();
      initFish();
      initCrabs();
    };

    // Seabed Pre-render
    let seabedKey = '';
    const renderSeabedTexture = () => {
      const key = `${canvasW}x${canvasH}@${floorBaseHeight}@${dpr}`;
      if (seabedKey === key) return;
      seabedKey = key;

      floorPath = new Path2D();
      floorPath.moveTo(0, -40);
      floorPath.lineTo(canvasW, -40);
      for (let x = canvasW; x >= 0; x -= 4) {
        floorPath.lineTo(x, floorProfile(x) + 2);
      }
      floorPath.lineTo(0, floorProfile(0) + 2);
      floorPath.closePath();

      sandFloorCanvas.width = canvas.width;
      sandFloorCanvas.height = canvas.height;
      sandLightCanvas.width = canvas.width;
      sandLightCanvas.height = canvas.height;

      const sctx = sandFloorCanvas.getContext('2d')!;
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const path = new Path2D();
      path.moveTo(0, canvasH);
      for (let x = 0; x <= canvasW + 4; x += 4) {
        path.lineTo(Math.min(x, canvasW), floorProfile(Math.min(x, canvasW)));
      }
      path.lineTo(canvasW, canvasH);
      path.closePath();

      const sandTop = canvasH - 1.5 * floorBaseHeight;
      const sandGrad = sctx.createLinearGradient(0, sandTop, 0, canvasH);
      sandGrad.addColorStop(0, `rgb(${lerpColorStr(COLORS.sand, COLORS.deep, 0.36)})`);
      sandGrad.addColorStop(0.45, `rgb(${lerpColorStr(lerpColor(COLORS.sand, COLORS.sandDeep, 0.5), COLORS.deep, 0.5)})`);
      sandGrad.addColorStop(1, `rgb(${lerpColorStr(COLORS.sandDeep, COLORS.deep, 0.62)})`);
      sctx.fillStyle = sandGrad;
      sctx.fill(path);

      // Noise grain on sand
      sctx.save();
      sctx.clip(path);
      const imgData = sctx.getImageData(0, Math.floor(sandTop * dpr), sandFloorCanvas.width, sandFloorCanvas.height - Math.floor(sandTop * dpr));
      for (let i = 0; i < imgData.data.length; i += 4) {
        if (!imgData.data[i + 3]) continue;
        const n = (Math.random() - 0.5) * 26 + (Math.random() < 0.012 ? 34 : 0) - (Math.random() < 0.02 ? 30 : 0);
        imgData.data[i] = clamp(imgData.data[i] + n, 0, 255);
        imgData.data[i + 1] = clamp(imgData.data[i + 1] + 0.9 * n, 0, 255);
        imgData.data[i + 2] = clamp(imgData.data[i + 2] + 0.7 * n, 0, 255);
      }
      sctx.putImageData(imgData, 0, Math.floor(sandTop * dpr));

      // Pebbles
      for (let i = 0; i < Math.round(canvasW / 26); i++) {
        const px = randomRange(0, canvasW);
        const py = floorProfile(px) + randomRange(4, floorBaseHeight);
        const pr = randomRange(1.5, 4.5);
        sctx.fillStyle = `rgb(${lerpColorStr(Math.random() < 0.5 ? COLORS.sandDeep : [120, 118, 110], [0, 0, 0], randomRange(0, 0.3))})`;
        sctx.beginPath();
        sctx.ellipse(px, py, pr * randomRange(1, 1.6), pr, randomRange(-0.4, 0.4), 0, Math.PI * 2);
        sctx.fill();
        sctx.fillStyle = `rgba(255, 245, 225, 0.35)`;
        sctx.beginPath();
        sctx.ellipse(px - 0.3 * pr, py - 0.4 * pr, 0.45 * pr, 0.25 * pr, 0, 0, Math.PI * 2);
        sctx.fill();
      }

      // Shells
      for (let i = 0; i < Math.round(canvasW / 260); i++) {
        const sx = randomRange(0, canvasW);
        const sy = floorProfile(sx) + randomRange(6, 0.8 * floorBaseHeight);
        const sr = randomRange(4, 7);
        sctx.save();
        sctx.translate(sx, sy);
        sctx.rotate(randomRange(-0.6, 0.6));
        sctx.fillStyle = `rgba(240, 225, 200, 0.85)`;
        sctx.beginPath();
        sctx.moveTo(0, 0.4 * sr);
        sctx.arc(0, 0.4 * sr, sr, 1.15 * Math.PI, 1.85 * Math.PI);
        sctx.closePath();
        sctx.fill();
        sctx.restore();
      }
      sctx.restore();

      // Top ridge on sand dunes
      const ridgePath = new Path2D();
      for (let x = 0; x <= canvasW + 4; x += 4) {
        if (x === 0) ridgePath.moveTo(0, floorProfile(0));
        else ridgePath.lineTo(Math.min(x, canvasW), floorProfile(Math.min(x, canvasW)));
      }
      sctx.strokeStyle = `rgba(${colorRgbStr(COLORS.sand)}, 0.35)`;
      sctx.lineWidth = 1.2;
      sctx.stroke(ridgePath);

      // Light caustic mask for sand
      const lctx = sandLightCanvas.getContext('2d')!;
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.save();
      lctx.clip(path);
      const lightGrad = lctx.createLinearGradient(0, 0, canvasW, 0);
      for (let x = 0; x <= canvasW; x += 24) {
        lightGrad.addColorStop(x / canvasW, `rgba(${colorRgbStr(COLORS.sand)}, ${(0.34 * getLightIntensityAt(x, floorProfile(x))).toFixed(3)})`);
      }
      lctx.fillStyle = lightGrad;
      lctx.fill(path);
      lctx.restore();
    };

    // Draw Crab
    const drawCrab = (c: any) => {
      const sz = c.size;
      const getProfile = (offset: number) => floorProfile(c.x + offset) + 1.5;
      const groundY = (getProfile(-0.4 * sz) + getProfile(0.4 * sz)) / 2;
      const slopeAngle = Math.atan2(getProfile(0.4 * sz) - getProfile(-0.4 * sz), 0.8 * sz);
      const lightFactor = getLightIntensityAt(c.x, groundY - 0.3 * sz) * sunbeamIntensity;
      const bodyBaseColor = c.warmth > 0 ? lerpColor(COLORS.crab, COLORS.sand, c.warmth) : lerpColor(COLORS.crab, COLORS.crabDark, -c.warmth);
      const applyLight = (base: number[], extraShade = 0) =>
        lerpColorStr(lerpColor(base, COLORS.deep, c.shade + extraShade), [255, 230, 200], 0.25 * lightFactor);

      const shellColor = applyLight(bodyBaseColor);
      const darkColor = applyLight(COLORS.crabDark, 0.05);
      const bodyY = groundY - 0.32 * sz * c.legs;

      ctx.save();
      ctx.translate(c.x, groundY);
      ctx.rotate(0.6 * slopeAngle);
      ctx.translate(0, -groundY);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = `rgb(${darkColor})`;

      // Legs
      for (const side of [-1, 1]) {
        for (let legIdx = 0; legIdx < 3; legIdx++) {
          const cycle = 2 * c.walk + 2.1 * legIdx + (side > 0 ? Math.PI : 0);
          const lift = Math.max(0, Math.sin(cycle)) * sz * 0.07;
          const rootX = side * sz * (0.7 * c.wide + 0.04 * legIdx);
          const rootY = bodyY + sz * (0.02 + 0.04 * legIdx);
          const footX = side * sz * (c.wide + 0.14 + 0.1 * legIdx) * c.legs + Math.cos(cycle) * sz * 0.05;
          const footY = groundY + (getProfile(footX) - groundY) * 0.9 - lift;
          const kneeX = side * sz * (c.wide + 0.12 + 0.09 * legIdx) * c.legs;
          const kneeY = bodyY - sz * (0.12 - 0.03 * legIdx) - 0.5 * lift;

          ctx.lineWidth = Math.max(1.6, 0.06 * sz);
          ctx.beginPath();
          ctx.moveTo(rootX, rootY);
          ctx.lineTo(kneeX, kneeY);
          ctx.stroke();

          ctx.lineWidth = Math.max(1.1, 0.038 * sz);
          ctx.beginPath();
          ctx.moveTo(kneeX, kneeY);
          ctx.quadraticCurveTo(footX + side * sz * 0.02, (kneeY + footY) / 2, footX, footY);
          ctx.stroke();
        }

        // Claws
        const clawLift = 0.5 * c.scare + 0.25 * c.snap + 0.05 * Math.sin(1.5 * simTime + c.seed + side);
        const shoulderX = side * sz * 0.48;
        const shoulderY = bodyY - sz * (0.24 + 0.25 * clawLift);

        ctx.lineWidth = Math.max(2.2, 0.09 * sz);
        ctx.strokeStyle = `rgb(${shellColor})`;
        ctx.beginPath();
        ctx.moveTo(side * sz * 0.3, bodyY - 0.05 * sz);
        ctx.lineTo(shoulderX, shoulderY);
        ctx.stroke();

        ctx.save();
        ctx.translate(shoulderX, shoulderY);
        const clawScale = c.claws[side < 0 ? 0 : 1];
        ctx.scale(side * clawScale, clawScale);
        ctx.rotate(0.35 - 0.5 * clawLift);

        const snapRot = 0.18 + 0.45 * c.snap + 0.25 * c.scare;
        const clawGrad = ctx.createLinearGradient(0, 0, 0, -0.22 * sz);
        clawGrad.addColorStop(0, `rgb(${darkColor})`);
        clawGrad.addColorStop(1, `rgb(${shellColor})`);
        ctx.fillStyle = clawGrad;

        ctx.beginPath();
        ctx.moveTo(-0.05 * sz, 0);
        ctx.bezierCurveTo(-0.13 * sz, -0.06 * sz, -0.12 * sz, -0.17 * sz, -0.06 * sz, -0.2 * sz);
        ctx.lineTo(0.06 * sz, -0.2 * sz);
        ctx.bezierCurveTo(0.11 * sz, -0.15 * sz, 0.09 * sz, -0.04 * sz, 0.04 * sz, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-0.06 * sz, -0.19 * sz);
        ctx.quadraticCurveTo(-0.07 * sz, -0.3 * sz, -0.01 * sz, -0.36 * sz);
        ctx.quadraticCurveTo(-0.01 * sz, -0.27 * sz, 0, -0.2 * sz);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.translate(0.05 * sz, -0.19 * sz);
        ctx.rotate(snapRot);
        ctx.beginPath();
        ctx.moveTo(-0.04 * sz, 0);
        ctx.quadraticCurveTo(-0.02 * sz, -0.1 * sz, -0.04 * sz, -0.16 * sz);
        ctx.quadraticCurveTo(0.03 * sz, -0.1 * sz, 0.02 * sz, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.restore();
      }

      // Shell Body
      const bodyGrad = ctx.createLinearGradient(0, bodyY - 0.3 * sz, 0, bodyY + 0.2 * sz);
      bodyGrad.addColorStop(0, `rgb(${applyLight(COLORS.crab, -0.12)})`);
      bodyGrad.addColorStop(1, `rgb(${darkColor})`);
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, bodyY, sz * c.wide, 0.2 * sz, 0, Math.PI, 0);
      ctx.quadraticCurveTo(sz * c.wide * 0.85, bodyY + 0.16 * sz, 0, bodyY + 0.16 * sz);
      ctx.quadraticCurveTo(-sz * c.wide * 0.85, bodyY + 0.16 * sz, -sz * c.wide, bodyY);
      ctx.fill();

      // Eyestalks & Pupils
      for (const side of [-1, 1]) {
        ctx.strokeStyle = `rgb(${darkColor})`;
        ctx.lineWidth = Math.max(1, 0.035 * sz);
        ctx.beginPath();
        ctx.moveTo(side * sz * 0.08, bodyY - 0.16 * sz);
        ctx.lineTo(side * sz * 0.1, bodyY - 0.16 * sz - 0.11 * sz * c.stalk);
        ctx.stroke();

        const eyeX = side * sz * 0.1;
        const eyeY = bodyY - 0.18 * sz - 0.11 * sz * c.stalk;
        const eyeR = Math.max(1.6, 0.055 * sz);

        ctx.fillStyle = `rgb(${applyLight([236, 226, 205], -0.15)})`;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgb(16, 10, 8)';
        ctx.beginPath();
        ctx.arc(eyeX + side * eyeR * 0.18 + c.dir * eyeR * 0.15, eyeY + 0.1 * eyeR, 0.6 * eyeR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(eyeX - 0.3 * eyeR, eyeY - 0.35 * eyeR, Math.max(0.45, 0.22 * eyeR), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // Draw Fish
    const drawFish = (f: any, depthAlpha: number) => {
      const sz = f.size;
      const isClown = f.kind === 'clown';
      const isTang = f.kind === 'tang';
      const isRock = f.kind === 'rock';

      const bodyHeight = sz * (isClown ? 0.46 : isTang ? 0.62 : 0.36);
      const faceScale = Math.sign(f.facing || 1) * Math.max(0.12, Math.abs(f.facing));
      const tailWobble = Math.sin(f.swim * (isClown ? 1.4 : 1)) * (0.3 + 0.2 * f.scare);
      const depthFog = 0.12 + 0.5 * clamp((f.y - topsAvg) / (canvasH - topsAvg || 1), 0, 1);

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(faceScale, 1);
      ctx.rotate(clamp((f.ty - f.y) * 0.004, -0.25, 0.25));

      if (isRock) {
        const bodyColor = lerpColorStr(lerpColor(COLORS.fish, COLORS.sea, depthAlpha), COLORS.deep, depthFog);
        const bellyColor = lerpColorStr(lerpColor(COLORS.fishBelly, COLORS.sea, depthAlpha), COLORS.deep, depthFog);

        // Tail
        ctx.save();
        ctx.translate(-0.3 * sz, 0);
        ctx.rotate(tailWobble);
        ctx.fillStyle = `rgba(${bodyColor}, 0.85)`;
        ctx.beginPath();
        ctx.moveTo(0, -0.1 * bodyHeight);
        ctx.quadraticCurveTo(-0.12 * sz, -0.35 * bodyHeight, -0.24 * sz, -0.62 * bodyHeight);
        ctx.lineTo(-0.17 * sz, 0);
        ctx.lineTo(-0.24 * sz, 0.62 * bodyHeight);
        ctx.quadraticCurveTo(-0.12 * sz, 0.35 * bodyHeight, 0, 0.1 * bodyHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Body
        const rockGrad = ctx.createLinearGradient(0, -0.55 * bodyHeight, 0, 0.5 * bodyHeight);
        rockGrad.addColorStop(0, `rgb(${bodyColor})`);
        rockGrad.addColorStop(1, `rgb(${bellyColor})`);
        ctx.fillStyle = rockGrad;
        ctx.beginPath();
        ctx.moveTo(0.5 * sz, 0.04 * bodyHeight);
        ctx.bezierCurveTo(0.44 * sz, -0.5 * bodyHeight, 0.02 * sz, -0.62 * bodyHeight, -0.32 * sz, -0.12 * bodyHeight);
        ctx.lineTo(-0.32 * sz, 0.12 * bodyHeight);
        ctx.bezierCurveTo(0.02 * sz, 0.56 * bodyHeight, 0.4 * sz, 0.44 * bodyHeight, 0.5 * sz, 0.04 * bodyHeight);
        ctx.fill();

        // Eye
        ctx.fillStyle = `rgba(${bellyColor}, 0.85)`;
        ctx.beginPath();
        ctx.arc(0.34 * sz, -0.08 * bodyHeight, Math.max(1, 0.032 * sz), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(${Deep})`;
        ctx.beginPath();
        ctx.arc(0.345 * sz, -0.08 * bodyHeight, Math.max(0.6, 0.018 * sz), 0, Math.PI * 2);
        ctx.fill();
      } else {
        const baseKindColor = isClown ? COLORS.clown : COLORS.tang;
        const fishColor = lerpColorStr(lerpColor(baseKindColor, COLORS.sea, 0.36), COLORS.deep, depthFog);
        const tailColor = lerpColorStr(isClown ? COLORS.clown : COLORS.tangTail, COLORS.deep, depthFog);

        // Tail
        ctx.save();
        ctx.translate(-0.28 * sz, 0);
        ctx.rotate(tailWobble);
        ctx.fillStyle = `rgb(${tailColor})`;
        ctx.beginPath();
        if (isClown) {
          ctx.moveTo(0, -0.12 * bodyHeight);
          ctx.bezierCurveTo(-0.12 * sz, -0.5 * bodyHeight, -0.24 * sz, -0.38 * bodyHeight, -0.22 * sz, 0);
          ctx.bezierCurveTo(-0.24 * sz, 0.38 * bodyHeight, -0.12 * sz, 0.5 * bodyHeight, 0, 0.12 * bodyHeight);
        } else {
          ctx.moveTo(0, -0.08 * bodyHeight);
          ctx.lineTo(-0.2 * sz, -0.42 * bodyHeight);
          ctx.quadraticCurveTo(-0.13 * sz, 0, -0.2 * sz, 0.42 * bodyHeight);
          ctx.lineTo(0, 0.08 * bodyHeight);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Body Contour
        const bodyPath = new Path2D();
        bodyPath.moveTo(0.5 * sz, 0.05 * bodyHeight);
        bodyPath.bezierCurveTo(0.46 * sz, -0.5 * bodyHeight, 0.05 * sz, -0.56 * bodyHeight, -0.3 * sz, -0.16 * bodyHeight);
        bodyPath.lineTo(-0.3 * sz, 0.16 * bodyHeight);
        bodyPath.bezierCurveTo(0.05 * sz, 0.56 * bodyHeight, 0.44 * sz, 0.48 * bodyHeight, 0.5 * sz, 0.05 * bodyHeight);

        const bgrad = ctx.createLinearGradient(0, -0.5 * bodyHeight, 0, 0.5 * bodyHeight);
        bgrad.addColorStop(0, `rgb(${fishColor})`);
        bgrad.addColorStop(1, `rgb(${fishColor})`);
        ctx.fillStyle = bgrad;
        ctx.fill(bodyPath);

        // Stripes for Clownfish
        if (isClown) {
          ctx.save();
          ctx.clip(bodyPath);
          for (const pos of [0.3, 0.02, -0.24]) {
            const w = sz * (pos > 0.2 ? 0.075 : 0.065);
            ctx.fillStyle = 'rgb(18, 16, 20)';
            ctx.fillRect(sz * pos - w / 2 - 0.02 * sz, -bodyHeight, w + 0.04 * sz, 2 * bodyHeight);
            ctx.fillStyle = `rgb(${colorRgbStr(COLORS.clownBand)})`;
            ctx.beginPath();
            ctx.ellipse(sz * pos, 0, w / 2, bodyHeight, 0.6 * pos, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Eye
        const eyeR = Math.max(1.2, 0.04 * sz);
        ctx.fillStyle = `rgb(240, 236, 226)`;
        ctx.beginPath();
        ctx.arc(0.33 * sz, -0.08 * bodyHeight, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgb(12, 10, 12)';
        ctx.beginPath();
        ctx.arc(0.34 * sz, -0.08 * bodyHeight, 0.6 * eyeR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // Draw Kelp
    const computeKelpSpine = (k: any) => {
      const segLen = (k.length * kelpScale) / 16;
      let currX = k.x;
      let currY = k.back ? canvasH + 6 : floorProfile(k.x) + 10;
      const spine = [{ x: currX, y: currY, angle: 0, s: 0 }];

      for (let i = 1; i <= 16; i++) {
        const norm = i / 16;
        const wave =
          0.24 * Math.sin(simTime * k.speed + k.phase - 3.2 * norm) * norm +
          0.06 * Math.sin(simTime * k.speed * 1.7 + 2 * k.phase - 5 * norm) * norm;
        const ang = k.bend * norm + wave + k.push * norm * 1.3 + gravity.upright * norm;
        currX += Math.sin(ang) * segLen;
        currY -= Math.cos(ang) * segLen;
        spine.push({ x: currX, y: currY, angle: ang, s: norm });
      }
      return spine;
    };

    const drawKelp = (k: any) => {
      const spine = computeKelpSpine(k);
      const alphaVal = k.back ? 0.6 : 0.36;
      const getKelpColor = (base: number[], y: number) =>
        lerpColorStr(lerpColor(base, COLORS.sea, alphaVal), COLORS.deep, 0.12 + clamp((y - topsAvg) / (canvasH - topsAvg || 1), 0, 1) * (k.back ? 0.55 : 0.6));
      const strokeAlpha = k.back ? 0.42 : 0.86;

      const path = new Path2D();
      spine.forEach(({ x, y }, idx) => {
        if (idx === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      });

      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(${getKelpColor(COLORS.kelp, 0.85 * canvasH)}, ${strokeAlpha})`;
      ctx.lineWidth = k.back ? 1.6 : 2.6;
      ctx.stroke(path);

      // Blades
      for (let i = 3; i < spine.length; i += 2) {
        const pt = spine[i];
        const side = (i - 1) % 4 ? 1 : -1;
        const bladeLen = k.base * Math.min(1, 2 * pt.s) * (1 - 0.35 * pt.s);
        const wave = 0.2 * Math.sin(1.2 * simTime + k.phase + 0.9 * i) + 0.08 * Math.sin(0.55 * simTime + i);
        const ang = pt.angle + side * (0.42 + wave) + 0.5 * k.push;
        const bladeX = Math.sin(ang);
        const bladeY = -Math.cos(ang);
        const perpX = Math.cos(ang);
        const perpY = Math.sin(ang);
        const bladeW = 0.17 * bladeLen;

        const bpath = new Path2D();
        bpath.moveTo(pt.x, pt.y);
        const tipX = pt.x + bladeX * bladeLen;
        const tipY = pt.y + bladeY * bladeLen;

        bpath.quadraticCurveTo(
          pt.x + bladeX * bladeLen * 0.5 + perpX * bladeW * side,
          pt.y + bladeY * bladeLen * 0.5 + perpY * bladeW * side,
          tipX,
          tipY
        );
        bpath.quadraticCurveTo(
          pt.x + bladeX * bladeLen * 0.5 - perpX * bladeW * side * 0.5,
          pt.y + bladeY * bladeLen * 0.5 - perpY * bladeW * side * 0.5,
          pt.x,
          pt.y
        );
        bpath.closePath();

        const bgrad = ctx.createLinearGradient(pt.x, pt.y, tipX, tipY);
        bgrad.addColorStop(0, `rgba(${getKelpColor(COLORS.kelpRoot, pt.y)}, ${strokeAlpha})`);
        bgrad.addColorStop(0.45, `rgba(${getKelpColor(COLORS.kelp, pt.y)}, ${strokeAlpha})`);
        bgrad.addColorStop(1, `rgba(${getKelpColor(COLORS.kelpTip, tipY)}, ${0.9 * strokeAlpha})`);
        ctx.fillStyle = bgrad;
        ctx.fill(bpath);
      }
    };

    // Draw Digit (Dry or Submerged)
    const drawDigit = (d: any, isSubmerged: boolean, targetCtx: CanvasRenderingContext2D = ctx) => {
      targetCtx.save();
      targetCtx.translate(
        d.x + (isSubmerged ? 4 * Math.sin(0.02 * d.y + 1.4 * simTime) : 0),
        d.y + (isSubmerged ? 3 : 0)
      );
      targetCtx.rotate(d.angle);
      if (isSubmerged) {
        targetCtx.scale(1.02, 1.02);
      }
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      targetCtx.drawImage(d.art, -d.w / 2 - d.pad, -d.h / 2 - d.pad, d.art.width / ratio, d.art.height / ratio);

      const darkFactor = sunbeamIntensity * (1 - d.light) * 0.36;
      if (darkFactor > 0.01) {
        targetCtx.globalAlpha *= darkFactor;
        targetCtx.drawImage(d.dark, -d.w / 2 - d.pad, -d.h / 2 - d.pad, d.dark.width / ratio, d.dark.height / ratio);
      }
      targetCtx.restore();
    };

    // Marching Squares Path Builder with Procedural Fallback
    const buildWaterContourPath = (targetPath: Path2D) => {
      const { xs, ys, starts } = fluidController.frame;
      if (starts && starts.length > 1 && xs && xs.length >= 4) {
        for (let i = 0; i < starts.length - 1; i++) {
          const startIdx = starts[i];
          const endIdx = starts[i + 1];
          targetPath.moveTo(xs[startIdx], ys[startIdx]);
          for (let j = startIdx + 1; j < endIdx; j++) {
            targetPath.lineTo(xs[j], ys[j]);
          }
          targetPath.closePath();
        }
      } else {
        // Smooth sine-wave water fallback so water is always visible
        targetPath.moveTo(0, canvasH);
        targetPath.lineTo(0, waterLevel);
        for (let x = 0; x <= canvasW; x += 20) {
          const wave = Math.sin(x * 0.015 + simTime * 2) * 4 + Math.sin(x * 0.035 - simTime * 1.4) * 2;
          targetPath.lineTo(x, waterLevel + wave);
        }
        targetPath.lineTo(canvasW, canvasH);
        targetPath.closePath();
      }
      return targetPath;
    };

    // Main Physics Step
    const stepPhysics = () => {
      const gravAngle = tiltAngle;
      gravity.x = clamp(Math.sin(gravAngle) - (screenPos.ax * 0.18) - deviceTilt.x, -2.5, 2.5);
      gravity.y = clamp(Math.cos(gravAngle) - (screenPos.ay * 0.18) - deviceTilt.y, -1.5, 3.5);
      gravity.upright += (Math.atan2(-gravity.x, Math.max(0.2, gravity.y)) - gravity.upright) * 0.08;

      // Mouse drag water stir
      if (!activeDrag && mousePos.y > waterTop(mousePos.x) - 24 && Math.abs(mousePos.vx) + Math.abs(mousePos.vy) > 1) {
        fluidController.nudge(mousePos.x, mousePos.y, 56, 16 * clamp(mousePos.vx, -40, 40), 16 * clamp(mousePos.vy, -40, 40));
      }

      // Kelp Current Coupling
      for (const k of kelpList) {
        const topY = canvasH - k.length;
        const flowAtKelp = fluidController.flow(k.x, canvasH - 0.5 * k.length);
        if (flowAtKelp) {
          k.drift += 0.0016 * clamp(flowAtKelp[0] / 60, -8, 8);
        }
        if (mousePos.y > topY && mousePos.y < canvasH && Math.abs(mousePos.x - k.x) < 70) {
          k.drift += 0.00045 * clamp(mousePos.vx, -12, 12);
        }
        for (const d of digits) {
          if (d.y + d.h / 2 > topY && Math.abs(d.x - k.x) < d.w / 2 + 40) {
            k.drift += 0.0006 * clamp(d.vx, -12, 12);
          }
        }
        k.drift += -0.012 * k.push - 0.05 * k.drift;
        k.push = clamp(k.push + k.drift, -0.4, 0.4);
      }

      mousePos.vx *= 0.6;
      mousePos.vy *= 0.6;

      // Step Sea Fluid
      fluidController.step(
        5200 * Math.sin(gravAngle),
        5200 * Math.cos(gravAngle),
        -(2 * (60 * motionKick.x)),
        -(2 * (60 * motionKick.y)),
        1.0
      );
      motionKick.x = 0;
      motionKick.y = 0;

      for (let i = 0; i < foamArray.length; i++) {
        foamArray[i] *= 0.982;
      }

      const frame = fluidController.frame;
      if (frame && frame.id !== lastFrameId) {
        lastFrameId = frame.id;
        if (foamArray.length !== frame.tops.length) {
          foamArray = new Float32Array(frame.tops.length);
        }

        let topsSum = 0;
        for (let i = 0; i < frame.tops.length; i++) {
          topsSum += frame.tops[i];
        }
        topsAvg = frame.tops.length ? topsSum / frame.tops.length : waterLevel;

        let impactSum = 0;
        let impactWeightedX = 0;
        for (let i = 0; i < frame.impacts.length; i += 3) {
          const ix = frame.impacts[i];
          const iy = frame.impacts[i + 1];
          const ip = (frame.impacts[i + 2] - 600) / 2400;
          addFoam(ix, Math.min(0.5, 0.6 * ip), 2);
          if (Math.random() < 0.6) {
            bubbles.push({
              x: ix + randomRange(-6, 6),
              y: iy + randomRange(6, 30),
              r: randomRange(1, 3.2),
              speed: randomRange(0.5, 1.2),
              seed: randomRange(0, 9),
              age: 0,
              wobble: randomRange(0.2, 0.5),
              loud: ip > 0.5 && Math.random() < 0.3,
            });
          }
          impactSum += ip;
          impactWeightedX += ix * ip;
        }

        if (impactSum > 0.8 && simTime - lastSplashTime > 0.3) {
          lastSplashTime = simTime;
          audio.splash(Math.min(1, impactSum / 5), panFromX(impactWeightedX / impactSum));
          for (const f of fishList) {
            f.scare = Math.max(f.scare, Math.min(1, impactSum / 4));
          }
        } else if (impactSum > 0) {
          audio.drip(1 + 2 * impactSum, panFromX(impactWeightedX / impactSum));
        }
      }

      // Step Digits Physics
      for (const d of digits) {
        d.shade += (clamp((d.y - topsAvg) / (0.6 * d.h) + 0.5, 0, 1) - d.shade) * 0.04;

        if (activeDrag?.digit === d) {
          const targetX = mousePos.x - activeDrag.dx;
          const targetY = mousePos.y - activeDrag.dy;
          d.vx = (targetX - d.x) * 0.35;
          d.vy = (targetY - d.y) * 0.35;
          d.x += d.vx;
          d.y += d.vy;
          d.spin += (-d.angle + 0.01 * d.vx) * 0.1 - 0.2 * d.spin;
          d.angle += d.spin;
          nudgeWaterByDigit(d, waterTop(d.x));
          continue;
        }

        const bottomY = d.y + d.h / 2;
        const halfW = d.w / 2;
        let surfAtD = 0;
        for (let sample = -2; sample <= 2; sample++) {
          surfAtD += waterTop(d.x + (sample / 2) * halfW) / 5;
        }
        const subm = clamp(bottomY - surfAtD, 0, d.h) / d.h;

        if (d.wet === 0 && subm > 0 && d.vy > 5) {
          triggerPlunge(d.x, d.vy);
          fluidController.nudge(d.x, surfAtD, 0.55 * d.w, 0, 36 * d.vy);
          fluidController.nudge(d.x - 0.5 * d.w, surfAtD, 0.32 * d.w, -20 * d.vy, -26 * d.vy);
          fluidController.nudge(d.x + 0.5 * d.w, surfAtD, 0.32 * d.w, 20 * d.vy, -26 * d.vy);
          d.vy *= 0.55;
        }

        const airFactor = 1 - subm / 0.48;
        d.vx += 0.5 * gravity.x * airFactor;
        d.vy += 0.5 * gravity.y * airFactor;

        if (subm > 0) {
          nudgeWaterByDigit(d, surfAtD);
          let flowSumX = 0;
          let flowSumY = 0;
          let sampleCount = 0;
          for (const [ox, oy] of [
            [0, 0],
            [-0.6 * halfW, 0.25 * d.h],
            [0.6 * halfW, 0.25 * d.h],
            [0, 0.4 * d.h],
          ]) {
            const fl = fluidController.flow(d.x + ox, d.y + oy);
            if (fl) {
              flowSumX += fl[0];
              flowSumY += fl[1];
              sampleCount++;
            }
          }
          if (sampleCount) {
            d.vx += (flowSumX / sampleCount / 60 - d.vx) * 0.05 * subm;
            d.vy += (flowSumY / sampleCount / 60 - d.vy) * 0.03 * subm;
          }
          d.vy *= 1 - 0.06 * subm;
          d.vx += (d.home - d.x) * 0.0006 * subm;
          d.vx *= 1 - 0.02 * subm;

          const slope = (waterTop(d.x + halfW) - waterTop(d.x - halfW)) / d.w;
          d.vx += (slope * gravity.y + gravity.x) * 0.45 * subm;
          d.spin += (0.9 * Math.atan(slope) - d.angle) * 0.012 * subm - 0.05 * d.spin;

          if (Math.random() < 0.03 * subm) {
            bubbles.push({
              x: d.x + randomRange(-d.w / 3, d.w / 3),
              y: bottomY - 6,
              r: randomRange(1.2, 3.4),
              speed: randomRange(0.5, 1.2),
              seed: randomRange(0, 9),
              age: 0,
              wobble: randomRange(0.2, 0.5),
              loud: Math.abs(d.vx) + Math.abs(d.vy) > 4,
            });
          }
        } else {
          d.spin *= 0.99;
        }

        d.wet = subm;
        d.angle += d.spin;
        d.x += d.vx;
        d.y += d.vy;
        resolveWallBounds(d, true);
      }

      // Sort homes to keep order
      const homePositions = digits.map((d) => d.home).sort((a, b) => a - b);
      [...digits].sort((a, b) => a.x - b.x).forEach((d, idx) => (d.home = homePositions[idx]));

      // SAT iterations
      for (let iter = 0; iter < 4; iter++) {
        for (let i = 0; i < digits.length; i++) {
          for (let j = i + 1; j < digits.length; j++) {
            resolveDigitSAT(digits[i], digits[j], iter === 0);
          }
        }
        for (const d of digits) resolveWallBounds(d, false);
      }

      // Step Bubbles
      if (Math.random() < (canvasW / 1440) * 0.11) {
        const bx = Math.random() < 0.35 && bubbleVents.length ? bubbleVents[Math.floor(Math.random() * bubbleVents.length)] + randomRange(-6, 6) : randomRange(0, canvasW);
        bubbles.push({
          x: bx,
          y: floorProfile(bx),
          r: 0.6 + 3 * Math.pow(Math.random(), 2.2),
          speed: randomRange(0.45, 1.25),
          seed: randomRange(0, 9),
          age: 0,
          wobble: randomRange(0.2, 0.7),
        });
      }

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.age += 1 / 60;
        b.speed = Math.min(1.002 * b.speed, 2.2);
        b.y -= b.speed * gravity.y;
        b.x += Math.sin(3 * b.age + b.seed) * b.wobble - b.speed * gravity.x;
        const fl = fluidController.flow(b.x, b.y);
        if (fl) {
          b.x += (fl[0] / 60) * 0.7;
          b.y += (fl[1] / 60) * 0.7;
        }
        if (fluidController.inside(b.x, b.y - b.r)) {
          if (b.y > canvasH + 10 || b.x < -10 || b.x > canvasW + 10) {
            bubbles.splice(i, 1);
          }
        } else {
          if (b.r > 1.6) addFoam(b.x, 0.03 * b.r, 0);
          if (b.loud) audio.pop(b.r, panFromX(b.x));
          bubbles.splice(i, 1);
        }
      }

      // Step Spray Droplets
      for (let i = waterSprayList.length - 1; i >= 0; i--) {
        const s = waterSprayList[i];
        s.vx += 0.35 * gravity.x;
        s.vy += 0.35 * gravity.y;
        s.x += s.vx;
        s.y += s.vy;
        if (s.vy > 0 && fluidController.inside(s.x, s.y)) {
          addFoam(s.x, 0.05 * s.r, 1);
          audio.drip(s.r, panFromX(s.x));
          waterSprayList.splice(i, 1);
        } else if (s.x < 0 || s.x > canvasW || s.y < -60) {
          waterSprayList.splice(i, 1);
        }
      }

      // Step Fishes
      for (const f of fishList) {
        if (mousePos.y > topsAvg && Math.hypot(f.x - mousePos.x, f.y - mousePos.y) < 90 + f.size) {
          f.dir = Math.sign(f.x - mousePos.x) || f.dir;
          f.scare = Math.max(f.scare, 0.75);
          f.ty = clamp(f.y + (Math.sign(f.y - mousePos.y) || 1) * randomRange(40, 90), topsAvg + 40, canvasH - 30);
        }
        f.scare *= 0.985;
        f.facing += clamp(f.dir - f.facing, -1, 1) * (0.045 + 0.05 * f.scare);
        const speedVal = f.speed * (1 + 2.2 * f.scare) * (0.6 + 0.4 * Math.abs(f.facing));
        const fl = fluidController.flow(f.x, f.y);
        f.x += f.facing * speedVal + 0.25 * clamp((fl?.[0] ?? 0) / 60, -6, 6);
        f.y += (f.ty - f.y) * (0.004 + 0.02 * f.scare) + 0.06 * Math.sin(1.2 * simTime + f.phase);
        f.y = clamp(f.y, waterTop(f.x) + 0.6 * f.size, floorProfile(f.x) - 0.5 * f.size);
        f.swim += 0.07 + 0.14 * speedVal;

        if (f.x < 1.2 * f.size && f.dir < 0) f.dir = 1;
        if (f.x > canvasW - 1.2 * f.size && f.dir > 0) f.dir = -1;
      }

      // Step Crabs
      for (const c of crabList) {
        const groundY = floorProfile(c.x);
        if (Math.abs(mousePos.x - c.x) < 90 && Math.abs(mousePos.y - groundY) < 110 && mousePos.y > topsAvg) {
          c.dir = Math.sign(c.x - mousePos.x) || 1;
          c.scare = 1;
          c.rest = 0;
        }
        c.scare *= 0.98;
        c.timer -= 1 / 60;
        if (c.timer <= 0) {
          c.rest = c.rest > 0 ? 0 : Math.random() < 0.5 ? 1 : 0;
          if (!c.rest && Math.random() < 0.4) c.dir *= -1;
          c.timer = c.rest ? randomRange(1.2, 3) : randomRange(2, 5);
        }
        if (c.rest && Math.random() < 0.01) c.snap = 1;
        c.snap *= 0.9;

        if (c.x < c.size) c.dir = 1;
        if (c.x > canvasW - c.size) c.dir = -1;

        const crabSpeed = c.rest && c.scare < 0.1 ? 0 : c.speed * (1 + 4 * c.scare);
        c.x += c.dir * crabSpeed;
        c.walk += 0.32 * crabSpeed;
      }
    };

    // Render Scene Frame
    const renderScene = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgb(${V})`;
      ctx.fillRect(0, 0, canvasW, canvasH);

      const waterContour = buildWaterContourPath(new Path2D());
      const dryMask = new Path2D();
      dryMask.rect(0, 0, canvasW, canvasH);
      buildWaterContourPath(dryMask);

      renderSeabedTexture();
      updateSunbeamTextures();

      // ============================================
      // 1. ABOVE-WATER SKY & DRY PASS
      // ============================================
      ctx.save();
      ctx.clip(dryMask, 'evenodd');

      // Celestial dot grid background
      if (starFieldCanvas.width > 0) {
        ctx.drawImage(starFieldCanvas, 0, 0, canvasW, canvasH);
      }

      // Ambient Celestial Light Glow in Upper Right Sky
      // Rich, warm spotlight emanating from upper-right, illuminating sky and casting light down-left
      const airContourForSky = new Path2D();
      airContourForSky.rect(0, 0, canvasW, canvasH);
      buildWaterContourPath(airContourForSky);

      ctx.save();
      ctx.clip(airContourForSky, 'evenodd');
      const skyGlow = ctx.createRadialGradient(
        canvasW * 0.82, -0.06 * canvasH, 20,
        canvasW * 0.82, -0.06 * canvasH, canvasW * 0.82
      );
      skyGlow.addColorStop(0, 'rgba(255, 246, 232, 0.42)');
      skyGlow.addColorStop(0.25, 'rgba(255, 236, 210, 0.26)');
      skyGlow.addColorStop(0.55, 'rgba(245, 215, 175, 0.12)');
      skyGlow.addColorStop(0.85, 'rgba(220, 190, 150, 0.03)');
      skyGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = skyGlow;
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.restore();

      // Background kelp in air/top
      ctx.globalAlpha = sandAlpha;
      for (const k of kelpList) if (k.back) drawKelp(k);

      // Sandbed & crabs in air/top
      ctx.save();
      ctx.globalAlpha = sandAlpha;
      if (sandFloorCanvas.width > 0) ctx.drawImage(sandFloorCanvas, 0, 0, canvasW, canvasH);
      for (const c of crabList) drawCrab(c);
      for (const k of kelpList) if (!k.back) drawKelp(k);
      ctx.restore();

      // DRY DIGITS (Bright, crisp white/cream front with warm bevel)
      ctx.globalAlpha = 1;
      for (const d of digits) drawDigit(d, false);
      ctx.restore();

      // ============================================
      // 2. UNDERWATER SUBMERGED PASS
      // ============================================
      ctx.save();
      ctx.clip(waterContour, 'evenodd');

      // Refracted background grid below water
      if (starFieldCanvas.width > 0) {
        const startRefractY = Math.max(0, topsAvg - 0.4 * canvasH);
        for (let y = startRefractY; y < canvasH; y += 12) {
          const offset = 2.5 * Math.sin(0.035 * y + 1.3 * simTime);
          ctx.drawImage(starFieldCanvas, 0, y * dpr, starFieldCanvas.width, 12 * dpr, offset, y, canvasW, 12);
        }
      }

      // Background Kelp
      ctx.globalAlpha = sandAlpha;
      for (const k of kelpList) if (k.back) drawKelp(k);

      // Deep swimming fish
      ctx.globalAlpha = fishAlpha;
      for (const f of fishList) if (f.depth > 0.5) drawFish(f, 0.4);

      // Marine snow flecks
      ctx.globalAlpha = 1;
      for (const snow of marineSnow) {
        const spanH = canvasH - topsAvg;
        const sy = topsAvg + ((snow.v * spanH + simTime * snow.sink) % spanH);
        const sx = ((snow.u * canvasW + 24 * Math.sin(0.25 * simTime + snow.seed) + 2 * simTime) % canvasW + canvasW) % canvasW;
        ctx.fillStyle = `rgba(${J}, ${snow.alpha})`;
        ctx.fillRect(sx, sy, snow.size, snow.size);
      }

      // Deep aquatic gradient fill
      const oceanTopY = waterLevel - 40;
      const deepGrad = ctx.createLinearGradient(0, oceanTopY, 0, canvasH);
      const seaGlowGrad = ctx.createLinearGradient(0, oceanTopY, 0, canvasH);
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const curved = t * t * (3 - 2 * t);
        // Deep ocean: darkens heavily as depth increases
        deepGrad.addColorStop(t, `rgba(${Deep}, ${(0.22 + 0.76 * curved).toFixed(3)})`);
        // Cyan sea glow: glowing near surface, fading at depth
        seaGlowGrad.addColorStop(t, `rgba(${Sea}, ${(0.52 * Math.pow(1 - t, 1.8)).toFixed(3)})`);
      }

      ctx.fillStyle = deepGrad;
      ctx.fillRect(0, topsAvg - 40, canvasW, canvasH - (topsAvg - 40));
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = seaGlowGrad;
      ctx.fillRect(0, topsAvg - 40, canvasW, canvasH - (topsAvg - 40));
      ctx.globalCompositeOperation = 'source-over';

      // Foreground fish
      ctx.globalAlpha = fishAlpha;
      for (const f of fishList) if (f.depth <= 0.5) drawFish(f, 0.3 + 0.3 * f.depth);

      // Sand floor & crabs underwater
      ctx.globalAlpha = sandAlpha;
      if (sandFloorCanvas.width > 0) ctx.drawImage(sandFloorCanvas, 0, 0, canvasW, canvasH);
      if (sunbeamIntensity > 0 && sandLightCanvas.width > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = sunbeamIntensity * sandAlpha;
        ctx.drawImage(sandLightCanvas, 0, 0, canvasW, canvasH);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = sandAlpha;
      for (const c of crabList) drawCrab(c);
      for (const k of kelpList) if (!k.back) drawKelp(k);

      // ============================================
      // SUBMERGED DIGITS WITH DEPTH COLOR CHANGE
      // (Cyan-teal near surface, dark ocean navy deeper down)
      // ============================================
      const submergedDigits = digits.filter((d) => {
        const bound = 1.05 * Math.hypot(d.w / 2 + d.pad, d.h / 2 + d.pad) + 8;
        return !(d.y + bound < topsAvg);
      });

      if (submergedDigits.length > 0 && submergedCanvas.width > 0 && submergedCanvas.height > 0) {
        submergedCtx.setTransform(1, 0, 0, 1, 0, 0);
        submergedCtx.globalCompositeOperation = 'source-over';
        submergedCtx.clearRect(0, 0, submergedCanvas.width, submergedCanvas.height);
        submergedCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // 1. Draw digits onto offscreen submerged buffer
        for (const d of submergedDigits) {
          drawDigit(d, true, submergedCtx);
        }

        // 2. Tint with water depth gradients via 'source-atop'
        submergedCtx.globalAlpha = 1;
        submergedCtx.globalCompositeOperation = 'source-atop';

        // Deep ocean gradient: darkens strongly as number goes deeper down
        submergedCtx.fillStyle = deepGrad;
        submergedCtx.fillRect(0, 0, canvasW, canvasH);

        // Cyan sea glow gradient: gives vivid water tint near top
        submergedCtx.fillStyle = seaGlowGrad;
        submergedCtx.fillRect(0, 0, canvasW, canvasH);

        // 3. Composite tinted submerged digits onto main canvas inside waterContour
        ctx.drawImage(submergedCanvas, 0, 0, canvasW, canvasH);
      }

      // Water Surface Caustic Glow & Wave Meniscus
      ctx.globalCompositeOperation = 'lighter';
      const surfGrad = ctx.createLinearGradient(0, 0, canvasW, 0);
      const { tops, h } = fluidController.frame;
      if (tops && tops.length > 0) {
        for (let i = 0; i < tops.length; i += 2) {
          const px = (i + 0.5) * h;
          const waveFoam = 0.5 * clamp((waterLevel - tops[i]) / 16, 0, 1) + (foamArray[i] ?? 0) * 0.6;
          const lightBoost = 0.45 + 0.55 * getLightIntensityAt(px, waterLevel) * sunbeamIntensity;
          surfGrad.addColorStop(
            clamp(px / canvasW, 0, 1),
            `rgba(${J}, ${(0.045 + waveFoam * 0.12 * lightBoost).toFixed(3)})`
          );
        }
      }

      ctx.save();
      ctx.clip(floorPath);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = surfGrad;
      ctx.lineWidth = 16;
      ctx.stroke(waterContour);
      ctx.lineWidth = 5;
      ctx.stroke(waterContour);
      ctx.restore();

      // Bubbles
      for (const b of bubbles) {
        const normH = clamp((b.y - topsAvg) / (canvasH - topsAvg || 1), 0, 1);
        const bubbleAlpha = Math.min(1, 2 * b.age) * (1 - 0.6 * normH);
        const bRad = b.r * (1 + (1 - normH) * 0.3);
        const wobbleRatio = 1 + 0.07 * Math.sin(11 * b.age + b.seed) * Math.min(1, bRad / 2);
        const szPix = (32 * bRad) / 30;
        ctx.globalAlpha = clamp(bubbleAlpha, 0, 1);
        ctx.drawImage(bubbleCanvas, b.x - szPix * wobbleRatio, b.y - szPix / wobbleRatio, 2 * szPix * wobbleRatio, (2 * szPix) / wobbleRatio);
      }

      // Sparkles
      ctx.globalAlpha = 1;
      for (const sp of sparkles) {
        const sy = canvasH * sp.v;
        const sx = ((sp.u * canvasW + simTime * (sy < topsAvg ? 6 : 2.5) + 12 * Math.sin(0.4 * simTime + sp.seed)) % canvasW + canvasW) % canvasW;
        const lightFactor = getLightIntensityAt(sx, sy) * sunbeamIntensity;
        if (lightFactor <= 0.05) continue;
        const twinkle = 0.5 + 0.5 * Math.sin(1.7 * simTime + 3 * sp.seed);
        ctx.fillStyle = `rgba(${sy < topsAvg ? N : J}, ${(lightFactor * twinkle * 0.55).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sp.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Water Noise Texture Overlay
      if (waterNoisePattern) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.13 * sandAlpha;
        ctx.fillStyle = waterNoisePattern;
        ctx.fill(waterContour, 'evenodd');
        ctx.restore();
      }

      // Sharp Meniscus Wave Outline
      ctx.save();
      ctx.clip(floorPath);
      ctx.strokeStyle = `rgba(${J}, 0.3)`;
      ctx.lineWidth = 3;
      ctx.stroke(waterContour);
      ctx.strokeStyle = `rgba(${N}, 0.55)`;
      ctx.lineWidth = 1.1;
      ctx.stroke(waterContour);

      // Spray particles
      const sprayPath = new Path2D();
      for (const sp of waterSprayList) {
        sprayPath.moveTo(sp.x, sp.y);
        sprayPath.lineTo(sp.x - 0.8 * sp.vx, sp.y - 0.8 * sp.vy);
      }
      const { spray } = fluidController.frame;
      if (spray && spray.length) {
        for (let i = 0; i < spray.length; i += 4) {
          const sx = spray[i];
          const sy = spray[i + 1];
          const svx = (spray[i + 2] / 60) * 0.8;
          const svy = (spray[i + 3] / 60) * 0.8;
          const mag = Math.min(1, 6 / (Math.hypot(svx, svy) || 1));
          sprayPath.moveTo(sx, sy);
          sprayPath.lineTo(sx - svx * mag, sy - svy * mag + 0.01);
        }
      }
      ctx.strokeStyle = `rgba(${N}, 0.6)`;
      ctx.lineWidth = 1.6;
      ctx.stroke(sprayPath);
      ctx.restore();

      ctx.restore(); // end submerged pass

      // ============================================
      // 3. VOLUMETRIC SUNBEAM LIGHT PASS
      // (Slants from upper-right across sky & water, casts dramatic shadows behind digits)
      // ============================================
      if (sunbeamIntensity > 0 && rayCanvas.width > 0 && rayCanvas.height > 0) {
        const { tilt, under } = getSunbeamProps();

        // 1. Fill air and water beams onto rayCanvas (1/3 scale offscreen buffer)
        rayCtx.setTransform(1 / 3, 0, 0, 1 / 3, 0, 0);
        rayCtx.globalCompositeOperation = 'source-over';
        rayCtx.clearRect(0, 0, canvasW, canvasH);

        const airContour = new Path2D();
        airContour.rect(0, 0, canvasW, canvasH);
        buildWaterContourPath(airContour);

        for (const [path, tex] of [
          [airContour, beamTextures.air],
          [waterContour, beamTextures.water],
        ] as const) {
          if (tex.width > 0 && tex.height > 0) {
            const pat = rayCtx.createPattern(tex, 'no-repeat');
            if (pat) {
              pat.setTransform(new DOMMatrix().scale(3, 3));
              rayCtx.fillStyle = pat;
              rayCtx.fill(path, 'evenodd');
            }
          }
        }

        // 2. Volumetric shadow casting by digits (28-step ray extrusion)
        rayCtx.globalCompositeOperation = 'destination-out';
        const shadowRatio = Math.min(window.devicePixelRatio || 1, 2);
        for (const d of digits) {
          if (!d.ghost || d.ghost.width === 0) continue;
          const rayAngle = tilt + (under - tilt) * (d.shade || 0.5);
          const cosRay = Math.cos(d.angle) / 3;
          const sinRay = Math.sin(d.angle) / 3;
          for (let s = 1; s <= 28; s++) {
            rayCtx.globalAlpha = 0.15 * (1 - s / 31);
            rayCtx.setTransform(
              cosRay,
              sinRay,
              -sinRay,
              cosRay,
              (d.x - 8 * Math.sin(rayAngle) * s) / 3,
              (d.y + 8 * Math.cos(rayAngle) * s) / 3
            );
            rayCtx.drawImage(
              d.ghost,
              -d.w / 2 - d.pad,
              -d.h / 2 - d.pad,
              d.art.width / shadowRatio,
              d.art.height / shadowRatio
            );
          }
        }

        // 3. Reset transform and blur onto blurCanvas
        rayCtx.setTransform(1 / 3, 0, 0, 1 / 3, 0, 0);
        rayCtx.globalAlpha = 1;
        rayCtx.globalCompositeOperation = 'source-over';

        blurCtx.setTransform(1, 0, 0, 1, 0, 0);
        blurCtx.clearRect(0, 0, blurCanvas.width, blurCanvas.height);
        blurCtx.filter = 'blur(3.33px)';
        blurCtx.drawImage(rayCanvas, 0, 0);
        blurCtx.filter = 'none';

        // 4. Additive blend onto main canvas
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = sunbeamIntensity;
        ctx.drawImage(blurCanvas, 0, 0, canvasW, canvasH);
        ctx.restore();

        // 5. Shimmering dust motes floating inside the sunbeam
        for (const mote of sparkles) {
          const my = canvasH * mote.v;
          const mx = (mote.u * canvasW + simTime * (my < topsAvg ? 6 : 2.5) + 12 * Math.sin(0.4 * simTime + mote.seed)) % canvasW;
          const lightAtMote = getLightIntensityAt(mx, my) * sunbeamIntensity;
          if (lightAtMote <= 0.05) continue;
          const twinkle = 0.5 + 0.5 * Math.sin(1.7 * simTime + 3 * mote.seed);
          ctx.fillStyle = `rgba(${my < topsAvg ? colorRgbStr(COLORS.core) : colorRgbStr(COLORS.sea)}, ${(lightAtMote * twinkle * 0.55).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(mx, my, mote.size, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Audio hydrophone stir coupling from living-ui.dev
      const { speed: seaSpeed, balance: seaBalance } = fluidController.frame;
      const spd = seaSpeed || 0;
      ty = simTime < 4 ? spd : ty + (spd - ty) * (spd < ty ? 0.02 : 0.003);
      tM = Math.min(1, (spray?.length || 0) / 4 / 260);
      audio.stir(
        clamp((spd - 1.4 * ty - 0.15) / 1.4, 0, 1),
        clamp(0.6 * tM + waterSprayList.length / 140, 0, 1),
        seaBalance || 0
      );
    };

    // Animation Loop
    const animLoop = (now: number) => {
      const deltaMs = Math.min(100, now - lastAnimTime);
      lastAnimTime = now;
      simAccumulator += deltaMs / 1000;

      let subSteps = 0;
      while (simAccumulator >= 1 / 60 - 0.002 && subSteps < 3) {
        stepPhysics();
        simTime += 1 / 60;
        simAccumulator -= 1 / 60;
        subSteps++;
      }
      if (subSteps === 3) {
        simAccumulator = Math.min(simAccumulator, 1 / 60);
      }

      for (const d of digits) {
        const intensity = getLightIntensityAt(d.x, d.y);
        d.light += (Math.min(1, 1.6 * intensity) - d.light) * 0.12;
      }

      renderScene();

      animFrameId = requestAnimationFrame(animLoop);
    };

    // Pointer Events
    const getCanvasPointer = (e: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const findDigitAt = (px: number, py: number) => {
      return [...digits].reverse().find((d) => {
        const dx = px - d.x;
        const dy = py - d.y;
        const cos = Math.cos(-d.angle);
        const sin = Math.sin(-d.angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        return Math.abs(localX) < d.w / 2 + 8 && Math.abs(localY) < d.h / 2 + 8;
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      const { x, y } = getCanvasPointer(e);
      if (typeof window !== 'undefined') {
        const isExplicitlyMuted = window.localStorage.getItem('livingui-sea-sound') === 'off';
        if (!isExplicitlyMuted && !audio.live()) {
          audio.start().then((ok) => {
            if (ok) {
              onAudioChange?.(true);
            }
          });
        }
      }

      const hitDigit = findDigitAt(x, y);
      if (!hitDigit) {
        if (y > waterTop(x) - 20) {
          fluidController.nudge(x, y, 48, 0, 700);
        }
        return;
      }

      canvas.setPointerCapture(e.pointerId);
      activeDrag = {
        digit: hitDigit,
        dx: x - hitDigit.x,
        dy: y - hitDigit.y,
        px: x,
        py: y,
        vx: 0,
        vy: 0,
      };
      hitDigit.wet = 0;
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      const { x, y } = getCanvasPointer(e);
      const isFirst = mousePos.x < -900;
      mousePos.vx = isFirst ? 0 : x - mousePos.x;
      mousePos.vy = isFirst ? 0 : y - mousePos.y;
      mousePos.x = x;
      mousePos.y = y;

      if (!activeDrag) {
        canvas.style.cursor = findDigitAt(x, y) ? 'grab' : 'default';
      }
    };

    const onPointerUp = () => {
      if (activeDrag) {
        activeDrag.digit.vx = clamp(activeDrag.digit.vx, -30, 30);
        activeDrag.digit.vy = clamp(activeDrag.digit.vy, -30, 30);
        activeDrag.digit.spin = clamp(0.003 * activeDrag.digit.vx, -0.06, 0.06);
        activeDrag.digit.wet = 0;
        activeDrag = null;
        canvas.style.cursor = 'grab';
      }
    };

    // Device Tilt & Shake
    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0;
      const deadzone = Math.abs(gamma) < 3 ? 0 : gamma - 3 * Math.sign(gamma);
      tiltAngle += (clamp((deadzone * Math.PI) / 180, -0.6, 0.6) - tiltAngle) * 0.15;
    };

    const onDeviceMotion = (e: DeviceMotionEvent) => {
      const accel = e.acceleration;
      if (!accel) return;
      const ax = accel.x ?? 0;
      const ay = accel.y ?? 0;
      deviceTilt.x += ((Math.sign(ax) * Math.max(0, Math.abs(ax) - 0.4)) / 9.81 * 0.8 - deviceTilt.x) * 0.3;
      deviceTilt.y += ((-Math.sign(ay) * Math.max(0, Math.abs(ay) - 0.4)) / 9.81 * 0.8 - deviceTilt.y) * 0.3;
      const dt = e.interval > 1 ? e.interval / 1000 : e.interval || 1 / 60;
      motionKick.x += Math.sign(ax) * Math.max(0, Math.abs(ax) - 1) * clamp(dt, 0.005, 0.05) * 40;
      motionKick.y -= Math.sign(ay) * Math.max(0, Math.abs(ay) - 1) * clamp(dt, 0.005, 0.05) * 40;
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    // Start loop immediately!
    lastAnimTime = performance.now();
    animFrameId = requestAnimationFrame(animLoop);

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('deviceorientation', onDeviceOrientation);
    window.addEventListener('devicemotion', onDeviceMotion);

    document.fonts.ready.then(() => {
      initDigits();
    });

    const onVisibilityChange = () => audio.pause(document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const unlockOnGesture = () => {
      if (isAudioOnRef.current && audioRef.current && !audioRef.current.live()) {
        audioRef.current.start();
      }
    };
    window.addEventListener('pointerdown', unlockOnGesture, { passive: true });
    window.addEventListener('keydown', unlockOnGesture, { passive: true });

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      window.removeEventListener('devicemotion', onDeviceMotion);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
      fluidController.close();
      audio.close();
      if (typeof window !== "undefined") {
        delete (window as any).__aquariumAudio;
      }
    };
  }, []);

  // Handle external toggle of audio
  useEffect(() => {
    if (!audioRef.current || isAudioOn === undefined) return;
    if (isAudioOn) {
      audioRef.current.start();
    } else {
      audioRef.current.mute(true);
    }
  }, [isAudioOn]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden={true}
      className="absolute inset-0 size-full touch-none select-none"
    />
  );
};
