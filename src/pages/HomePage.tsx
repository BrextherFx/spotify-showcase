import React, { useState, useMemo } from 'react';
import { ParallaxClouds } from '../components/ParallaxClouds';
import { ShootingStarCanvas } from '../components/ShootingStarCanvas';
import { FlameBorderCanvas } from '../components/FlameBorderCanvas';
import { Header } from '../components/Header';
import { WaitlistModal } from '../components/WaitlistModal';
import { McpModal } from '../components/mcp/McpModal';
import { sound } from '../audio/soundEngine';

export const HomePage: React.FC = () => {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Generate 90 subtle core star dots across the night sky (from living-ui.dev)
  const starDots = useMemo(() => {
    return Array.from({ length: 90 }, (_, i) => {
      const left = ((i * 37.3 + 13.7) % 96) + 2;
      const top = ((i * 53.1 + 7.9) % 50) + 2;
      const size = 1.0 + ((i * 19.3) % 1.2);
      const opacity = 0.14 + ((i * 29.7) % 0.3);
      return { id: i, left: `${left}%`, top: `${top}%`, size, opacity };
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    sound.init();
    sound.splash(0.7);
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen bg-[#08080a] text-text flex flex-col justify-between overflow-hidden selection:bg-ember/30 font-sans">
      {/* 1. Dot Design Grid (.dot-field) with Hole Cutout */}
      <div
        className="dot-field pointer-events-none absolute inset-0 z-0 opacity-90"
        style={{
          maskImage:
            'radial-gradient(540px 320px at 50% 32vh, transparent 55%, black), linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, black 14%, black 80%, rgba(0, 0, 0, 0.3) 100%)',
          WebkitMaskImage:
            'radial-gradient(540px 320px at 50% 32vh, transparent 55%, black), linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, black 14%, black 80%, rgba(0, 0, 0, 0.3) 100%)',
        }}
      />

      {/* 2. Scattered Twinkling Core Stars */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {starDots.map((star) => (
          <span
            key={star.id}
            aria-hidden="true"
            className="absolute rounded-full bg-[#fff4e4]"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* 3. Shooting Star & Meteor Canvas */}
      <ShootingStarCanvas />

      {/* 4. Golden Sunset Cloud Ocean (Pinned to Bottom 48vh) */}
      <ParallaxClouds />

      {/* 5. Header */}
      <Header
        onOpenWaitlist={() => setIsWaitlistOpen(true)}
        onOpenMcp={() => setIsMcpOpen(true)}
        currentPath="/"
      />

      {/* 6. Center Hero Section (Matching Screenshot 2 Exactly) */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-start px-6 pt-[18vh] md:pt-[15vh] text-center max-w-4xl mx-auto w-full select-none">
        {/* Headline with authentic sans-serif Inter Tight & .glow-text */}
        <h1 className="relative text-[46px] md:text-[88px] font-medium leading-[1.04] text-[#efe9de] tracking-tight">
          A library of
          <br />
          <span className="glow-text mr-3 md:mr-4" data-glow="living">
            living
          </span>
          interfaces
        </h1>

        {/* Waitlist Form with Flame Aura (Pill Wrapped Tightly) */}
        <div className="w-full max-w-md relative mt-8 md:mt-10">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
              {/* Pill Container with Sibling Flame Canvas */}
              <div className="relative w-full">
                {/* Flame Plasma Canvas strictly hugging this 52px pill */}
                <FlameBorderCanvas />

                {/* Pill Field */}
                <div className="flow-border relative isolate flex items-center w-full rounded-[28px] p-1 shadow-2xl transition-all">
                  <input
                    type="email"
                    required
                    placeholder="you@studio.com"
                    aria-label="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => sound.init()}
                    className="min-w-0 flex-1 bg-transparent px-4 text-[15px] text-[#efe9de] outline-none placeholder:text-[#efe9de]/35 font-normal"
                  />

                  <button
                    type="submit"
                    onClick={() => sound.init()}
                    className="button-cream shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold text-ink shadow-md hover:scale-[1.02] active:scale-95 transition-transform"
                  >
                    Join the waitlist
                  </button>
                </div>
              </div>

              {/* Subtitle Notification text cleanly below the pill */}
              <p className="mt-3 text-[15px] tracking-[0.04em] text-[#efe9de]/65 font-normal">
                We will notify you when we go live
              </p>
            </form>
          ) : (
            <div className="animate-pop p-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium shadow-xl backdrop-blur-md">
              ✦ You're in! We will notify you when we go live.
            </div>
          )}
        </div>
      </main>

      {/* 7. Bottom Navigation Floating Directly Over the Clouds */}
      <nav
        aria-label="Live concepts"
        className="absolute inset-x-0 bottom-[3.5vh] md:bottom-[5vh] z-20 flex flex-col items-center gap-3 px-4 pointer-events-auto"
      >
        <span className="text-xs tracking-[0.05em] text-[#efe9de]/65 font-normal">
          Or play with what's already live
        </span>

        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-full">
          {/* Accordion FAQ */}
          <a
            href="/play/accordion"
            onClick={() => sound.knock(0.35, -0.3)}
            className="nav-pill flex items-center gap-2 h-9 sm:h-11 px-4 sm:px-5 rounded-full text-[13.5px] md:text-[15px] font-medium whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 md:w-[17px] md:h-[17px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 12h20M6 12v4M10 12v4M14 12v4M18 12v4" />
            </svg>
            <span>Accordion FAQ</span>
          </a>

          {/* Vinyl lyrics */}
          <a
            href="/play/vinyl-lyrics"
            onClick={() => sound.knock(0.35, -0.1)}
            className="nav-pill flex items-center gap-2 h-9 sm:h-11 px-4 sm:px-5 rounded-full text-[13.5px] md:text-[15px] font-medium whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 md:w-[17px] md:h-[17px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5.5l11-2V16" />
              <circle cx="6.5" cy="18" r="2.5" />
              <circle cx="17.5" cy="16" r="2.5" />
            </svg>
            <span>Vinyl lyrics</span>
          </a>

          {/* Typewriter test */}
          <a
            href="/play/typewriter"
            onClick={() => sound.knock(0.35, 0.2)}
            className="nav-pill flex items-center gap-2 h-9 sm:h-11 px-4 sm:px-5 rounded-full text-[13.5px] md:text-[15px] font-medium whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 md:w-[17px] md:h-[17px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="4" width="16" height="12" rx="2" />
              <path d="M8 8h8M8 12h8M6 16v2h12v-2M10 20h4" />
            </svg>
            <span>Typewriter test</span>
          </a>

          {/* 404 */}
          <a
            href="/404"
            onClick={() => sound.splash(0.4, 0.3)}
            className="nav-pill flex items-center gap-2 h-9 sm:h-11 px-4 sm:px-5 rounded-full text-[13.5px] md:text-[15px] font-medium whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 md:w-[17px] md:h-[17px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 9c1.7 0 1.7-1.5 3.3-1.5S7 9 8.7 9s1.6-1.5 3.3-1.5S13.7 9 15.3 9 17 7.5 18.7 7.5 20.3 9 22 9" />
              <path d="M2 15c1.7 0 1.7-1.5 3.3-1.5S7 15 8.7 15s1.6-1.5 3.3-1.5 1.7 1.5 3.3 1.5 1.7-1.5 3.4-1.5S20.3 15 22 15" />
            </svg>
            <span>404</span>
          </a>
        </div>
      </nav>

      {/* Waitlist Modal */}
      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />

      {/* MCP Modal */}
      <McpModal
        isOpen={isMcpOpen}
        onClose={() => setIsMcpOpen(false)}
      />
    </div>
  );
};
