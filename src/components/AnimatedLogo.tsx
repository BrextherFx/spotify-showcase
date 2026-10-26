import React, { useEffect, useRef, useId } from 'react';

interface AnimatedLogoProps {
  className?: string;
  mono?: boolean;
  size?: number;
  dark?: boolean;
}

// User's exact SVG path definitions for the custom "K" logo
const PATH_BAR =
  'M0 4.31587C0 1.93228 1.93217 0 4.31562 0H86.3123C86.3123 0 60.5445 32.9778 45.314 55.0273C30.8889 75.9109 12.1459 106.927 4.03404 120.52C2.90725 122.408 0 121.588 0 119.389V4.31587Z';

const PATH_BLADE =
  'M228.734 0.953571C233.2 0.953571 234.595 7.06103 230.726 9.29154C-11.4027 148.876 23.4251 303.998 21.9667 304.666C20.4792 305.347 -23.4252 216.314 30.3316 121.152C71.3371 48.563 119.758 0.953571 119.758 0.953571C119.758 0.953571 190.027 0.953571 228.734 0.953571Z';

const PATH_ARCH =
  'M114.889 195.52C58.1093 191.793 21.9176 305.596 18.7499 304.297C15.5822 302.998 37.1803 158.152 139.362 130.213C142.264 129.42 223.849 101.236 275.438 204.575C284.818 223.365 286.681 235.203 292.08 255.288C296.044 270.035 300.143 291.323 301.927 300.943C302.416 303.582 300.387 306 297.703 306H198.633C196.607 306 194.862 304.65 194.369 302.685C189.839 284.632 165.682 198.853 114.889 195.52Z';

const PATH_ANCHOR =
  'M21.2793 287.893C22.3358 288.344 20.7502 301.42 19.4452 301.42C18.1403 301.42 15.901 294.355 15.901 293.209C18.6381 279.326 18.6379 290.148 19.1663 290.598C19.3314 290.739 20.2228 292.402 21.2793 287.893Z';

interface SpringState {
  val: number;
  target: number;
  vel: number;
}

const createSpring = (target = 0): SpringState => ({
  val: target,
  target,
  vel: 0,
});

