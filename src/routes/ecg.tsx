import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Github, Terminal } from "lucide-react";
import Logo from "@/components/icons/Logo";
import { EcgMachine } from "@/components/ECG/EcgMachine";
import CodeBlock from "@/components/docs/CodeBlock";
import { LineNav } from "@/components/line-nav";
import ecgMachineSource from "@/components/ECG/EcgMachine.tsx?raw";
import ecgWatchfaceSource from "@/components/ECG/EcgWatchface.tsx?raw";
import { ThemeToggle } from "@/components/theme-toggle";

const TITLE = "ECG Machine — Components";
const DESCRIPTION =
  "An animated ECG machine component with real-time heart rate visualization, digital clock display, and retro medical device aesthetic. Copy the TypeScript source, download the files, follow the steps.";

export const Route = createFileRoute("/ecg")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: EcgDocsPage,
});

const SECTIONS = [
  { id: "showcase", label: "Showcase" },
  { id: "installation", label: "Installation" },
  { id: "download", label: "Download" },
  { id: "usage", label: "Usage" },
  { id: "props", label: "Props" },
];

const FILES = [
  {
    key: "machine",
    filename: "EcgMachine.tsx",
    path: "components/ECG/EcgMachine.tsx",
    code: ecgMachineSource,
  },
  {
    key: "watchface",
    filename: "EcgWatchface.tsx",
    path: "components/ECG/EcgWatchface.tsx",
    code: ecgWatchfaceSource,
  },
  {
    key: "ecg",
    filename: "ecg.ts",
    path: "lib/ecg.ts",
    code: ecgMachineSource,
  },
] as const;

const STEPS = [
  {
    title: "Install dependencies",
    body: "The ECG machine component uses React and Tailwind CSS for styling. No additional animation libraries required.",
    code: "npm install react react-dom",
    lang: "bash",
  },
  {
    title: "Copy the files",
    body: "Drop the two files below into your project, keeping the paths so the imports resolve. The component generates a retro ECG display with animated traces.",
    code: "src/\n  components/ECG/EcgMachine.tsx\n  components/ECG/EcgWatchface.tsx\n  lib/ecg.ts",
    lang: "text",
  },
  {
    title: "Render it",
    body: "Pass the current time and heart rate in BPM. The component will display an animated ECG trace with the current time and vital signs.",
    code: '<EcgMachine hour24={12} minute={30} second={45} bpm={72} />',
    lang: "tsx",
  },
  {
    title: "Connect to real data (optional)",
    body: "Update the hour24, minute, second, and bpm props from your data source or state management. The component updates reactively.",
    code: `const [time, setTime] = useState(new Date());
const [bpm, setBpm] = useState(72);

useEffect(() => {
  const timer = setInterval(() => setTime(new Date()), 1000);
  return () => clearInterval(timer);
}, []);

return (
  <EcgMachine
    hour24={time.getHours()}
    minute={time.getMinutes()}
    second={time.getSeconds()}
    bpm={bpm}
  />
);`,
    lang: "tsx",
  },
] as const;

const PROPS = [
  {
    name: "hour24",
    type: "number",
    def: "—",
    desc: "Hour in 24-hour format (0-23). Required.",
  },
  {
    name: "minute",
    type: "number",
    def: "—",
    desc: "Minute (0-59). Required.",
  },
  {
    name: "second",
    type: "number",
    def: "—",
    desc: "Second (0-59). Required.",
  },
  {
    name: "bpm",
    type: "number",
    def: "—",
    desc: "Heart rate in beats per minute. Required.",
  },
];

