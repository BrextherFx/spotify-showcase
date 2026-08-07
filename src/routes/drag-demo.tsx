import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Spotify from "@/components/spotify/Spotify";
import SpotifyDraggable from "@/components/spotify/SpotifyDraggable";
import SpotifyTrail from "@/components/spotify/SpotifyTrail";

const TITLE = "Drag-to-Open Animation — Spotify Components";
const DESCRIPTION =
  "Compare three Spotify card interaction modes: click-to-open, drag-to-open, and drag-with-trail animation.";

export const Route = createFileRoute("/drag-demo")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: DragDemoPage,
});

const DEMO_DISCORD_ID = "707371655380664321";

const DEMO_TRACK = {
  title: "Blinding Lights",
  artist: "The Weeknd",
  albumArt:
    "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
  songUrl: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
};

function DragDemoPage() {
  const [demoOn, setDemoOn] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#1DB954]" />
            <span className="text-sm font-semibold tracking-tight">components</span>
            <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              drag interactions
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Components / Interactions
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Drag-to-Open Animations
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          Three interaction patterns for the Spotify card component. Compare click-based
          expansion with drag-based activation, including particle trail effects.
        </p>

        {/* Demo Toggle */}
        <div className="mt-8 flex items-center gap-3">
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
                className={`size-2 rounded-full ${
                  demoOn ? "animate-ping bg-[#1DB954]" : "bg-muted-foreground"
                }`}
              />
            </span>
            {demoOn ? "Demo Active" : "Demo Inactive"}
          </button>
          <p className="text-xs text-muted-foreground">
            Toggle demo track to test all variations
          </p>
        </div>

        {/* Three Column Layout */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Original Click-Based */}
          <div className="rounded-xl border border-border bg-muted/30 p-8">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Click to Open</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Original interaction. Click the card to expand and view full details.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center min-h-[320px] rounded-lg border border-border/50 bg-background/50 p-6">
              <div className="pointer-events-none absolute inset-0 opacity-[0.5]" />
              <div className="relative z-10">
                <Spotify
                  discordId={DEMO_DISCORD_ID}
                  demoTrack={demoOn ? DEMO_TRACK : null}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">Usage:</p>
              <code className="block text-[11px] bg-card p-2 rounded border border-border/50 overflow-x-auto">
                &lt;Spotify discordId=&quot;...&quot; /&gt;
              </code>
            </div>
          </div>

          {/* Drag-Based Simple */}
          <div className="rounded-xl border border-border bg-muted/30 p-8">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Drag to Open</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Drag the card (25px threshold) to expand. Cursor changes to grab/grabbing.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center min-h-[320px] rounded-lg border border-border/50 bg-background/50 p-6">
              <div className="pointer-events-none absolute inset-0 opacity-[0.5]" />
              <div className="relative z-10">
                <SpotifyDraggable
                  discordId={DEMO_DISCORD_ID}
                  demoTrack={demoOn ? DEMO_TRACK : null}
                  dragThreshold={25}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">Usage:</p>
              <code className="block text-[11px] bg-card p-2 rounded border border-border/50 overflow-x-auto">
                &lt;SpotifyDraggable <br />
                &nbsp;&nbsp;dragThreshold={"{25}"} /&gt;
              </code>
            </div>
          </div>

          {/* Drag with Trail */}
          <div className="rounded-xl border border-border bg-muted/30 p-8">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Drag with Trail</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enhanced drag interaction with Spotify-green particle trail animation.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center min-h-[320px] rounded-lg border border-border/50 bg-background/50 p-6">
              <div className="pointer-events-none absolute inset-0 opacity-[0.5]" />
              <div className="relative z-10">
                <SpotifyTrail
                  discordId={DEMO_DISCORD_ID}
                  demoTrack={demoOn ? DEMO_TRACK : null}
                  dragThreshold={25}
                  showTrail={true}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">Usage:</p>
              <code className="block text-[11px] bg-card p-2 rounded border border-border/50 overflow-x-auto">
                &lt;SpotifyTrail <br />
                &nbsp;&nbsp;showTrail={"{true}"} /&gt;
              </code>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <section className="mt-16 scroll-mt-24">
          <h2 className="text-xl font-semibold tracking-tight mb-4">Feature Comparison</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Feature</th>
                  <th className="px-4 py-3 font-medium">Click-Based</th>
                  <th className="px-4 py-3 font-medium">Drag-Based</th>
                  <th className="px-4 py-3 font-medium">Drag + Trail</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-xs font-medium">Interaction</td>
                  <td className="px-4 py-3 text-xs">Click anywhere on card</td>
                  <td className="px-4 py-3 text-xs">Drag (25px threshold)</td>
                  <td className="px-4 py-3 text-xs">Drag with particles</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-xs font-medium">Visual Feedback</td>
                  <td className="px-4 py-3 text-xs">Tap scale animation</td>
                  <td className="px-4 py-3 text-xs">Grab/grabbing cursor</td>
                  <td className="px-4 py-3 text-xs">Particle trail effect</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-xs font-medium">Performance</td>
                  <td className="px-4 py-3 text-xs">Lightweight</td>
                  <td className="px-4 py-3 text-xs">Lightweight</td>
                  <td className="px-4 py-3 text-xs">GPU-optimized particles</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-xs font-medium">Mobile Touch</td>
                  <td className="px-4 py-3 text-xs">✓ Works</td>
                  <td className="px-4 py-3 text-xs">✓ Works</td>
                  <td className="px-4 py-3 text-xs">✓ Works</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-xs font-medium">Customizable</td>
                  <td className="px-4 py-3 text-xs">Base component</td>
                  <td className="px-4 py-3 text-xs">dragThreshold prop</td>
                  <td className="px-4 py-3 text-xs">threshold + showTrail</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="mt-16 scroll-mt-24">
          <h2 className="text-xl font-semibold tracking-tight mb-4">Implementation</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3">Installation</h3>
              <div className="bg-card rounded-lg border border-border p-4 font-mono text-xs">
                <code className="text-muted-foreground">
                  npm install motion react-hook-form
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Import Components</h3>
              <pre className="bg-card rounded-lg border border-border p-4 overflow-x-auto">
                <code className="text-xs text-muted-foreground">{`import Spotify from "@/components/spotify/Spotify";
import SpotifyDraggable from "@/components/spotify/SpotifyDraggable";
import SpotifyTrail from "@/components/spotify/SpotifyTrail";

// Use any version
<SpotifyDraggable 
  discordId="707371655380664321"
  dragThreshold={25}
/>

<SpotifyTrail
  discordId="707371655380664321"
  dragThreshold={25}
  showTrail={true}
/>`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Key Props</h3>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 font-medium">Prop</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Default</th>
                      <th className="px-3 py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="px-3 py-2 font-mono">discordId</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">string</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">—</td>
                      <td className="px-3 py-2 text-muted-foreground">Discord ID for Lanyard</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-3 py-2 font-mono">dragThreshold</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">number</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">25</td>
                      <td className="px-3 py-2 text-muted-foreground">Pixels to drag before opening</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-3 py-2 font-mono">showTrail</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">boolean</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">true</td>
                      <td className="px-3 py-2 text-muted-foreground">Show particle trail (TrailComponent only)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-16 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>
            All three components use the same Motion spring animation and Spotify styling.
            Choose the interaction pattern that best fits your UX.
          </p>
        </footer>
      </main>
    </div>
  );
}