const stepSpring = (s: SpringState, stiffness: number, damping: number) => {
  s.vel += (s.target - s.val) * stiffness - s.vel * damping;
  s.val += s.vel;
};

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  className = '',
  mono = false,
  size = 22,
  dark = false,
}) => {
  const uniqueId = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<SVGPathElement>(null);
  const bladeRef = useRef<SVGPathElement>(null);
  const archRef = useRef<SVGPathElement>(null);
  const anchorRef = useRef<SVGPathElement>(null);
  const gleamRef = useRef<SVGStopElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const bar = barRef.current;
    const blade = bladeRef.current;
    const arch = archRef.current;
    const anchor = anchorRef.current;
    const gleamStop = gleamRef.current;

    if (!svg || !bar || !blade || !arch || !anchor) return;

    const parentInteractive = svg.closest('a, button') ?? svg.parentElement;
    if (!parentInteractive) return;

    let animFrame = 0;
    let isHover = false;
    let isVisible = true;
    let gleamPos = 25;

    // Harmonic spring controllers (calibrated to authentic Living UI engine parameters)
    const sFlex = createSpring(0);
    const sScale = createSpring(1);
    const sGlow = createSpring(0);

    let nextIdle = performance.now() + 3500 + 2000 * Math.random();
    let idleEnd = 0;

    const loop = (time: number) => {
      if (!isVisible) return;
      animFrame = requestAnimationFrame(loop);

      // Living UI autonomous breathing / micro-pulse
      if (!isHover && time > nextIdle) {
        sFlex.target = 0.45;
        idleEnd = time + 900;
        nextIdle = time + 5000 + 3500 * Math.random();
      }
      if (!isHover && idleEnd && time > idleEnd) {
        sFlex.target = 0;
        idleEnd = 0;
      }

      // Step discrete spring physics
      stepSpring(sFlex, 0.055, 0.2);
      stepSpring(sScale, 0.08, 0.24);
      stepSpring(sGlow, 0.06, 0.22);

      const flex = sFlex.val;
      const scale = sScale.val;
      const glow = sGlow.val;

      // Micro-displacement along diagonal aperture slit (100% crisp geometry, zero blur distortion)
      bar.setAttribute(
        'transform',
        `translate(${(flex * 4.5).toFixed(2)}, ${(flex * 5.0).toFixed(2)})`
      );
      blade.setAttribute(
        'transform',
        `translate(${(-flex * 3.5).toFixed(2)}, ${(-flex * 4.0).toFixed(2)})`
      );
      arch.setAttribute('transform', `translate(0, ${(flex * 1.5).toFixed(2)})`);
      anchor.setAttribute(
        'transform',
        `translate(${(-flex * 1.5).toFixed(2)}, ${(-flex * 1.5).toFixed(2)})`
      );

      // Subtle float and elastic spring scale
      const idleFloat = Math.sin(time * 0.0022) * 0.5;
      const totalY = -glow * 1.5 + idleFloat;
      svg.style.transform = `translateY(${totalY.toFixed(2)}px) scale(${scale.toFixed(3)})`;

      // Drop-shadow filter (if not in mono mode)
      if (!mono) {
        if (dark) {
          const s = (2 + glow * 3).toFixed(1);
          const a = (0.3 + glow * 0.25).toFixed(2);
          svg.style.filter = `drop-shadow(0 ${s}px ${s}px rgba(0, 0, 0, ${a}))`;
        } else {
          const b1 = (6 + glow * 6).toFixed(1);
          const a1 = (0.65 + glow * 0.3).toFixed(2);
          const b2 = (glow * 18).toFixed(1);
          const a2 = (glow * 0.45).toFixed(2);
          svg.style.filter = `drop-shadow(0 0 ${b1}px rgba(255, 125, 56, ${a1})) drop-shadow(0 0 ${b2}px rgba(255, 180, 112, ${a2}))`;
        }
      }

      // Specular gleam glide across contours
      if (gleamStop) {
        gleamPos = (gleamPos + (isHover ? 0.9 : 0.22)) % 100;
        gleamStop.setAttribute('offset', `${gleamPos.toFixed(1)}%`);
      }
    };

    const onPointerEnter = () => {
      isHover = true;
      sFlex.target = 1.0;
      sScale.target = 1.09;
      sGlow.target = 1.0;
    };

    const onPointerLeave = () => {
      isHover = false;
      sFlex.target = 0;
      sScale.target = 1.0;
      sGlow.target = 0;
      idleEnd = 0;
      nextIdle = performance.now() + 4000;
    };

    const onPointerDown = () => {
      sScale.target = 0.94;
    };

    const onPointerUp = () => {
      sScale.target = isHover ? 1.09 : 1.0;
    };

    parentInteractive.addEventListener('pointerenter', onPointerEnter);
    parentInteractive.addEventListener('pointerleave', onPointerLeave);
    parentInteractive.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = !!entry?.isIntersecting;
      if (isVisible) {
        cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(animFrame);
      }
    });
    observer.observe(svg);

    animFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrame);
      observer.disconnect();
      parentInteractive.removeEventListener('pointerenter', onPointerEnter);
      parentInteractive.removeEventListener('pointerleave', onPointerLeave);
      parentInteractive.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [mono, dark]);

  const gradId = `_key_logo_grad_${uniqueId}`;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 302 306"
      fill="none"
      aria-hidden="true"
      className={`overflow-visible select-none pointer-events-none ${className}`}
      style={{
        filter: mono
          ? 'none'
          : dark
          ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))'
          : 'drop-shadow(0 0 6px rgba(255, 125, 56, 0.65))',
        transformOrigin: 'center center',
      }}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
          gradientUnits="userSpaceOnUse"
        >
          {dark ? (
            <>
              {/* Rich dark sculpted titanium / obsidian mark */}
              <stop offset="0%" stopColor="#32323a" />
              <stop ref={gleamRef} offset="25%" stopColor="#585868" />
              <stop offset="65%" stopColor="#1a1a20" />
              <stop offset="100%" stopColor="#0e0e12" />
            </>
          ) : (
            <>
              {/* Core warm white */}
              <stop offset="0%" stopColor="#fff4e4" />
              {/* Dynamic specular gleam reflection */}
              <stop ref={gleamRef} offset="25%" stopColor="#ffffff" />
              {/* Radiant flame amber */}
              <stop offset="55%" stopColor="#ffb470" />
              {/* Deep ember orange */}
              <stop offset="100%" stopColor="#ff7d38" />
            </>
          )}
        </linearGradient>
      </defs>
      <g fill={mono ? 'currentColor' : `url(#${gradId})`}>
        {/* Part 1: Top-Left Angled Bar */}
        <path ref={barRef} d={PATH_BAR} />
        {/* Part 2: Dynamic Sweeping Blade */}
        <path ref={bladeRef} d={PATH_BLADE} />
        {/* Part 3: Lower Arch & Right Leg */}
        <path ref={archRef} d={PATH_ARCH} />
        {/* Part 4: Bottom Tip Anchor */}
        <path ref={anchorRef} d={PATH_ANCHOR} />
      </g>
    </svg>
  );
};
