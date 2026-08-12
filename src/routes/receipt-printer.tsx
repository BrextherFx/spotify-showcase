import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Github, Terminal } from "lucide-react";
import { ReceiptPrinter } from "@/components/receipt-printer/receipt-printer";
import CodeBlock from "@/components/docs/CodeBlock";
import { LineNav } from "@/components/line-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import receiptPrinterSource from "@/components/receipt-printer/receipt-printer.tsx?raw";

const TITLE = "Receipt Printer — Components";
const DESCRIPTION =
  "An interactive receipt printer animation with print status, generated receipt paper with barcode, and smooth transitions. Copy the TypeScript source, download the files, follow the steps.";

export const Route = createFileRoute("/receipt-printer")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: ReceiptPrinterPage,
});

const SECTIONS = [
  { id: "showcase", label: "Showcase" },
  { id: "installation", label: "Installation" },
  { id: "download", label: "Download" },
  { id: "usage", label: "Usage" },
  { id: "features", label: "Features" },
  { id: "colors", label: "Color Variants" },
];

const FILES = [
  {
    key: "component",
    filename: "receipt-printer.tsx",
    path: "components/receipt-printer/receipt-printer.tsx",
    code: receiptPrinterSource,
  },
] as const;

const STEPS = [
  {
    title: "Install dependencies",
    body: "The receipt printer component requires Motion for animations and Lucide React for icons.",
    code: "npm install motion lucide-react",
    lang: "bash",
  },
  {
    title: "Copy the component",
    body: "Drop the receipt printer component into your project, maintaining the folder structure so imports resolve correctly.",
    code: "src/components/receipt-printer/receipt-printer.tsx",
    lang: "text",
  },
  {
    title: "Import and render",
    body: "Import the ReceiptPrinter component and drop it into any page or container. The component is self-contained and handles all state internally.",
    code: 'import { ReceiptPrinter } from "@/components/receipt-printer/receipt-printer";\n\nexport default function Page() {\n  return <ReceiptPrinter />;\n}',
    lang: "tsx",
  },
  {
    title: "Customize styles",
    body: "The component uses CSS classes for styling. You can customize colors, sizes, and animations by modifying the Tailwind classes or adding custom CSS variables for theming.",
    code: "/* Customize CSS variables in your theme */\n--shell: /* printer shell color */\n--screen: /* display screen color */\n--accent: /* button accent color */\n--paper: /* receipt paper color */\n--ink: /* receipt ink color */",
    lang: "css",
  },
] as const;

const FEATURES = [
  {
    name: "Print Animation",
    desc: "Realistic printer vibration and movement while printing status is active.",
  },
  {
    name: "Receipt Generation",
    desc: "Animated paper scroll with order details, pricing breakdown, and barcode.",
  },
  {
    name: "Status States",
    desc: "Three states: idle (ready to pay), printing (animated loading), and done (completed).",
  },
  {
    name: "Barcode Rendering",
    desc: "SVG-based barcode visualization on the generated receipt.",
  },
  {
    name: "Smooth Transitions",
    desc: "Motion-based animations for all state changes and property updates.",
  },
  {
    name: "Responsive Design",
    desc: "Adapts to different screen sizes while maintaining visual fidelity.",
  },
];

const CUSTOMIZATION = {
  colors: [
    { name: "Shell", var: "--shell", desc: "Printer body color" },
    { name: "Screen", var: "--screen", desc: "Display area background" },
    { name: "Accent", var: "--accent", desc: "Button and icon colors" },
    { name: "Paper", var: "--paper", desc: "Receipt background" },
    { name: "Ink", var: "--ink", desc: "Receipt text and barcode" },
  ],
  states: [
    { state: "idle", desc: "Initial state, Pay button visible" },
    { state: "printing", desc: "Printer animating, loading state shown" },
    { state: "done", desc: "Receipt complete, reset button available" },
  ],
};

const COLOR_VARIANTS = [
  {
    name: "Dark",
    class: "printer-dark",
    shell: "oklch(0.24 0.003 285)",
    screen: "oklch(0.17 0.002 285)",
    accent: "oklch(0.208 0.042 265.755)",
    paper: "oklch(0.965 0.004 90)",
    desc: "Deep indigo with contrast white accent",
  },
  {
    name: "Mint",
    class: "printer-mint",
    shell: "oklch(0.22 0.08 165)",
    screen: "oklch(0.15 0.06 160)",
    accent: "oklch(0.208 0.042 265.755)",
    paper: "oklch(0.97 0.01 90)",
    desc: "Fresh mint green shell",
  },
  {
    name: "Berry",
    class: "printer-berry",
    shell: "oklch(0.28 0.09 310)",
    screen: "oklch(0.18 0.07 305)",
    accent: "oklch(0.208 0.042 265.755)",
    paper: "oklch(0.96 0.02 90)",
    desc: "Rich berry purple aesthetic",
  },
  {
    name: "Coral",
    class: "printer-coral",
    shell: "oklch(0.32 0.12 25)",
    screen: "oklch(0.2 0.08 25)",
    accent: "oklch(0.208 0.042 265.755)",
    paper: "oklch(0.97 0.01 90)",
    desc: "Warm coral and terracotta",
  },
  {
    name: "Slate",
    class: "printer-slate",
    shell: "oklch(0.25 0.002 280)",
    screen: "oklch(0.16 0.001 280)",
    accent: "oklch(0.208 0.042 265.755)",
    paper: "oklch(0.965 0.004 90)",
    desc: "Neutral professional slate gray",
  },
  {
    name: "Ocean",
    class: "printer-ocean",
    shell: "oklch(0.26 0.07 240)",
    screen: "oklch(0.17 0.05 240)",
    accent: "oklch(0.208 0.042 265.755)",
    paper: "oklch(0.97 0.01 90)",
    desc: "Deep ocean blue vibes",
  },
];

