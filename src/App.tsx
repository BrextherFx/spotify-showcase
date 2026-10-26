import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { AccordionPage } from './pages/AccordionPage';
import { VinylLyricsPage } from './pages/VinylLyricsPage';
import { TypewriterPage } from './pages/TypewriterPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    // Intercept client-side navigation clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (
        target &&
        target.href &&
        target.origin === window.location.origin &&
        !target.getAttribute('download') &&
        target.target !== '_blank'
      ) {
        const path = target.pathname;
        e.preventDefault();
        window.history.pushState({}, '', path);
        setCurrentPath(path);
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleLinkClick);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  // Update dynamic SEO title and meta description per route
  useEffect(() => {
    let title = 'Key UI — A library of interactive UI with full source code';
    let desc = 'A library of interactive, living web interfaces with procedural audio synthesis, physics, WebGL depth displacement, and full source code.';

    if (currentPath === '/play/accordion') {
      title = 'Key UI — Accordion FAQ';
      desc = 'An FAQ that plays like a red pearl accordion, each open answer is a reed note and three open make a chord.';
    } else if (currentPath === '/play/vinyl-lyrics') {
      title = 'Key UI — Vinyl Lyrics';
      desc = 'A record that plays a song Claude Code wrote, every note lights up in time and you can scratch it.';
    } else if (currentPath === '/play/typewriter') {
      title = 'Key UI — Typewriter Test';
      desc = 'A typing speed test on a real typewriter, the carriage slides, the bell rings at every line and typos stay on paper.';
    } else if (currentPath === '/404') {
      title = 'Key UI — This Page Sank (404)';
      desc = 'Interactive physics water sandbox with floating submerged digits you can fish out and toss back in.';
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    }
  }, [currentPath]);

  // Route matching
  switch (currentPath) {
    case '/':
      return <HomePage />;
    case '/play/accordion':
      return <AccordionPage />;
    case '/play/vinyl-lyrics':
      return <VinylLyricsPage />;
    case '/play/typewriter':
      return <TypewriterPage />;
    case '/404':
      return <NotFoundPage />;
    default:
      return <NotFoundPage />;
  }
};
