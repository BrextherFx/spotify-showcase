import React, { useState } from 'react';
import { X, Check, ArrowRight } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'email' | 'handle' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    sound.pop(1.4);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('handle');
      sound.splash(0.5);
    }, 400);
  };

  const handleHandleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.pop(1.6);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('done');
      sound.knock(0.8, 0);
    }, 400);
  };

  const handleClose = () => {
    sound.knock(0.3, 0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#121110] border border-white/[0.12] shadow-2xl shadow-black/80">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-text/60 hover:text-white rounded-full bg-white/[0.04] hover:bg-white/[0.1] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'email' && (
          <div className="animate-pop">
            <div className="w-12 h-12 mb-4 rounded-2xl bg-ember/15 border border-ember/30 flex items-center justify-center text-ember shadow-inner">
              <span className="font-pixel text-xl">✦</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
              Join the waitlist
            </h3>
            <p className="text-[15px] text-text/70 mb-6 leading-relaxed">
              We will notify you the moment Key UI goes live. You will get immediate access to all source components and AI agent guides.
            </p>

            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="pill-field flex items-center rounded-full p-1.5 px-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 text-[15px] text-white placeholder-text/40 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="button-cream btn-sm px-5 py-2 whitespace-nowrap text-[14px]"
                >
                  {loading ? 'Joining...' : 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-1.5 text-ink" />
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'handle' && (
          <div className="animate-pop">
            <div className="w-12 h-12 mb-4 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shadow-inner">
              <span className="font-pixel text-xl">@</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
              Got it!
            </h3>
            <p className="text-[15px] text-text/70 mb-6 leading-relaxed">
              Want to leave your X handle so we can connect or feature your builds?
            </p>

            <form onSubmit={handleHandleSubmit} className="space-y-3">
              <div className="pill-field flex items-center rounded-full p-1.5 px-3">
                <span className="text-text/40 pl-2 font-mono">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-transparent px-2 py-2 text-[15px] text-white placeholder-text/40 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="button-cream btn-sm px-5 py-2 whitespace-nowrap text-[14px]"
                >
                  {loading ? 'Saving...' : 'Submit'}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('done')}
                  className="text-xs text-text/50 hover:text-text/80 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'done' && (
          <div className="animate-pop text-center py-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
              You are on the list!
            </h3>
            <p className="text-[15px] text-text/70 mb-6 max-w-xs mx-auto">
              Thanks! See you on X and in your inbox when we open the doors.
            </p>
            <button
              onClick={handleClose}
              className="button-quiet btn-sm px-6 py-2.5 text-[14px]"
            >
              Back to components
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
