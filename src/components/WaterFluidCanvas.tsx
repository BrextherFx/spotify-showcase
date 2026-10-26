import React, { useEffect, useRef } from 'react';
import { sound } from '../audio/soundEngine';

interface WaterFluidCanvasProps {
  interactive?: boolean;
}

export const WaterFluidCanvas: React.FC<WaterFluidCanvasProps> = ({ interactive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const cols = 80;
    const currentWaves = new Float32Array(cols);
    const previousWaves = new Float32Array(cols);
    const waveVelocities = new Float32Array(cols);

    const tension = 0.025;
    const damping = 0.035;
    const spread = 0.22;

    const splash = (index: number, speed: number) => {
      if (index >= 0 && index < cols) {
        waveVelocities[index] += speed;
      }
    };

    let prevPointerX = -1;
    let prevPointerY = -1;
    let lastMoveTime = performance.now();

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x < 0 || x > width || y < 0 || y > height) return;

      const colIndex = Math.floor((x / width) * cols);
      const now = performance.now();
      const dt = Math.max(1, now - lastMoveTime);
      lastMoveTime = now;

      if (prevPointerX !== -1) {
        const dx = x - prevPointerX;
        const dy = y - prevPointerY;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;

        if (speed > 0.4) {
          splash(colIndex, Math.min(dy * 0.8, 45));
          if (colIndex > 0) splash(colIndex - 1, dy * 0.4);
          if (colIndex < cols - 1) splash(colIndex + 1, dy * 0.4);

          // Acoustic feedback
          const pan = (x / width) * 2 - 1;
          sound.stir(Math.min(1, speed * 0.2), Math.min(1, Math.abs(dy) * 0.05), pan);
          if (Math.random() < 0.12 && speed > 1.2) {
            sound.drip(Math.random() * 2 + 0.5, pan);
          }
        }
      }

      prevPointerX = x;
      prevPointerY = y;
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      sound.init();
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const x = clientX - rect.left;
      const pan = (x / width) * 2 - 1;
      const colIndex = Math.floor((x / width) * cols);

      splash(colIndex, 55);
      sound.splash(0.7, pan);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);

    let animationFrameId: number;

    const updateWaves = () => {
      for (let i = 0; i < cols; i++) {
        const force = -tension * currentWaves[i] - damping * waveVelocities[i];
        waveVelocities[i] += force;
        currentWaves[i] += waveVelocities[i];
      }

      const leftDeltas = new Float32Array(cols);
      const rightDeltas = new Float32Array(cols);

      for (let j = 0; j < 6; j++) {
        for (let i = 0; i < cols; i++) {
          if (i > 0) {
            leftDeltas[i] = spread * (currentWaves[i] - currentWaves[i - 1]);
            waveVelocities[i - 1] += leftDeltas[i];
          }
          if (i < cols - 1) {
            rightDeltas[i] = spread * (currentWaves[i] - currentWaves[i + 1]);
            waveVelocities[i + 1] += rightDeltas[i];
          }
        }
        for (let i = 0; i < cols; i++) {
          if (i > 0) currentWaves[i - 1] += leftDeltas[i];
          if (i < cols - 1) currentWaves[i + 1] += rightDeltas[i];
        }
      }
    };

    const render = () => {
      if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
      }

      updateWaves();

      ctx.clearRect(0, 0, width, height);

      // Draw reflective liquid surface
      const baselineY = height * 0.88;
      const sliceWidth = width / (cols - 1);

      ctx.save();

      // Wave path
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, baselineY + currentWaves[0]);

      for (let i = 1; i < cols; i++) {
        const prevX = (i - 1) * sliceWidth;
        const prevY = baselineY + currentWaves[i - 1];
        const currX = i * sliceWidth;
        const currY = baselineY + currentWaves[i];
        const midX = (prevX + currX) / 2;
        const midY = (prevY + currY) / 2;
        ctx.quadraticCurveTo(prevX, prevY, midX, midY);
      }
      ctx.lineTo(width, baselineY + currentWaves[cols - 1]);
      ctx.lineTo(width, height);
      ctx.closePath();

      // Gradient fill
      const grad = ctx.createLinearGradient(0, baselineY - 40, 0, height);
      grad.addColorStop(0, 'rgba(30, 35, 48, 0.45)');
      grad.addColorStop(0.2, 'rgba(18, 22, 32, 0.7)');
      grad.addColorStop(1, 'rgba(8, 10, 14, 0.95)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Crest sheen line
      ctx.beginPath();
      ctx.moveTo(0, baselineY + currentWaves[0]);
      for (let i = 1; i < cols; i++) {
        const prevX = (i - 1) * sliceWidth;
        const prevY = baselineY + currentWaves[i - 1];
        const currX = i * sliceWidth;
        const currY = baselineY + currentWaves[i];
        const midX = (prevX + currX) / 2;
        const midY = (prevY + currY) / 2;
        ctx.quadraticCurveTo(prevX, prevY, midX, midY);
      }
      ctx.lineTo(width, baselineY + currentWaves[cols - 1]);
      ctx.strokeStyle = 'rgba(255, 230, 200, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
    };
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-10"
      style={{ touchAction: 'none' }}
    />
  );
};
