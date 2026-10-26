import React, { useEffect, useRef } from 'react';
import { sound } from '../audio/soundEngine';

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  age: number;
  life: number;
  peak: number;
  size: number;
  glow: number;
}

interface TwinkleStar {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  phase: number;
  speed: number;
}

const COLOR_CORE = '255, 244, 228'; // #fff4e4
const COLOR_HEAT = '236, 168, 106'; // #eca86a
const COLOR_EMBER = '255, 125, 56'; // #ff7d38

export const ShootingStarCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initTwinkleStars();
    };
    window.addEventListener('resize', onResize);

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    // Scattered Twinkle Stars across sky (as seen in screenshot)
    const twinkleStars: TwinkleStar[] = [];
    const initTwinkleStars = () => {
      twinkleStars.length = 0;
      const count = Math.floor((width * height) / 9000);
      for (let i = 0; i < count; i++) {
        twinkleStars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.55), // in upper sky
          size: rand(0.7, 1.8),
          baseAlpha: rand(0.15, 0.75),
          phase: Math.random() * Math.PI * 2,
          speed: rand(0.5, 1.8),
        });
      }
    };
    initTwinkleStars();

    const activeMeteors: ShootingStar[] = [];

    // Spawn a shooting star
    const spawnMeteor = (startX?: number, startY?: number) => {
      const x = startX !== undefined ? startX : (Math.random() < 0.5 ? rand(width * 0.1, width * 0.4) : rand(width * 0.6, width * 0.95));
      const y = startY !== undefined ? startY : rand(height * 0.05, height * 0.35);

      // Angle ~ 35 - 55 degrees downwards to the left
      const angle = Math.random() < 0.25 ? rand(0.85, 1.15) : rand(0.4, 0.75);
      const life = rand(1.1, 2.2);

      activeMeteors.push({
        x,
        y,
        dx: -Math.cos(angle),
        dy: Math.sin(angle),
        speed: rand(160, 290),
        age: 0,
        life,
        peak: rand(0.2, 0.45),
        size: rand(1.0, 1.8),
        glow: rand(0.7, 1.0),
      });

      // Subtle celestial acoustic chime
      if (sound.isLive() && Math.random() < 0.4) {
        sound.pop(3.5, (x / width) * 2 - 1);
      }
    };

    // Periodic meteor spawn timer
    let spawnTimer: number;
    const scheduleNextMeteor = () => {
      const delay = rand(2200, 5000);
      spawnTimer = window.setTimeout(() => {
        spawnMeteor();
        scheduleNextMeteor();
      }, delay);
    };

    // First meteor after 800ms
    setTimeout(() => spawnMeteor(), 800);
    scheduleNextMeteor();

    // Click anywhere in the sky to summon a shooting star
    const onPointerDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, input, form')) return;
      if (e.clientY < height * 0.6) {
        spawnMeteor(e.clientX + rand(60, 140), Math.max(10, e.clientY - rand(60, 120)));
      }
    };
    window.addEventListener('pointerdown', onPointerDown);

    let animId: number;
    let lastTime = performance.now();

    const render = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Draw Twinkle Stars
      twinkleStars.forEach((star) => {
        star.phase += star.speed * dt;
        const alpha = star.baseAlpha * (0.6 + 0.4 * Math.sin(star.phase));
        ctx.fillStyle = `rgba(${COLOR_CORE}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update & Draw Shooting Stars
      for (let i = activeMeteors.length - 1; i >= 0; i--) {
        const star = activeMeteors[i];
        star.age += dt;
        if (star.age >= star.life) {
          activeMeteors.splice(i, 1);
          continue;
        }

        const progress = Math.min(1, Math.max(0, star.age / star.life));
        const intensity =
          progress < star.peak
            ? Math.pow(progress / star.peak, 1.4)
            : Math.pow(Math.max(0, 1 - (progress - star.peak) / (1 - star.peak)), 1.8);

        const s = intensity * star.glow;
        const dist = star.speed * star.age;
        const headX = star.x + star.dx * dist;
        const headY = star.y + star.dy * dist;
        const tailLen = Math.min(dist, 55 + 130 * star.size * intensity);

        // Linear gradient tail
        const tailX = headX - star.dx * tailLen;
        const tailY = headY - star.dy * tailLen;

        const grad = ctx.createLinearGradient(headX, headY, tailX, tailY);
        grad.addColorStop(0, `rgba(${COLOR_CORE}, ${s.toFixed(3)})`);
        grad.addColorStop(0.35, `rgba(${COLOR_HEAT}, ${(0.5 * s).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${COLOR_EMBER}, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = star.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Glowing Star Head with Radial Flare
        const headRadius = 4 + 4 * star.size;
        const glowGrad = ctx.createRadialGradient(headX, headY, 0, headX, headY, headRadius);
        glowGrad.addColorStop(0, `rgba(${COLOR_CORE}, ${Math.min(1, s * 1.2).toFixed(3)})`);
        glowGrad.addColorStop(0.4, `rgba(${COLOR_HEAT}, ${(0.6 * s).toFixed(3)})`);
        glowGrad.addColorStop(1, `rgba(${COLOR_EMBER}, 0)`);

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.clearTimeout(spawnTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[5] w-full h-full block"
    />
  );
};
