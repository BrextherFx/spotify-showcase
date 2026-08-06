import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";

interface CodeBlockProps {
  code: string;
  filename?: string;
  language?: string;
  /** Max height before the block scrolls. */
  maxHeight?: number;
}

export default function CodeBlock({
  code,
  filename,
  language = "tsx",
  maxHeight = 420,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename ?? `snippet.${language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">
          {filename ?? language}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            aria-label="Copy code"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={download}
            aria-label="Download file"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Download className="size-3.5" />
            Download
          </button>
        </div>
      </div>
      <pre
        className="overflow-auto p-4 text-[12.5px] leading-relaxed"
        style={{ maxHeight }}
      >
        <code className="font-mono text-foreground/90">{code}</code>
      </pre>
    </div>
  );
}
