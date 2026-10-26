import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { WaitlistModal } from '../components/WaitlistModal';
import { McpModal } from '../components/mcp/McpModal';
import { sound } from '../audio/soundEngine';
import { ChevronDown, Sparkles, Music2, Volume2 } from 'lucide-react';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  note: string;
  freq: number;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 0,
    question: 'Can I try before I buy?',
    answer: 'You get 14 days with every feature unlocked and no card needed, plus one reminder before it ends.',
    note: 'C4',
    freq: 261.63,
  },
  {
    id: 1,
    question: 'Can I cancel at any time?',
    answer: 'Yes, in two clicks from your settings, with no calls and no sad goodbye emails.',
    note: 'E4',
    freq: 329.63,
  },
  {
    id: 2,
    question: 'Do you offer refunds?',
    answer: "If it's not working for you in the first 30 days, we refund the full amount.",
    note: 'G4',
    freq: 392.0,
  },
  {
    id: 3,
    question: 'Can I change my plan later?',
    answer: 'Upgrade or downgrade whenever you like and we prorate the difference down to the day.',
    note: 'A4',
    freq: 440.0,
  },
  {
    id: 4,
    question: 'Is my data secure?',
    answer: 'Everything is encrypted at rest and in transit, and we never sell or share it.',
    note: 'C5',
    freq: 523.25,
  },
];