function EcgDocsPage() {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [activeFile, setActiveFile] = useState<string>(FILES[0].key);
  const [activeSection, setActiveSection] = useState<string>("showcase");
  const [time, setTime] = useState(new Date());
  const [bpm, setBpm] = useState(72);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      // Simulate BPM variation
      setBpm(Math.floor(60 + Math.random() * 40));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const file = FILES.find((f) => f.key === activeFile) ?? FILES[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
                <Logo className="size-3.5" />
              </span>
              <span className="font-brand text-sm font-semibold tracking-tight">KEY UI</span>
              <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                docs
              </span>
            </div>
            <nav className="flex items-center gap-6 border-l border-border pl-6">
              <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Spotify
              </a>
              <a href="/ecg" className="text-sm font-medium text-foreground hover:text-accent-foreground transition-colors">
                ECG Machine
              </a>
              <a href="/receipt-printer" className="text-sm font-medium text-foreground hover:text-accent-foreground transition-colors">
                Receipt Printer
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href="https://github.com/brextherfx/spotify-showcase"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Github className="size-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-12">
        <main className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Components / ECG
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            ECG Machine
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A retro ECG machine component built with React and TypeScript. Displays real-time heart rate visualization with an animated trace, digital clock, and authentic medical device styling. Perfect for health monitoring dashboards, fitness apps, and visual demonstrations.
          </p>

          <section id="showcase" className="mt-10 scroll-mt-24">
            <div className="flex items-center gap-1 border-b border-border">
              {(["preview", "code"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    tab === t
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "preview" ? (
              <div className="relative flex min-h-[520px] flex-col items-center justify-center gap-6 overflow-hidden rounded-b-xl border border-t-0 border-border bg-muted/30 p-10">
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.5]"
                  style={{
                    backgroundImage:
                      "radial-gradient(currentColor 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                    color: "var(--border)",
                  }}
                />
                <div className="relative w-full max-w-3xl">
                  <EcgMachine
                    hour24={time.getHours()}
                    minute={time.getMinutes()}
                    second={time.getSeconds()}
                    bpm={bpm}
                  />
                </div>

                <p className="relative text-center text-[11px] leading-relaxed text-muted-foreground">
                  Live ECG display — updates every second with current time and simulated heart rate
                </p>
              </div>
            ) : (
              <div className="rounded-b-xl border border-t-0 border-border p-4">
                <CodeBlock
                  code={ecgMachineSource}
                  filename="EcgMachine.tsx"
                  maxHeight={520}
                />
              </div>
            )}
          </section>

          <section id="installation" className="mt-14 scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight">Installation</h2>
            <ol className="mt-6 space-y-8 border-l border-border pl-8">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative">
                  <span className="absolute -left-[45px] flex size-7 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                  <div className="mt-3">
                    {step.lang === "bash" ? (
                      <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-border bg-card px-3 py-2.5 font-mono text-xs">
                        <Terminal className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="whitespace-pre">{step.code}</span>
                      </div>
                    ) : (
                      <pre className="overflow-x-auto rounded-lg border border-border bg-card px-3 py-2.5 font-mono text-xs leading-relaxed">
                        <code>{step.code}</code>
                      </pre>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="download" className="mt-14 scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight">Download</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Two TypeScript files. Copy or download each one — no CLI, no registry.
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {FILES.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFile(f.key)}
                  className={`rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
                    activeFile === f.key
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.filename}
                </button>
              ))}
            </div>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">
              src/{file.path}
            </p>
            <div className="mt-3">
              <CodeBlock code={file.code} filename={file.filename} maxHeight={480} />
            </div>
          </section>

          <section id="usage" className="mt-14 scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight">Usage</h2>
            <div className="mt-4">
              <CodeBlock
                filename="page.tsx"
                code={`import { EcgMachine } from "@/components/ECG/EcgMachine";

export default function Page() {
  return (
    <section className="mx-auto max-w-3xl">
      <EcgMachine hour24={12} minute={30} second={45} bpm={72} />
    </section>
  );
}`}
              />
            </div>
          </section>

          <section id="props" className="mt-14 scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight">Props</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium">Default</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {PROPS.map((p) => (
                    <tr key={p.name} className="border-t border-border align-top">
                      <td className="px-4 py-3 font-mono text-xs">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {p.type}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {p.def}
                      </td>
                      <td className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                        {p.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="mt-16 border-t border-border pt-6 text-xs text-muted-foreground">
            <p>
              Made with ❤️ by{" "}
              <a
                href="https://x.com/Brextherfx"
                target="_blank"
                rel="noopener noreferrer"
                className="font-brand font-medium text-foreground underline underline-offset-2 transition-colors hover:text-accent-foreground"
              >
                BrextherFX
              </a>
            </p>
          </footer>
        </main>

        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-24">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              On this page
            </p>
            <LineNav
              items={SECTIONS.map((s) => ({
                title: s.label,
                href: `#${s.id}`,
              }))}
              activeHref={`#${activeSection}`}
              onItemClick={(item) => {
                setActiveSection(item.href.replace("#", ""));
              }}
              className="mt-3"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
