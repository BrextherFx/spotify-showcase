import React, { useState, useEffect } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { sound } from '../../audio/soundEngine';

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

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      sound.knock(0.3, 0);
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
        className={`group/btn relative inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.08] active:scale-[0.94] transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 ${className}`}
        {...props}
      >
        <span
          className={`inline-flex items-center justify-center transition-all duration-200 transform ${
            state === 'done' ? 'scale-110 text-emerald-400' : state === 'error' ? 'text-red-400' : ''
          }`}
        >
          {state === 'idle' && (idleIcon ?? <Copy className={iconClassName} />)}
          {state === 'done' && (doneIcon ?? <Check className={iconClassName} />)}
          {state === 'error' && <AlertCircle className={iconClassName} />}
        </span>
      </button>

      {/* Optional Tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none z-30 whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium bg-zinc-800 text-zinc-200 shadow-md border border-white/10 animate-in fade-in zoom-in-95 duration-150">
          {state === 'done' ? 'Copied!' : 'Copy'}
        </div>
      )}
    </div>
  );
};
