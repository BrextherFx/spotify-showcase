import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Github, Terminal } from "lucide-react";
import Logo from "@/components/icons/Logo";
import Spotify from "@/components/spotify/Spotify";
import CodeBlock from "@/components/docs/CodeBlock";
import { LineNav } from "@/components/line-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import spotifySource from "@/components/spotify/Spotify.tsx?raw";
import hookSource from "@/hooks/useSpotify.ts?raw";
import iconSource from "@/components/icons/SpotifyIcon.tsx?raw";

const TITLE = "Spotify Now Playing Card — Components";
const DESCRIPTION =
  "A live Spotify now-playing card with a spinning CD disc, expand animation and Lanyard presence. Copy the TypeScript source, download the files, follow the steps.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: DocsPage,
});

const DEMO_DISCORD_ID = "707371655380664321";

const SECTIONS = [
  { id: "showcase", label: "Showcase" },
  { id: "installation", label: "Installation" },
  { id: "download", label: "Download" },
  { id: "usage", label: "Usage" },
  { id: "props", label: "Props" },
];

const FILES = [
  {
    key: "component",
    filename: "Spotify.tsx",
    path: "components/spotify/Spotify.tsx",
    code: spotifySource,
  },
  {
    key: "hook",
    filename: "useSpotify.ts",
    path: "hooks/useSpotify.ts",
    code: hookSource,
  },
  {
    key: "icon",
    filename: "SpotifyIcon.tsx",
    path: "components/icons/SpotifyIcon.tsx",
    code: iconSource,
  },
] as const;

const STEPS = [
  {
    title: "Install dependencies",
    body: "The card only needs Motion for the spring animation and Tailwind CSS for styling.",
    code: "npm install motion",
    lang: "bash",
  },
  {
    title: "Add the presence source",
    body: "Join the Lanyard Discord server (discord.gg/lanyard) with the account you listen on, then copy your Discord user ID. Lanyard exposes your Spotify activity as a public JSON endpoint — no OAuth, no server.",
    code: "https://api.lanyard.rest/v1/users/<YOUR_DISCORD_ID>",
    lang: "bash",
  },
  {
    title: "Copy the files",
    body: "Drop the three files below into your project, keeping the paths so the imports resolve.",
    code: "src/\n  components/spotify/Spotify.tsx\n  components/icons/SpotifyIcon.tsx\n  hooks/useSpotify.ts",
    lang: "text",
  },
  {
    title: "Render it",
    body: "Pass your Discord ID. The card reserves a fixed slot and grows upward on click, so the surrounding layout never shifts.",
    code: '<Spotify discordId="YOUR_DISCORD_ID" />',
    lang: "tsx",
  },
] as const;

const PROPS = [
  {
    name: "discordId",
    type: "string",
    def: "—",
    desc: "Discord user ID tracked by Lanyard. Required; the component renders nothing without it.",
  },
  {
    name: "demoTrack",
    type: "{ title, artist, albumArt, songUrl } | null",
    def: "null",
    desc: "Overrides presence with a fake playing track — visual only, no audio playback.",
  },
  {

    name: "pollInterval",
    type: "number",
    def: "15000",
    desc: "useSpotify option — how often the presence endpoint is polled, in ms.",
  },
  {
    name: "storageKey",
    type: "string",
    def: '"spotify_last_played"',
    desc: "useSpotify option — localStorage key used to show the last played track while offline.",
  },
];

const DEMO_TRACK = {
  title: "Blinding Lights",
  artist: "The Weeknd",
  albumArt:
    "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
  songUrl: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
};

function DocsPage() {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [demoOn, setDemoOn] = useState(false);
  const [activeFile, setActiveFile] = useState<string>(FILES[0].key);
  const [activeSection, setActiveSection] = useState<string>("showcase");
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
              <a href="/" className="text-sm font-medium text-foreground hover:text-accent-foreground transition-colors">
                Spotify
              </a>
              <a href="/ecg" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                ECG Machine
              </a>
              <a href="/receipt-printer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Receipt Printer
              </a>
              <a href="/postcard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Postcard
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
            Components / Spotify
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Spotify Now Playing
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A live now-playing card built with React, TypeScript and Motion. A CD disc
            spins in the corner while collapsed, then flies to the top as the card
            springs open. Presence comes from Lanyard, with a localStorage fallback that
            keeps the last played track for a week.
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
              <div className="relative flex min-h-[420px] flex-col items-center justify-end gap-6 overflow-hidden rounded-b-xl border border-t-0 border-border bg-muted/30 p-10">
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
                  <Spotify
                    discordId={DEMO_DISCORD_ID}
                    demoTrack={demoOn ? DEMO_TRACK : null}
                  />
                </div>

                <div className="relative flex w-full max-w-sm flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDemoOn((v) => !v)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                      demoOn
                        ? "border-[#1DB954] bg-[#1DB954]/10 text-[#1DB954]"
                        : "border-border bg-card text-foreground hover:bg-accent"
                    }`}
                  >
                    <span className="relative flex size-2">
                      <span
                        className={`size-2 rounded-full ${demoOn ? "animate-ping bg-[#1DB954]" : "bg-muted-foreground"}`}
                      />
                    </span>
                    {demoOn ? "Stop demo" : "Simulate listening"}
                  </button>
                  <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                    Visual only — the disc spins and the bars animate, no audio is
                    played. Open Song links to the Spotify track.
                  </p>
                </div>

                <span className="absolute bottom-3 right-4 text-[11px] text-muted-foreground">
                  Click the card to expand
                </span>
              </div>

            ) : (
              <div className="rounded-b-xl border border-t-0 border-border p-4">
                <CodeBlock
                  code={spotifySource}
                  filename="Spotify.tsx"
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
              Three TypeScript files. Copy or download each one — no CLI, no registry.
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
                code={`import Spotify from "@/components/spotify/Spotify"; export default function Page() {
                return (
                <section className="mx-auto max-w-sm">
                <Spotify discordId="${DEMO_DISCORD_ID}" />
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

          <footer className="mt-16 border-t border-border pt-6">
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
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
              <a
                href="https://www.scrolllaunch.com/products/spotify-now-playing-card?ref=badge"
                target="_blank"
                rel="noopener"
                title="Featured on ScrollLaunch"
              >
                <img
                  src="https://www.scrolllaunch.com/api/badge/spotify-now-playing-card"
                  alt="Featured on ScrollLaunch"
                  width="220"
                  height="48"
                  loading="lazy"
                />
              </a>
            </div>
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

