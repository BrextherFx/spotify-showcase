import React, { useState } from 'react';
import { CopyButton } from './CopyButton';

export type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun';

export interface CodeInstallationBlockProps {
  componentId?: string;
  commandMap?: Record<PackageManager, string>;
  className?: string;
}

const DEFAULT_COMMANDS: Record<PackageManager, string> = {
  pnpm: 'pnpm dlx shadcn@latest add @key-ui/typewriter',
  yarn: 'npx shadcn@latest add @key-ui/typewriter',
  npm: 'npx shadcn@latest add @key-ui/typewriter',
  bun: 'bunx --bun shadcn@latest add @key-ui/typewriter',
};

// 3-square package manager / terminal grid icon matching chanhdai.com
const PackageManagerGridIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
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

  // Syntax highlight split
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
    <div
      className={`relative w-full rounded-xl border border-white/[0.08] bg-[#0c0d10] shadow-xl overflow-hidden text-left ${className}`}
    >
      {/* Top Tab Bar - Exact layout from chanhdai.com / Image 2 */}
      <div className="flex h-10 items-center justify-between border-b border-white/[0.08] px-3 bg-[#111216]">
        {/* Left: Package Manager Icon + Tabs */}
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
                  className={`relative py-2.5 text-[13px] font-mono transition-colors ${
                    isActive ? 'text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {pm}
                  {/* Active underline indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white translate-y-[1px] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Chanh Dai Copy Button */}
        <div className="pr-0.5">
          <CopyButton value={currentCommand} showTooltip={true} />
        </div>
      </div>

      {/* Code Command Content */}
      <div className="overflow-x-auto p-4 py-3.5">
        <pre className="m-0 overflow-x-auto whitespace-pre font-mono">
          <code>{renderHighlightedCommand(currentCommand)}</code>
        </pre>
      </div>
    </div>
  );
};
