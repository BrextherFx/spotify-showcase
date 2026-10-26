import React, { useState } from 'react';
import { X, Bot, Terminal, FileCode, Sparkles } from 'lucide-react';
import { CodeInstallationBlock } from '../ui/CodeInstallationBlock';
import { CodeViewer } from '../ui/CodeViewer';
import { CopyButton } from '../ui/CopyButton';
import { sound } from '../../audio/soundEngine';

interface TypewriterGetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMcpFull?: () => void;
}

const TYPEWRITER_COMPONENT_SOURCE = `// components/typewriter.tsx
import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Volume2, VolumeX, Check } from 'lucide-react';

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
      // Audio fallback
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
      <div className="flex w-full items-center justify-between border-b border-zinc-300 pb-3 text-xs font-mono text-zinc-600">
        <span className="font-semibold uppercase tracking-wider text-zinc-800">Typewriter</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setSoundEnabled((v) => !v)}>
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button type="button" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative mt-6 min-h-[160px] w-full rounded bg-white p-6 shadow-inner font-mono text-base leading-relaxed tracking-wide">
        <span className="text-zinc-900">
          {input.split('').map((char, i) => (
            <span key={i} className={char === text[i] ? "text-zinc-900" : "bg-red-200 text-red-700 underline"}>
              {char}
            </span>
          ))}
        </span>
        <span className="inline-block h-5 w-2 animate-pulse bg-orange-600 align-middle ml-0.5" />
        <span className="text-zinc-400 select-none">{text.slice(input.length)}</span>
      </div>
    </div>
  );
};
export default Typewriter;`;

const MCP_AGENT_PROMPT = 'Use Key UI MCP to install and integrate the Typewriter component into my project.';

const MCP_CONFIG_SNIPPET = `{
  "mcpServers": {
    "key-ui": {
      "command": "node",
      "args": ["C:/Users/thril/Desktop/Key-Ui/mcp-server/index.js"]
    }
  }
}`;

export const TypewriterGetCodeModal: React.FC<TypewriterGetCodeModalProps> = ({
  isOpen,
  onClose,
  onOpenMcpFull,
}) => {
  const [tab, setTab] = useState<'cli' | 'code' | 'mcp'>('cli');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-[#090a0d] border border-white/[0.1] text-white shadow-2xl z-10 my-auto flex flex-col font-sans">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/[0.08] px-5 bg-[#0d0e12]">
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-[15px] text-white tracking-tight">Typewriter</h3>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-300 border border-white/5">
              @key-ui/typewriter
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              v1.0
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-6 px-5 border-b border-white/[0.08] bg-[#0c0d10]">
          <button
            type="button"
            onClick={() => {
              sound.knock(0.2, 0);
              setTab('cli');
            }}
            className={`flex items-center gap-1.5 py-3 text-xs font-medium transition-colors relative ${
              tab === 'cli' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI</span>
            {tab === 'cli' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white translate-y-[1px] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              sound.knock(0.2, 0);
              setTab('code');
            }}
            className={`flex items-center gap-1.5 py-3 text-xs font-medium transition-colors relative ${
              tab === 'code' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Manual Code</span>
            {tab === 'code' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white translate-y-[1px] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              sound.knock(0.2, 0);
              setTab('mcp');
            }}
            className={`flex items-center gap-1.5 py-3 text-xs font-medium transition-colors relative ${
              tab === 'mcp' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-orange-400" />
            <span>MCP (AI Agent)</span>
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            {tab === 'mcp' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white translate-y-[1px] rounded-full" />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {tab === 'cli' && (
            <div className="space-y-3">
              {/* Exact Chanh Dai style installation block */}
              <CodeInstallationBlock />

              <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                <span>Peer dependencies:</span>
                <span className="font-mono text-zinc-400">lucide-react, framer-motion</span>
              </div>
            </div>
          )}

          {tab === 'code' && (
            <div className="space-y-3">
              {/* Upgraded Syntax Highlighted Code Viewer with Line Numbers */}
              <CodeViewer
                code={TYPEWRITER_COMPONENT_SOURCE}
                filename="components/typewriter.tsx"
                language="TSX"
                maxHeight="320px"
              />

              <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                <span>Tailwind CSS classes included</span>
                <span className="font-mono text-zinc-400">React 18+ / Next.js / Vite</span>
              </div>
            </div>
          )}

          {tab === 'mcp' && (
            <div className="space-y-4">
              {/* 1. Instant Prompt to give to Cursor / Claude */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Ask Your AI Agent
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#0c0d10]">
                  <span className="text-xs font-mono text-zinc-200 pr-3">
                    "{MCP_AGENT_PROMPT}"
                  </span>
                  <CopyButton value={MCP_AGENT_PROMPT} showTooltip={true} />
                </div>
              </div>

              {/* 2. MCP Server Configuration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase tracking-wider">
                    MCP Server Config (Cursor / Claude)
                  </span>
                  <span className="text-[11px] text-zinc-500">.cursor/mcp.json</span>
                </div>
                <div className="relative rounded-xl border border-white/10 bg-[#0c0d10] p-3 font-mono text-xs overflow-hidden">
                  <div className="absolute top-2.5 right-2.5">
                    <CopyButton value={MCP_CONFIG_SNIPPET} showTooltip={true} />
                  </div>
                  <pre className="text-zinc-300 leading-relaxed overflow-x-auto m-0">
                    <code>{MCP_CONFIG_SNIPPET}</code>
                  </pre>
                </div>
              </div>

              {/* 3. Learn More Link */}
              {onOpenMcpFull && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMcpFull();
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>Open full Key UI MCP settings & tools documentation</span>
                </button>
              )}
            </div>
          )}

          {/* MCP AI Agent Banner (Clickable to switch tab) */}
          {tab !== 'mcp' && (
            <button
              type="button"
              onClick={() => {
                sound.knock(0.3, 0);
                setTab('mcp');
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all text-xs cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                <Bot className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>Use with AI agents via Key UI MCP server</span>
              </div>
              <span className="font-mono text-[11px] text-zinc-400 group-hover:text-white px-2 py-0.5 rounded bg-black/40 border border-white/5 flex items-center gap-1">
                <span>View MCP</span>
                <span className="text-orange-400 font-bold">→</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default TypewriterGetCodeModal;
