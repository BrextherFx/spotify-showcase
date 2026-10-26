import React, { useRef, useEffect } from 'react';
import { FileCode, FileText } from 'lucide-react';
import { CopyButton } from './CopyButton';

export interface CodeViewerProps {
  code: string;
  filename?: string;
  language?: string;
  className?: string;
  maxHeight?: string;
}

// Tokenizer & syntax highlighter for TypeScript / JSX / TSX
function highlightTypeScript(code: string): React.ReactNode[] {
  const lines = code.split('\n');

  return lines.map((line, lineIndex) => {
    // Check for comment
    const commentIndex = line.indexOf('//');
    let codePart = commentIndex !== -1 ? line.slice(0, commentIndex) : line;
    const commentPart = commentIndex !== -1 ? line.slice(commentIndex) : '';

    // Regex token patterns
    const tokenRegex =
      /(".*?"|'.*?'|`.*?`|\b(?:import|export|from|const|let|var|function|return|if|else|interface|type|default|as|true|false|null|undefined|async|await|extends|implements|new|typeof|void|any)\b|\b(?:useState|useRef|useEffect|useCallback|useMemo|useLayoutEffect)\b|(?:\b[A-Z][a-zA-Z0-9_]*\b)|(?:<\/?[a-zA-Z0-9_\-]+(?:\s|>|\/)|(?:\/>))|(?:\b(?:className|onClick|onKeyDown|tabIndex|style|title|value|timeout|id|key)\b))/g;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(codePart)) !== null) {
      if (match.index > lastIndex) {
        elements.push(codePart.slice(lastIndex, match.index));
      }

      const token = match[0];
      const index = match.index;

      if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
        // String literal
        elements.push(
          <span key={`${lineIndex}-${index}`} className="text-emerald-300">
            {token}
          </span>
        );
      } else if (
        [
          'import',
          'export',
          'from',
          'const',
          'let',
          'var',
          'function',
          'return',
          'if',
          'else',
          'interface',
          'type',
          'default',
          'as',
          'async',
          'await',
          'extends',
          'implements',
          'new',
          'typeof',
        ].includes(token)
      ) {
        // Keyword
        elements.push(
          <span key={`${lineIndex}-${index}`} className="text-sky-400 font-medium">
            {token}
          </span>
        );
      } else if (['true', 'false', 'null', 'undefined', 'void', 'any'].includes(token)) {
        // Primitives / Literals
        elements.push(
          <span key={`${lineIndex}-${index}`} className="text-amber-400">
            {token}
          </span>
        );
      } else if (token.startsWith('use')) {
        // React hooks
        elements.push(
          <span key={`${lineIndex}-${index}`} className="text-purple-300 font-medium">
            {token}
          </span>
        );
      } else if (token.startsWith('<') || token.startsWith('</') || token === '/>') {
        // JSX tag
        elements.push(
          <span key={`${lineIndex}-${index}`} className="text-rose-400">
            {token}
          </span>
        );
      } else if (
        ['className', 'onClick', 'onKeyDown', 'tabIndex', 'style', 'title', 'value', 'timeout', 'id', 'key'].includes(
          token
        )
      ) {
        // JSX attributes
        elements.push(
          <span key={`${lineIndex}-${index}`} className="text-sky-300">
            {token}
          </span>
        );
      } else if (/^[A-Z]/.test(token)) {
        // Types / Components
        elements.push(
          <span key={`${lineIndex}-${index}`} className="text-teal-300">
            {token}
          </span>
        );
      } else {
        elements.push(token);
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < codePart.length) {
      elements.push(codePart.slice(lastIndex));
    }

    if (commentPart) {
      elements.push(
        <span key={`${lineIndex}-comment`} className="text-zinc-500 italic">
          {commentPart}
        </span>
      );
    }

    return (
      <div key={lineIndex} className="table-row leading-[22px]">
        {/* Line number gutter */}
        <span className="table-cell pr-4 text-right select-none text-[11px] font-mono text-zinc-600/70 border-r border-white/[0.06] w-10 shrink-0">
          {lineIndex + 1}
        </span>
        {/* Code line content */}
        <span className="table-cell pl-4 whitespace-pre font-mono text-[12.5px] text-zinc-300">
          {elements.length > 0 ? elements : '\u00A0'}
        </span>
      </div>
    );
  });
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  filename = 'component.tsx',
  language = 'TSX',
  className = '',
  maxHeight = '320px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Guarantee that code view is scrolled to top on mount or when code changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      containerRef.current.scrollLeft = 0;
    }
  }, [code]);

  return (
    <div
      className={`relative w-full rounded-xl border border-white/[0.08] bg-[#0c0d10] shadow-xl overflow-hidden text-left ${className}`}
    >
      {/* File Header Bar */}
      <div className="flex h-10 items-center justify-between border-b border-white/[0.08] px-3.5 bg-[#111216]">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-mono text-xs text-zinc-300 font-medium">{filename}</span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/5 uppercase">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CopyButton value={code} showTooltip={true} />
        </div>
      </div>

      {/* Code Container with Line Numbers */}
      <div
        ref={containerRef}
        style={{ maxHeight }}
        className="overflow-auto p-3.5 font-mono text-xs select-text scrollbar-thin scrollbar-thumb-zinc-700"
      >
        <div className="table w-full">{highlightTypeScript(code)}</div>
      </div>
    </div>
  );
};
export default CodeViewer;
