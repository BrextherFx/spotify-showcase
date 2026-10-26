import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { WaitlistModal } from '../components/WaitlistModal';
import { AquariumCanvas } from '../components/aquarium/AquariumCanvas';

export const NotFoundPage: React.FC = () => {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [audioState, setAudioState] = useState<'idle' | 'on' | 'off'>(() => {
    try {
      const val = window.localStorage.getItem('livingui-sea-sound');
      if (val === 'on') return 'on';
      if (val === 'off') return 'off';
    } catch {}
    return 'idle';
  });

  const isAudioOn = audioState === 'on';

  const handleToggleAudio = () => {
    const next = audioState === 'on' ? 'off' : 'on';
    try {
      window.localStorage.setItem('livingui-sea-sound', next);
    } catch {}
    if (typeof window !== 'undefined' && (window as any).__aquariumAudio) {
      const audio = (window as any).__aquariumAudio;
      audio.mute(next === 'off');
      if (next === 'off') {
        setAudioState('off');
      } else {
        audio.start().then((ok: boolean) => setAudioState(ok ? 'on' : 'off'));
      }
    } else {
      setAudioState(next);
    }
  };

  return (
    <div className="flex h-dvh w-full flex-col font-sans overflow-hidden select-none bg-[#08080a] text-text">
      {/* Authentic Living UI Header */}
      <Header onOpenWaitlist={() => setIsWaitlistOpen(true)} currentPath="/404" />

      {/* Main Aquarium Scene */}
      <div className="flex-1 overflow-x-clip relative">
        <main data-scene="true" className="relative -mt-16 h-dvh min-h-[560px] overflow-hidden">
          {/* Authentic 2D FLIP Fluid Canvas with Digits, Kelp, Fishes, Crabs & Sunbeams */}
          <AquariumCanvas isAudioOn={isAudioOn} onAudioChange={(active) => setAudioState(active ? "on" : "off")} />

          {/* Bottom Right "Hear the water" / "Mute the water" Pill Button */}
          <button
            type="button"
            onClick={handleToggleAudio}
            aria-pressed={isAudioOn}
            className="btn-sm button-quiet absolute bottom-6 right-6 z-20 md:bottom-8 md:right-8 group shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <span className="relative flex items-center gap-2 text-[13px] text-text/80 font-medium">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-muted">
                <path d="M2.5 6h2l3-2.5v9L4.5 10h-2z" fill="currentColor" />
                {isAudioOn ? (
                  <path
                    d="M10.5 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6.3 6.3 0 0 1 0 9"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M10.5 6l3.5 4M14 6l-3.5 4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <span>{isAudioOn ? 'Mute the water' : 'Hear the water'}</span>
            </span>
          </button>

          {/* Top Center Sunk Headline */}
          <div className="pointer-events-none relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 pt-[18vh] text-center">
            <h1 className="section-title">This page sank</h1>
            <p className="section-lead">
              <span className="pointer-coarse:hidden">
                Give the window a shake to stir the water, or fish a digit out and toss it back in
              </span>
              <span className="hidden pointer-coarse:inline">
                Tilt or shake your phone to stir the water, or fish a digit out and toss it back in
              </span>
            </p>
          </div>
        </main>
      </div>

      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
    </div>
  );
};
