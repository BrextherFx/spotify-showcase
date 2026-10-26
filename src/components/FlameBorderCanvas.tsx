import React, { useEffect, useRef } from 'react';

const powerCurve = [
  [0, 1],
  [0.1, 0.7],
  [0.2, 0],
  [0.38, 0],
  [0.48, 0.5],
  [0.6, 1],
  [0.68, 0.2],
  [0.76, 0],
  [0.88, 0],
  [1, 1],
];

const waveParams = [
  { amp: 3.5, waves: 8, speed: 1.3, phase: 0, jitter: 0.9 },
  { amp: 3.0, waves: 11, speed: -1.7, phase: 2.1, jitter: 0.8 },
  { amp: 2.5, waves: 6, speed: 2.2, phase: 4.2, jitter: 0.6 },
];

const strokeLayers = [
  { width: 8, rgb: '255, 125, 56', alpha: 0.16, flare: 1.6, thick: false },
  { width: 2.8, rgb: '255, 180, 112', alpha: 0.5, flare: 1.2, thick: true },
  { width: 1.0, rgb: '255, 244, 228', alpha: 0.95, flare: 1.0, thick: false },
  { width: 1.8, rgb: '255, 244, 228', alpha: 0.6, flare: 1.0, thick: true },
];

function interpolatePower(pos: number): number {
  for (let i = 1; i < powerCurve.length; i++) {
    const [p1, v1] = powerCurve[i];
    const [p0, v0] = powerCurve[i - 1];
    if (pos <= p1) {
      return v0 + ((pos - p0) / (p1 - p0 || 1)) * (v1 - v0);
    }
  }
  return powerCurve[0][1];
}

function buildPillContour(w: number, h: number, marginX: number, marginY: number, step: number) {
  const left = marginX;
  const top = marginY;
  const right = w - marginX;
  const bottom = h - marginY;
  const pillHeight = Math.max(10, bottom - top);
  const radius = pillHeight / 2;

  const straightW = Math.max(0, right - left - 2 * radius);
  const cornerArc = (Math.PI / 2) * radius;
  const totalLength = straightW * 2 + 4 * cornerArc;
  const numSteps = Math.ceil(totalLength / step);
  const points: { x: number; y: number; nx: number; ny: number; s: number }[] = [];

  for (let i = 0; i < numSteps; i++) {
    const s = (i / numSteps) * totalLength;
    let a = s;

    const cornerPoint = (cx: number, cy: number, startAngle: number) => {
      const angle = startAngle + a / radius;
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        nx: Math.cos(angle),
        ny: Math.sin(angle),
        s,
      };
    };

    // Top straight
    if (a < straightW) {
      points.push({ x: left + radius + a, y: top, nx: 0, ny: -1, s });
      continue;
    }
    // Top-right corner
    a -= straightW;
    if (a < cornerArc) {
      points.push(cornerPoint(right - radius, top + radius, -Math.PI / 2));
      continue;
    }
    // Right straight
    a -= cornerArc;
    if (a < cornerArc) {
      points.push(cornerPoint(right - radius, bottom - radius, 0));
      continue;
    }
    // Bottom straight
    a -= cornerArc;
    if (a < straightW) {
      points.push({ x: right - radius - a, y: bottom, nx: 0, ny: 1, s });
      continue;
    }
    // Bottom-left corner
    a -= straightW;
    if (a < cornerArc) {
      points.push(cornerPoint(left + radius, bottom - radius, Math.PI / 2));
      continue;
    }
    // Top-left corner
    a -= cornerArc;
    points.push(cornerPoint(left + radius, top + radius, Math.PI));
  }

  return { points, totalLength };
}

export const FlameBorderCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const marginX = 40;
    const marginY = 40;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let contour = buildPillContour(100, 100, marginX, marginY, 4);

    const updateSize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      contour = buildPillContour(width, height, marginX, marginY, 4);
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(canvas);

    let animId: number;
    let startTime = performance.now();

    const render = () => {
      const time = (performance.now() - startTime) / 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineJoin = 'round';

      const totalLen = contour.totalLength;
      const stepAngle = (2 * Math.PI) / totalLen;
      const turnAngle = (time * 0.35) % (Math.PI * 2);
      const cx = width / 2;
      const cy = height / 2;

      const sampled = contour.points
        .filter((_, idx) => idx % 3 === 0)
        .map((pt) => {
          const angle = Math.atan2(pt.x - cx, cy - pt.y);
          const normalizedPos = ((angle / (2 * Math.PI)) % 1 + 1) % 1;
          const rotatedAngle = ((angle - turnAngle) / (2 * Math.PI) % 1 + 1) % 1;
          const power =
            interpolatePower(rotatedAngle) *
            (0.12 +
              0.88 *
                Math.pow(
                  0.5 + 0.5 * Math.sin(0.011 * pt.s + 0.6 * time) * Math.sin(0.027 * pt.s - 0.9 * time + 1.3),
                  1.6
                ) *
                (0.85 + 0.15 * Math.sin(0.09 * pt.s + 9 * time)));
          const thick =
            0.45 +
            0.75 *
              (0.5 + 0.5 * Math.sin(0.019 * pt.s - 0.8 * time) * Math.sin(0.047 * pt.s + 1.3 * time + 0.7));

          return { position: normalizedPos, power, thick };
        })
        .sort((a, b) => a.position - b.position);

      if (sampled.length === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      const paths = waveParams.map((wave) => {
        const path = new Path2D();
        contour.points.forEach((pt, i) => {
          const s = pt.s * stepAngle;
          const offset =
            wave.amp *
              (0.65 * Math.sin(s * wave.waves + time * wave.speed + wave.phase) +
                0.35 * Math.sin(s * wave.waves * 2 - time * wave.speed * 1.6 + 1.7 * wave.phase)) +
            wave.jitter * Math.sin(61 * s + 11 * time + 3 * wave.phase) * Math.sin(23 * s - 7 * time);

          const px = pt.x + pt.nx * offset;
          const py = pt.y + pt.ny * offset;
          if (i === 0) path.moveTo(px, py);
          else path.lineTo(px, py);
        });
        path.closePath();
        return path;
      });

      strokeLayers.forEach((layer) => {
        const grad = ctx.createConicGradient(-Math.PI / 2, cx, cy);
        const formatColor = (p: { power: number; thick: number }) => {
          const alpha = Math.min(1, Math.pow(p.power, layer.flare) * layer.alpha * (layer.thick ? p.thick : 1));
          return `rgba(${layer.rgb}, ${alpha.toFixed(3)})`;
        };

        const firstPt = sampled[0];
        const lastPt = sampled[sampled.length - 1];
        const avg = {
          power: (firstPt.power + lastPt.power) / 2,
          thick: (firstPt.thick + lastPt.thick) / 2,
        };
        const initialColor = formatColor(avg);

        grad.addColorStop(0, initialColor);
        for (const p of sampled) {
          grad.addColorStop(p.position, formatColor(p));
        }
        grad.addColorStop(1, initialColor);

        ctx.strokeStyle = grad;
        ctx.lineWidth = layer.width;
        paths.forEach((p) => ctx.stroke(p));
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute z-30 [mix-blend-mode:plus-lighter]"
      style={{
        left: -40,
        top: -40,
        width: 'calc(100% + 80px)',
        height: 'calc(100% + 80px)',
      }}
    />
  );
};
