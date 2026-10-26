import React, { useState } from 'react';
import { X, Bot, Sparkles, Terminal, Copy, Check, ExternalLink, Cpu } from 'lucide-react';
import { CopyButton } from '../ui/CopyButton';
import { sound } from '../../audio/soundEngine';

interface McpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AgentTab = 'cursor' | 'claude' | 'windsurf' | 'antigravity';

const CONFIG_SNIPPETS: Record<AgentTab, { file: string; config: string; desc: string }> = {
  cursor: {
    file: '.cursor/mcp.json',
    desc: 'Add to your workspace or Cursor Settings > Features > MCP',
    config: `{
  "mcpServers": {
    "key-ui": {
      "command": "node",
      "args": ["C:/Users/thril/Desktop/Key-Ui/mcp-server/index.js"]
    }
  }
}`,
  },
  claude: {
    file: '%APPDATA%\\Claude\\claude_desktop_config.json',
    desc: 'Claude Desktop App configuration file',
    config: `{
  "mcpServers": {
    "key-ui": {
      "command": "node",
      "args": ["C:/Users/thril/Desktop/Key-Ui/mcp-server/index.js"]
    }
  }
}`,
  },
  windsurf: {
    file: '~/.codeium/windsurf/mcp_config.json',
    desc: 'Windsurf Cascade MCP settings',
    config: `{
  "mcpServers": {
    "key-ui": {
      "command": "node",
      "args": ["C:/Users/thril/Desktop/Key-Ui/mcp-server/index.js"]
    }
  }
}`,
  },
  antigravity: {
    file: 'Antigravity / Agent MCP Config',
    desc: 'Direct tool integration via stdio',
    config: `{
  "name": "key-ui",
  "command": "node",
  "args": ["C:/Users/thril/Desktop/Key-Ui/mcp-server/index.js"],
  "transport": "stdio"
}`,
  },
};

const SAMPLE_PROMPTS = [
  'Use Key UI MCP to install and integrate the Typewriter component into my project.',
  'Show me how to use the Chanh Dai style CopyButton from Key UI with pnpm.',
  'Find all audio-reactive and physics components in Key UI.',
];

export const McpModal: React.FC<McpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<AgentTab>('cursor');

  if (!isOpen) return null;

  const currentSnippet = CONFIG_SNIPPETS[activeTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Dialog Box */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[#090a0d] border border-white/[0.1] text-white shadow-2xl z-10 my-auto flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-[#0d0e12]">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Bot className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-white tracking-tight">Key UI MCP Server</h3>
                <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Let your AI coding agents fetch and integrate components automatically
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Agent Selection Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Select Your AI Agent / IDE
              </label>
              <span className="text-xs text-zinc-500">{currentSnippet.desc}</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-black/40 p-1 border border-white/5">
              {(['cursor', 'claude', 'windsurf', 'antigravity'] as AgentTab[]).map((tab) => {
                const isActive = activeTab === tab;
                const labels: Record<AgentTab, string> = {
                  cursor: 'Cursor',
                  claude: 'Claude Desktop',
                  windsurf: 'Windsurf',
                  antigravity: 'Antigravity / CLI',
                };
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      sound.knock(0.3, 0);
                      setActiveTab(tab);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white/10 text-white shadow-sm font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Config Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span className="font-mono text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                {currentSnippet.file}
              </span>
              <span className="text-[11px] text-zinc-500">Copy & paste into config</span>
            </div>

            <div className="relative rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4 font-mono text-xs overflow-hidden">
              <div className="absolute top-3 right-3 z-10">
                <CopyButton value={currentSnippet.config} showTooltip={true} />
              </div>
              <pre className="text-zinc-300 leading-relaxed overflow-x-auto m-0">
                <code>{currentSnippet.config}</code>
              </pre>
            </div>
          </div>

          {/* Available MCP Tools Grid */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Capabilities Exposed to AI
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                  <code className="text-sky-400">get_component</code>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Returns ready-to-use TypeScript code, props, and peer dependencies.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                  <code className="text-sky-400">get_install_command</code>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Returns CLI commands for pnpm, yarn, npm, or bun.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                  <code className="text-sky-400">list_components</code>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Discovers all interactive components, acoustics, and categories.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                  <code className="text-sky-400">search_components</code>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Keyword search across audio, physics, buttons, and animations.
                </p>
              </div>
            </div>
          </div>

          {/* Example Prompts to Try */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
              Prompts to give your AI
            </h4>
            <div className="space-y-2">
              {SAMPLE_PROMPTS.map((prompt, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-black/30 hover:border-white/10 transition-colors"
                >
                  <span className="text-xs text-zinc-300 font-mono pr-3">"{prompt}"</span>
                  <CopyButton value={prompt} showTooltip={true} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-3.5 bg-[#0d0e12] text-xs text-zinc-400">
          <span>Run standalone locally:</span>
          <code className="font-mono text-xs px-2.5 py-1 rounded bg-black/60 border border-white/10 text-orange-300">
            npm run mcp
          </code>
        </div>
      </div>
    </div>
  );
};
export default McpModal;
