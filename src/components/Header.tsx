import React from 'react';
import { X, Bot } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { AnimatedLogo } from './AnimatedLogo';

interface HeaderProps {
  onOpenWaitlist?: () => void;
  onOpenMcp?: () => void;
  currentPath?: string;
  theme?: 'dark' | 'light';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWaitlist,
  onOpenMcp,
  currentPath = '/',
  theme,
}) => {
  const isHome = currentPath === '/';
  const isLightPage = theme === 'light' || currentPath === '/play/typewriter';

  return (
    <header className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 h-16 transition-all pointer-events-auto flex-none">
      {/* Brand Logo */}
      <a
        href="/"
        onClick={() => sound.knock(0.3, 0)}
        className={`group relative flex items-center gap-2.5 whitespace-nowrap text-[15px] font-semibold tracking-tight cursor-pointer transition-colors ${
          isLightPage ? 'text-[#151413]' : 'text-white'
        }`}
      >
        <AnimatedLogo dark={isLightPage} />
        <span>Key UI</span>
      </a>

      {/* Right Navigation */}
      {isHome ? (
        <div className="flex items-center gap-3">
          {/* MCP Button */}
          {onOpenMcp && (
            <button
              type="button"
              onClick={() => {
                sound.knock(0.3, 0);
                onOpenMcp();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-white/[0.05] hover:bg-white/10 text-zinc-300 hover:text-white transition-all shadow-sm group"
              title="Key UI MCP Server for AI Agents"
            >
              <Bot className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
              <span>MCP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          )}

          <a
            href="https://x.com/Brextherfx"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sound.knock(0.2, 0)}
            className="button-cream btn-sm px-4 py-2 text-[13px] text-ink shadow-md font-medium tracking-tight hover:-translate-y-0.5 transition-transform"
          >
            Follow @Brextherfx on X
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* MCP Button */}
          {onOpenMcp && (
            <button
              type="button"
              onClick={() => {
                sound.knock(0.3, 0);
                onOpenMcp();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all shadow-sm group ${
                isLightPage
                  ? 'border-black/10 bg-black/[0.04] hover:bg-black/[0.08] text-zinc-800'
                  : 'border-white/10 bg-white/[0.05] hover:bg-white/10 text-zinc-300 hover:text-white'
              }`}
              title="Key UI MCP Server for AI Agents"
            >
              <Bot className="w-3.5 h-3.5 text-orange-500 group-hover:scale-110 transition-transform" />
              <span>MCP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}

          <a
            href="/"
            onClick={() => sound.knock(0.2, 0)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isLightPage
                ? 'text-zinc-700 hover:text-black bg-black/[0.06] hover:bg-black/[0.12]'
                : 'text-white/60 hover:text-white bg-white/[0.05] hover:bg-white/[0.1]'
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </a>

          {onOpenWaitlist && (
            <button
              onClick={() => {
                sound.knock(0.5, 0);
                onOpenWaitlist();
              }}
              className={`btn-sm px-4 py-2 text-[13px] font-medium transition-all ${
                isLightPage
                  ? 'bg-zinc-900 text-white hover:bg-black rounded-full shadow-sm hover:-translate-y-0.5'
                  : 'button-cream text-ink shadow-md hover:-translate-y-0.5'
              }`}
            >
              Join the waitlist
            </button>
          )}
        </div>
      )}
    </header>
  );
};
