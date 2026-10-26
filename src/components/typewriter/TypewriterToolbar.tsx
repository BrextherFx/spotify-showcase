import React from 'react';
import { CodeXml, RotateCcw, Download, BookOpen } from 'lucide-react';
import { sound } from '../../audio/soundEngine';

interface TypewriterToolbarProps {
  onOpenGetCode: () => void;
  onRestart: () => void;
  onDownloadPaper?: () => void;
  isComplete?: boolean;
}

export const TypewriterToolbar: React.FC<TypewriterToolbarProps> = ({
  onOpenGetCode,
  onRestart,
  onDownloadPaper,
  isComplete = false,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-full border border-black/10 bg-white/85 p-1.5 backdrop-blur-md shadow-2xl transition-all hover:border-black/20 hover:bg-white/95 text-zinc-800">
      {/* 1. Main "Get code" button (Styled directly like unlumen.com "Show docs" / "Get code") */}
      <button
        type="button"
        onClick={() => {
          sound.knock(0.3, 0);
          onOpenGetCode();
        }}
        className="flex h-8 cursor-pointer items-center gap-2 rounded-full px-3.5 text-xs font-semibold text-zinc-800 hover:bg-black/[0.06] hover:text-black transition-all group"
        title="Get code & installation"
      >
        <span className="inline-flex text-zinc-700 group-hover:text-black transition-colors">
          <BookOpen className="w-3.5 h-3.5" />
        </span>
        <span className="tracking-tight">Get code</span>
      </button>

      <div className="h-4 w-px bg-black/10 my-auto" />

      {/* 2. Restart Typing Button */}
      <button
        type="button"
        onClick={() => {
          sound.knock(0.4, 0);
          onRestart();
        }}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-600 hover:bg-black/[0.06] hover:text-zinc-900 transition-all"
        title="Restart typing"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* 3. Download Paper Button */}
      {onDownloadPaper && (
        <button
          type="button"
          onClick={() => {
            sound.knock(0.5, 0);
            onDownloadPaper();
          }}
          className={`relative flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-all ${
            isComplete
              ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 font-semibold'
              : 'text-zinc-600 hover:bg-black/[0.06] hover:text-zinc-900'
          }`}
          title="Download typed paper"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download</span>
          {isComplete && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
          )}
        </button>
      )}

      {/* 4. Emerald Green </> Code Trigger Button */}
      <button
        type="button"
        onClick={() => {
          sound.knock(0.3, 0);
          onOpenGetCode();
        }}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
        title="View component code"
      >
        <CodeXml className="w-4 h-4" />
      </button>
    </div>
  );
};
