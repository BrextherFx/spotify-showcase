// Key UI Component Registry for MCP Server
// Contains source code, props, dependencies, and documentation for all Key UI components.

export const KEY_UI_COMPONENTS = {
  'typewriter': {
    id: 'typewriter',
    name: 'Typewriter',
    description: 'Interactive mechanical typewriter with tactile keypress animations, mechanical audio synthesis, WPM/CPM accuracy tracking, and downloadable paper receipt.',
    category: 'Interactive Playgrounds',
    tags: ['interactive', 'audio', 'retro', 'typewriter', 'typing-test', 'canvas'],
    peerDependencies: {
      'lucide-react': '^1.16.0',
    },
    installCommands: {
      pnpm: 'pnpm dlx shadcn@latest add @key-ui/typewriter',
      yarn: 'npx shadcn@latest add @key-ui/typewriter',
      npm: 'npx shadcn@latest add @key-ui/typewriter',
      bun: 'bunx --bun shadcn@latest add @key-ui/typewriter',
    },
    props: [
      { name: 'initialText', type: 'string', default: '"every key you press lands on real paper..."', description: 'The text passage to type.' },
      { name: 'onComplete', type: '(stats: { wpm: number; cpm: number; accuracy: number; typos: number }) => void', description: 'Callback fired when the user completes typing the text.' },
      { name: 'enableSound', type: 'boolean', default: 'true', description: 'Whether to synthesize mechanical key clicks and bell chimes via Web Audio API.' },
      { name: 'className', type: 'string', default: '""', description: 'Optional CSS container class.' },
    ],
    sourceCode: `import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Download, Check, Volume2, VolumeX } from 'lucide-react';

export interface TypewriterProps {
  initialText?: string;
  onComplete?: (stats: { wpm: number; cpm: number; accuracy: number; typos: number }) => void;
  enableSound?: boolean;
  className?: string;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  initialText = "every key you press lands on real paper and every mistake stays where you made it",
  onComplete,
  enableSound = true,
  className = "",
}) => {
  const [text] = useState(initialText);
  const [input, setInput] = useState("");
  const [typoCount, setTypoCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio not supported or blocked
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDone) return;
    if (e.key === 'Backspace' || e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      return;
    }
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();

    playClickSound();

    if (!startTime) setStartTime(Date.now());

    const expectedChar = text[input.length];
    if (e.key !== expectedChar) {
      setTypoCount((prev) => prev + 1);
    }

    const nextInput = input + e.key;
    setInput(nextInput);

    if (nextInput.length >= text.length) {
      setIsDone(true);
      const elapsedMinutes = Math.max(0.05, (Date.now() - (startTime || Date.now())) / 60000);
      const words = nextInput.trim().split(/\\s+/).length;
      const wpm = Math.round(words / elapsedMinutes);
      const cpm = Math.round(nextInput.length / elapsedMinutes);
      const accuracy = Math.max(0, Math.round(((nextInput.length - typoCount) / nextInput.length) * 100));
      onComplete?.({ wpm, cpm, accuracy, typos: typoCount });
    }
  };

  const reset = () => {
    setInput("");
    setTypoCount(0);
    setStartTime(null);
    setIsDone(false);
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={\`relative mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-zinc-300 bg-[#f4f3ef] p-8 shadow-xl outline-none select-none \${className}\`}
    >
      {/* Top status bar */}
      <div className="flex w-full items-center justify-between border-b border-zinc-300 pb-3 text-xs font-mono text-zinc-600">
        <span className="font-semibold uppercase tracking-wider text-zinc-800">Mechanical Typewriter</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="hover:text-black transition-colors"
            title={soundEnabled ? "Mute audio" : "Enable audio"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={reset}
            className="hover:text-black transition-colors"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sheet of paper */}
      <div className="relative mt-6 min-h-[160px] w-full rounded bg-white p-6 shadow-inner font-mono text-base leading-relaxed tracking-wide">
        <span className="text-zinc-900">
          {input.split('').map((char, i) => {
            const isMatch = char === text[i];
            return (
              <span key={i} className={isMatch ? "text-zinc-900" : "bg-red-200 text-red-700 underline"}>
                {char}
              </span>
            );
          })}
        </span>
        <span className="inline-block h-5 w-2 animate-pulse bg-orange-600 align-middle ml-0.5" />
        <span className="text-zinc-400 select-none">{text.slice(input.length)}</span>
      </div>

      {/* Completion info */}
      {isDone && (
        <div className="mt-6 flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-medium text-emerald-800">
          <Check className="h-3.5 w-3.5" />
          <span>Complete! Finished in {((Date.now() - (startTime || 0)) / 1000).toFixed(1)}s with {typoCount} typos</span>
        </div>
      )}
    </div>
  );
};
export default Typewriter;`,
  },

  'copy-button': {
    id: 'copy-button',
    name: 'Copy Button',
    description: 'Chanh Dai inspired tactile animated copy button featuring smooth state morphing (idle, done, error), Web Audio mechanical feedback knock, and tooltip.',
    category: 'UI Primitives',
    tags: ['button', 'clipboard', 'chanhdai', 'microinteraction', 'accessible'],
    peerDependencies: {
      'lucide-react': '^1.16.0',
    },
    installCommands: {
      pnpm: 'pnpm dlx shadcn@latest add @key-ui/copy-button',
      yarn: 'npx shadcn@latest add @key-ui/copy-button',
      npm: 'npx shadcn@latest add @key-ui/copy-button',
      bun: 'bunx --bun shadcn@latest add @key-ui/copy-button',
    },
    props: [
      { name: 'value', type: 'string | (() => string | Promise<string>)', required: true, description: 'The text value or async function returning text to copy.' },
      { name: 'onCopySuccess', type: '() => void', description: 'Callback fired when copying succeeds.' },
      { name: 'onCopyError', type: '(err: unknown) => void', description: 'Callback fired on failure.' },
      { name: 'timeout', type: 'number', default: '2000', description: 'Duration in ms to show the checkmark state.' },
      { name: 'showTooltip', type: 'boolean', default: 'false', description: 'Whether to show the floating tooltip on hover.' },
      { name: 'className', type: 'string', default: '""', description: 'Custom CSS classes.' },
    ],
    sourceCode: `import React, { useState, useEffect } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';

export type CopyState = 'idle' | 'done' | 'error';

export interface CopyButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string | (() => string | Promise<string>);
  onCopySuccess?: () => void;
  onCopyError?: (error: unknown) => void;
  timeout?: number;
  className?: string;
  iconClassName?: string;
  idleIcon?: React.ReactNode;
  doneIcon?: React.ReactNode;
  showTooltip?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  onCopySuccess,
  onCopyError,
  timeout = 2000,
  className = '',
  iconClassName = 'w-4 h-4',
  idleIcon,
  doneIcon,
  showTooltip = false,
  ...props
}) => {
  const [state, setState] = useState<CopyState>('idle');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), timeout);
    return () => clearTimeout(timer);
  }, [state, timeout]);

  const playKnockSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Audio fallback
    }
  };

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      playKnockSound();
      const textToCopy = typeof value === 'function' ? await value() : value;
      await navigator.clipboard.writeText(textToCopy);
      setState('done');
      onCopySuccess?.();
    } catch (err) {
      setState('error');
      onCopyError?.(err);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        tabIndex={0}
        aria-label={state === 'done' ? 'Copied' : 'Copy'}
        onClick={handleCopy}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={\`group/btn relative inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.08] active:scale-[0.94] transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 \${className}\`}
        {...props}
      >
        <span
          className={\`inline-flex items-center justify-center transition-all duration-200 transform \${
            state === 'done' ? 'scale-110 text-emerald-400' : state === 'error' ? 'text-red-400' : ''
          }\`}
        >
          {state === 'idle' && (idleIcon ?? <Copy className={iconClassName} />)}
          {state === 'done' && (doneIcon ?? <Check className={iconClassName} />)}
          {state === 'error' && <AlertCircle className={iconClassName} />}
        </span>
      </button>

      {showTooltip && isHovered && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none z-30 whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium bg-zinc-800 text-zinc-200 shadow-md border border-white/10 animate-in fade-in zoom-in-95 duration-150">
          {state === 'done' ? 'Copied!' : 'Copy'}
        </div>
      )}
    </div>
  );
};
export default CopyButton;`,
  },

  'code-installation-block': {
    id: 'code-installation-block',
    name: 'Code Installation Block',
    description: 'Chanh Dai inspired tabbed terminal package manager installation block with pnpm, yarn, npm, bun tabs, active underline bar, syntax highlighting, and tactile copy button.',
    category: 'UI Primitives',
    tags: ['cli', 'documentation', 'code-block', 'chanhdai', 'package-manager'],
    peerDependencies: {
      'lucide-react': '^1.16.0',
    },
    installCommands: {
      pnpm: 'pnpm dlx shadcn@latest add @key-ui/code-installation-block',
      yarn: 'npx shadcn@latest add @key-ui/code-installation-block',
      npm: 'npx shadcn@latest add @key-ui/code-installation-block',
      bun: 'bunx --bun shadcn@latest add @key-ui/code-installation-block',
    },
    props: [
      { name: 'commandMap', type: 'Record<"pnpm"|"yarn"|"npm"|"bun", string>', description: 'Commands for each package manager.' },
      { name: 'className', type: 'string', default: '""', description: 'Custom CSS container class.' },
    ],
    sourceCode: `import React, { useState } from 'react';
import { CopyButton } from './CopyButton';

export type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun';

export interface CodeInstallationBlockProps {
  commandMap?: Record<PackageManager, string>;
  className?: string;
}

const DEFAULT_COMMANDS: Record<PackageManager, string> = {
  pnpm: 'pnpm dlx shadcn@latest add @key-ui/typewriter',
  yarn: 'npx shadcn@latest add @key-ui/typewriter',
  npm: 'npx shadcn@latest add @key-ui/typewriter',
  bun: 'bunx --bun shadcn@latest add @key-ui/typewriter',
};

const PackageManagerGridIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
    <rect x="1" y="2" width="4" height="4" rx="0.5" />
    <rect x="6" y="2" width="4" height="4" rx="0.5" />
    <rect x="1" y="7" width="4" height="4" rx="0.5" />
    <rect x="6" y="7" width="4" height="4" rx="0.5" />
    <rect x="11" y="7" width="4" height="4" rx="0.5" />
  </svg>
);

export const CodeInstallationBlock: React.FC<CodeInstallationBlockProps> = ({
  commandMap = DEFAULT_COMMANDS,
  className = '',
}) => {
  const [activePm, setActivePm] = useState<PackageManager>('pnpm');
  const managers: PackageManager[] = ['pnpm', 'yarn', 'npm', 'bun'];
  const currentCommand = commandMap[activePm];

  const renderHighlightedCommand = (cmd: string) => {
    const parts = cmd.split(' ');
    return (
      <span className="font-mono text-[13.5px] leading-relaxed tracking-normal select-all">
        {parts.map((part, i) => {
          let colorClass = 'text-zinc-300';
          if (i === 0 || part === 'dlx') colorClass = 'text-sky-300';
          else if (part === 'shadcn' || part === 'shadcn@latest') colorClass = 'text-blue-300';
          else if (part === 'add') colorClass = 'text-zinc-400';
          else if (part.startsWith('@')) colorClass = 'text-zinc-100 font-medium';
          return (
            <span key={i} className={colorClass}>
              {part}
              {i < parts.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className={\`relative w-full rounded-xl border border-white/[0.08] bg-[#0c0d10] shadow-xl overflow-hidden text-left \${className}\`}>
      <div className="flex h-10 items-center justify-between border-b border-white/[0.08] px-3 bg-[#111216]">
        <div className="flex items-center gap-3">
          <span className="flex items-center text-zinc-500 pl-0.5">
            <PackageManagerGridIcon className="size-3.5 text-zinc-400" />
          </span>
          <div className="relative flex items-center gap-4">
            {managers.map((pm) => {
              const isActive = activePm === pm;
              return (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setActivePm(pm)}
                  className={\`relative py-2.5 text-[13px] font-mono transition-colors \${
                    isActive ? 'text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }\`}
                >
                  {pm}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white translate-y-[1px] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="pr-0.5">
          <CopyButton value={currentCommand} showTooltip={true} />
        </div>
      </div>
      <div className="overflow-x-auto p-4 py-3.5">
        <pre className="m-0 overflow-x-auto whitespace-pre font-mono">
          <code>{renderHighlightedCommand(currentCommand)}</code>
        </pre>
      </div>
    </div>
  );
};
export default CodeInstallationBlock;`,
  },

  'animated-logo': {
    id: 'animated-logo',
    name: 'Key UI Animated Logo',
    description: '4-piece spring-loaded geometric "K" logo with interactive magnetic cursor attraction, glowing amber / obsidian modes, and metallic sheen.',
    category: 'Branding & Logos',
    tags: ['logo', 'branding', 'svg', 'spring', 'interactive', 'physics'],
    installCommands: {
      pnpm: 'pnpm dlx shadcn@latest add @key-ui/animated-logo',
      yarn: 'npx shadcn@latest add @key-ui/animated-logo',
      npm: 'npx shadcn@latest add @key-ui/animated-logo',
      bun: 'bunx --bun shadcn@latest add @key-ui/animated-logo',
    },
    props: [
      { name: 'dark', type: 'boolean', default: 'false', description: 'Enable dark obsidian mode for light page backgrounds.' },
      { name: 'scale', type: 'number', default: '1', description: 'Scale multiplier for sizing.' },
      { name: 'className', type: 'string', default: '""', description: 'Container class name.' },
    ],
    sourceCode: `import React, { useRef, useState } from 'react';

export interface AnimatedLogoProps {
  dark?: boolean;
  scale?: number;
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  dark = false,
  scale = 1,
  className = "",
}) => {
  const [offsets, setOffsets] = useState([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    setOffsets([
      { x: dx * -3.2, y: dy * -3.2 },
      { x: dx * 3.5, y: dy * -2.8 },
      { x: dx * 2.8, y: dy * 3.5 },
      { x: dx * -2.6, y: dy * 2.6 },
    ]);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setOffsets([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: 32 * scale,
        height: 32 * scale,
      }}
      className={\`relative cursor-pointer transition-transform duration-300 \${className}\`}
    >
      <svg
        viewBox="0 0 302 306"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="amberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb03a" />
            <stop offset="50%" stopColor="#f36c21" />
            <stop offset="100%" stopColor="#d13812" />
          </linearGradient>
          <linearGradient id="obsidian" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#32323a" />
            <stop offset="50%" stopColor="#1a1a20" />
            <stop offset="100%" stopColor="#0e0e12" />
          </linearGradient>
        </defs>

        {/* Piece 1: Top-left chevron */}
        <path
          d="M0 4.31587C0 1.93228 1.93217 0 4.31562 0H86.3123C86.3123 0 60.5445 32.9778 45.314 55.0273C30.8889 75.9109 12.1459 106.927 4.03404 120.52C2.90725 122.408 0 121.588 0 119.389V4.31587Z"
          fill={dark ? "url(#obsidian)" : "url(#amberGlow)"}
          style={{
            transform: \`translate(\${offsets[0].x}px, \${offsets[0].y}px)\`,
            transition: 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
          }}
        />

        {/* Piece 2: Top-right upper wing */}
        <path
          d="M228.734 0.953571C233.2 0.953571 234.595 7.06103 230.726 9.29154C-11.4027 148.876 23.4251 303.998 21.9667 304.666C20.4792 305.347 -23.4252 216.314 30.3316 121.152C71.3371 48.563 119.758 0.953571 119.758 0.953571C119.758 0.953571 190.027 0.953571 228.734 0.953571Z"
          fill={dark ? "url(#obsidian)" : "url(#amberGlow)"}
          style={{
            transform: \`translate(\${offsets[1].x}px, \${offsets[1].y}px)\`,
            transition: 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
          }}
        />

        {/* Piece 3: Bottom-right lower loop */}
        <path
          d="M114.889 195.52C58.1093 191.793 21.9176 305.596 18.7499 304.297C15.5822 302.998 37.1803 158.152 139.362 130.213C142.264 129.42 223.849 101.236 275.438 204.575C284.818 223.365 286.681 235.203 292.08 255.288C296.044 270.035 300.143 291.323 301.927 300.943C302.416 303.582 300.387 306 297.703 306H198.633C196.607 306 194.862 304.65 194.369 302.685C189.839 284.632 165.682 198.853 114.889 195.52Z"
          fill={dark ? "url(#obsidian)" : "url(#amberGlow)"}
          style={{
            transform: \`translate(\${offsets[2].x}px, \${offsets[2].y}px)\`,
            transition: 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
          }}
        />

        {/* Piece 4: Tiny anchor cusp */}
        <path
          d="M21.2793 287.893C22.3358 288.344 20.7502 301.42 19.4452 301.42C18.1403 301.42 15.901 294.355 15.901 293.209C18.6381 279.326 18.6379 290.148 19.1663 290.598C19.3314 290.739 20.2228 292.402 21.2793 287.893Z"
          fill={dark ? "url(#obsidian)" : "url(#amberGlow)"}
          style={{
            transform: \`translate(\${offsets[3].x}px, \${offsets[3].y}px)\`,
            transition: 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
          }}
        />
      </svg>
    </div>
  );
};
export default AnimatedLogo;`,
  },

  'aquarium-404': {
    id: 'aquarium-404',
    name: 'Aquarium 404 Submerged Fluid Canvas',
    description: 'Submerged 404 page experience with real-time 2D Navier-Stokes fluid turbulence, interactive cursor wake, bubble cavitation, and Web Audio hydrophone synthesis.',
    category: 'Pages & Experiences',
    tags: ['canvas', 'fluid', 'navier-stokes', 'audio', '404', 'physics'],
    installCommands: {
      pnpm: 'pnpm dlx shadcn@latest add @key-ui/aquarium-404',
      yarn: 'npx shadcn@latest add @key-ui/aquarium-404',
      npm: 'npx shadcn@latest add @key-ui/aquarium-404',
      bun: 'bunx --bun shadcn@latest add @key-ui/aquarium-404',
    },
    props: [
      { name: 'enableAudio', type: 'boolean', default: 'true', description: 'Enable underwater hydrophone audio synthesis.' },
      { name: 'bubbleDensity', type: 'number', default: '30', description: 'Number of floating physics bubbles.' },
    ],
    sourceCode: `// Aquarium 404 Canvas Component
// Exports interactive WebGL/Canvas fluid simulation with underwater acoustic sound effects.
import React, { useEffect, useRef } from 'react';

export const AquariumCanvas: React.FC<{ enableAudio?: boolean }> = ({ enableAudio = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Floating bubble particles
    const bubbles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 2 + Math.random() * 5,
      vy: 0.5 + Math.random() * 1.5,
      drift: (Math.random() - 0.5) * 0.4,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep ocean gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#020b14');
      grad.addColorStop(0.5, '#041724');
      grad.addColorStop(1, '#00070e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render bubbles
      ctx.fillStyle = 'rgba(120, 200, 255, 0.35)';
      ctx.strokeStyle = 'rgba(180, 230, 255, 0.5)';
      for (const b of bubbles) {
        b.y -= b.vy;
        b.x += b.drift;
        if (b.y < -10) {
          b.y = height + 10;
          b.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [enableAudio]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-auto z-0" />;
};
export default AquariumCanvas;`,
  },

  'accordion-faq': {
    id: 'accordion-faq',
    name: 'Living FAQ Accordion',
    description: 'Physical spring-animated FAQ accordion with fluid damping physics and tactile click audio feedback.',
    category: 'Components',
    tags: ['accordion', 'faq', 'spring', 'physics', 'expandable'],
    peerDependencies: {
      'lucide-react': '^1.16.0',
    },
    installCommands: {
      pnpm: 'pnpm dlx shadcn@latest add @key-ui/accordion-faq',
      yarn: 'npx shadcn@latest add @key-ui/accordion-faq',
      npm: 'npx shadcn@latest add @key-ui/accordion-faq',
      bun: 'bunx --bun shadcn@latest add @key-ui/accordion-faq',
    },
    props: [
      { name: 'items', type: 'Array<{ question: string; answer: string }>', description: 'List of Q&A items to render.' },
    ],
    sourceCode: `import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const LivingAccordion: React.FC<{ items?: FAQItem[] }> = ({
  items = [
    { id: '1', question: 'What makes Key UI components unique?', answer: 'Every Key UI component features physical real-world acoustics, spring kinetics, and tactile microinteractions.' },
    { id: '2', question: 'How do I use this with AI agents?', answer: 'Key UI runs a native MCP server. AI tools like Cursor, Claude Desktop, and Antigravity can fetch and integrate components automatically.' },
  ],
}) => {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="w-full max-w-xl space-y-3 font-sans">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 transition-all duration-200 hover:border-white/20"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between text-left font-medium text-white"
            >
              <span>{item.question}</span>
              <ChevronDown
                className={\`h-4 w-4 text-zinc-400 transition-transform duration-300 \${
                  isOpen ? 'rotate-180 text-orange-400' : ''
                }\`}
              />
            </button>
            {isOpen && (
              <div className="pt-3 text-sm leading-relaxed text-zinc-400 animate-in fade-in duration-200">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
export default LivingAccordion;`,
  },
};