function ReceiptPrinterPage() {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [activeFile, setActiveFile] = useState<string>(FILES[0].key);
  const [activeSection, setActiveSection] = useState<string>("showcase");
  const [selectedColor, setSelectedColor] = useState<string>("printer-dark");
  const file = FILES.find((f) => f.key === activeFile) ?? FILES[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-sm font-semibold tracking-tight">components</span>
              <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                docs
              </span>
            </div>
            <nav className="flex items-center gap-6 border-l border-border pl-6">
              <a
                href="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Spotify
              </a>
              <a
                href="/ecg"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                ECG Machine
              </a>
              <a
                href="/receipt-printer"
                className="text-sm font-medium text-foreground hover:text-accent-foreground transition-colors"
              >
                Receipt Printer
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href="https://github.com"
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
            Components / Receipt Printer
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Receipt Printer
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            An interactive receipt printer component built with React, TypeScript and Motion. 
            Features realistic printer animations, generated receipt paper with a barcode, and 
            smooth state transitions. Perfect for showcasing payment flows or interactive animations.
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
              <div className="relative flex min-h-[600px] flex-col items-center justify-center gap-6 overflow-hidden rounded-b-xl border border-t-0 border-border bg-muted/30 p-10">
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.5]"
                  style={{
                    backgroundImage:
                      "radial-gradient(currentColor 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                    color: "var(--border)",
                  }}
                />
                <div className="relative w-full max-w-sm">
                  <ReceiptPrinter />
                </div>

                <p className="relative text-center text-[11px] leading-relaxed text-muted-foreground">
                  Click "Pay" to start the printer animation. After printing completes, 
                  click "Tear off · reset" to return to the initial state.
                </p>
              </div>
            ) : (
              <div className="rounded-b-xl border border-t-0 border-border p-4">
                <CodeBlock
                  code={receiptPrinterSource}
                  filename="receipt-printer.tsx"
                  maxHeight={600}
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
              One self-contained TypeScript component. Copy or download it directly — no dependencies beyond Motion and Lucide.
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
              <CodeBlock
                code={file.code}
                filename={file.filename}
                maxHeight={600}
              />
            </div>
          </section>

          <section id="usage" className="mt-14 scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight">Usage</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Import the component and render it. It's self-contained with internal state management.
            </p>
            <div className="mt-4">
              <CodeBlock
                filename="page.tsx"
                code={`import { ReceiptPrinter } from "@/components/receipt-printer/receipt-printer";

export default function Page() {
  return (
    <section className="mx-auto flex min-h-screen items-center justify-center">
      <ReceiptPrinter />
    </section>
  );
}`}
              />
            </div>
          </section>

          <section id="features" className="mt-14 scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight">Features</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.name}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <h3 className="text-sm font-semibold">{feature.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            <h3 className="mt-8 text-lg font-semibold tracking-tight">States</h3>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">State</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {CUSTOMIZATION.states.map((s) => (
                    <tr key={s.state} className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        {s.state}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {s.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-8 text-lg font-semibold tracking-tight">
              Customizable CSS Variables
            </h3>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Variable</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {CUSTOMIZATION.colors.map((color) => (
                    <tr key={color.name} className="border-t border-border">
                      <td className="px-4 py-3 text-xs font-semibold">
                        {color.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {color.var}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {color.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="colors" className="mt-14 scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight">Color Variants</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Six preset color themes for different design aesthetics. Add the theme class to the root element or update CSS variables directly.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {COLOR_VARIANTS.map((variant) => (
                <button
                  key={variant.class}
                  type="button"
                  onClick={() => setSelectedColor(variant.class)}
                  className={`overflow-hidden rounded-lg border-2 p-4 text-left transition-all ${
                    selectedColor === variant.class
                      ? "border-foreground bg-card"
                      : "border-border hover:border-foreground/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1 size-6 rounded-lg"
                      style={{
                        backgroundColor: variant.shell,
                      }}
                    />
                    <div>
                      <h3 className="text-sm font-semibold">{variant.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {variant.desc}
                      </p>
                      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                        {variant.class}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold tracking-tight">Usage</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Apply a color variant by adding the class to your root element:
              </p>
              <div className="mt-3">
                <CodeBlock
                  filename="index.tsx"
                  code={`// Apply color theme to root element
document.documentElement.classList.add('${selectedColor}');

// Or use it in your CSS
<div className="${selectedColor}">
  <ReceiptPrinter />
</div>`}
                />
              </div>
            </div>
          </section>

          <footer className="mt-16 border-t border-border pt-6 text-xs text-muted-foreground">
            <p>
              Made with ❤️ by{" "}
              <a
                href="https://x.com/Brextherfx"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-accent-foreground"
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