// Red pearl shader canvas for Italian accordion casing
const PearlCanvas: React.FC<{ height: number }> = ({ height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    canvas.height = height;

    // Procedural Italian Red Pearl finish with shimmering celluloid veins
    let time = 0;
    let animId: number;

    const render = () => {
      time += 0.015;
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#570810');
      grad.addColorStop(0.3, '#9e1220');
      grad.addColorStop(0.6, '#b51928');
      grad.addColorStop(0.85, '#e03a4b');
      grad.addColorStop(1, '#660b14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Vein marbling simulation
      ctx.save();
      ctx.globalAlpha = 0.22;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        const yOff = (i * 24 + Math.sin(time + i) * 12) % height;
        ctx.moveTo(0, yOff);
        for (let x = 0; x < width; x += 40) {
          ctx.quadraticCurveTo(
            x + 20,
            yOff + Math.sin(x * 0.02 + time * 1.5 + i) * 14,
            x + 40,
            yOff
          );
        }
        ctx.strokeStyle = i % 2 === 0 ? '#ff8090' : '#ffa8b4';
        ctx.lineWidth = 14;
        ctx.filter = 'blur(6px)';
        ctx.stroke();
      }
      ctx.restore();

      // Top bevel highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(0, 0, width, 2);

      // Bottom shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, height - 3, width, 3);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [height]);

  return <canvas ref={canvasRef} className="w-full h-full block rounded-xl overflow-hidden" />;
};

export const AccordionPage: React.FC = () => {
  const [openItems, setOpenItems] = useState<boolean[]>([false, false, false, false, false]);
  const [detectedChord, setDetectedChord] = useState<string | null>(null);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isMcpOpen, setIsMcpOpen] = useState(false);

  // Detect chords when 3 or more items are opened
  useEffect(() => {
    const activeIndices = openItems
      .map((isOpen, idx) => (isOpen ? idx : -1))
      .filter((idx) => idx !== -1);

    if (activeIndices.length >= 3) {
      const activeNotes = activeIndices.map((i) => FAQ_ITEMS[i].note);
      // Check chord combinations
      if (activeNotes.includes('C4') && activeNotes.includes('E4') && activeNotes.includes('G4')) {
        setDetectedChord('C Major Triad');
      } else if (activeNotes.includes('A4') && activeNotes.includes('C4') && activeNotes.includes('E4')) {
        setDetectedChord('A Minor Triad');
      } else if (activeNotes.includes('C4') && activeNotes.includes('E4') && activeNotes.includes('A4')) {
        setDetectedChord('A Minor / C');
      } else if (activeNotes.includes('C4') && activeNotes.includes('G4') && activeNotes.includes('A4')) {
        setDetectedChord('C Suspended 6');
      } else if (activeNotes.includes('E4') && activeNotes.includes('G4') && activeNotes.includes('C5')) {
        setDetectedChord('C Major 1st Inversion');
      } else {
        setDetectedChord('Accordion Harmony');
      }
    } else {
      setDetectedChord(null);
    }
  }, [openItems]);

  const toggleItem = async (index: number) => {
    await sound.init();
    sound.knock(0.4, 0);

    const willOpen = !openItems[index];

    // Accordion mechanical breath sound
    sound.accordionBreathe(willOpen ? 35 : 20);

    // Trigger procedural accordion reed sound
    sound.accordionReed(index, FAQ_ITEMS[index].freq, willOpen);

    setOpenItems((prev) => {
      const next = [...prev];
      next[index] = willOpen;
      return next;
    });
  };

  // Keyboard shortcut support (1-5 keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 5 && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleItem(num - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openItems]);

  const openCount = openItems.filter(Boolean).length;
  // Bellows spring distance increases dynamically with open answers
  const bellowsGap = Math.max(12, 12 + openCount * 8);

  return (
    <div className="min-h-screen bg-[#0d0c0a] text-text flex flex-col justify-between selection:bg-red-500/30">
      {/* Header */}
      <Header
        onOpenWaitlist={() => setIsWaitlistOpen(true)}
        onOpenMcp={() => setIsMcpOpen(true)}
        currentPath="/play/accordion"
      />

      {/* Main Accordion Showcase Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-28 pb-16 max-w-4xl mx-auto w-full">
        {/* Title & Subtitle */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium mb-3">
            <Music2 className="w-3.5 h-3.5" />
            <span>Interactive Red Pearl Accordion</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-3">
            Frequently asked questions
          </h1>
          <p className="text-sm sm:text-base text-text/70 max-w-lg mx-auto">
            The questions we hear the most, now you can hear them too. Press <span className="font-mono text-white/90 bg-white/10 px-1.5 py-0.5 rounded text-xs">1</span> to <span className="font-mono text-white/90 bg-white/10 px-1.5 py-0.5 rounded text-xs">5</span> or click.
          </p>
        </div>

        {/* Live Chord Indicator */}
        <div className="h-9 mb-4 flex items-center justify-center">
          {detectedChord ? (
            <div className="animate-pop flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600/30 to-amber-500/30 border border-red-500/40 text-white font-medium text-xs shadow-lg shadow-red-500/20">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>Harmonious Chord: <strong>{detectedChord}</strong></span>
            </div>
          ) : (
            <div className="text-xs text-text/40 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Open 3 questions to strike a harmonic chord</span>
            </div>
          )}
        </div>

        {/* Accordion Instrument Wrapper */}
        <div className="w-full max-w-2xl bg-[#171412] p-4 sm:p-6 rounded-3xl border border-white/[0.1] shadow-2xl shadow-black relative overflow-hidden">
          {/* Top Red Pearl Casing */}
          <div className="w-full h-10 mb-4 shadow-md overflow-hidden rounded-xl">
            <PearlCanvas height={40} />
          </div>

          {/* Accordion Bellows Chamber */}
          <div
            className="flex flex-col transition-all duration-300 ease-out"
            style={{ gap: `${bellowsGap}px` }}
          >
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openItems[idx];
              return (
                <div
                  key={item.id}
                  className={`relative rounded-2xl transition-all duration-300 border ${
                    isOpen
                      ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.04] border-red-500/40 shadow-lg shadow-red-950/40'
                      : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  {/* Bellows Fold Indicator Line */}
                  <div
                    className={`absolute -top-[2px] left-4 right-4 h-[1px] transition-opacity ${
                      isOpen ? 'bg-gradient-to-r from-transparent via-red-400/60 to-transparent' : 'opacity-0'
                    }`}
                  />

                  {/* Question Button / Reed Key */}
                  <button
                    onClick={() => toggleItem(idx)}
                    type="button"
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                          isOpen
                            ? 'bg-red-500 text-white shadow-md shadow-red-500/40 scale-105'
                            : 'bg-white/[0.06] text-text/70'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-[15px] sm:text-base font-medium text-white/90">
                        {item.question}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.05] text-text/50">
                        {item.note}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-text/60 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-red-400' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Answer Panel */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-[14px] text-text/80 leading-relaxed animate-fade-in border-t border-white/[0.04] mt-1">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Red Pearl Casing */}
          <div className="w-full h-8 mt-4 shadow-md overflow-hidden rounded-xl">
            <PearlCanvas height={32} />
          </div>
        </div>

        {/* Bottom Product CTA (exact from living-ui.dev) */}
        <div className="mt-14 text-center max-w-md mx-auto p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
          <p className="text-base font-semibold text-white mb-1.5">
            Want this in your product?
          </p>
          <p className="text-xs text-text/65 mb-4 leading-relaxed">
            It's one of the living interfaces from Key UI. Join the waitlist and the Landing book concept is yours for free.
          </p>
          <button
            onClick={() => {
              sound.knock(0.5, 0);
              setIsWaitlistOpen(true);
            }}
            className="button-cream btn-sm px-6 py-2.5 text-sm shadow-md"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-ink" />
            <span>Join the waitlist</span>
          </button>
        </div>
      </main>

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />

      <McpModal
        isOpen={isMcpOpen}
        onClose={() => setIsMcpOpen(false)}
      />
    </div>
  );
};
