'use client';
import { useEffect, type RefObject } from 'react';

// Animate only navigation changes, preserving models during basket/quantity updates.
export function usePageTransition(ref: RefObject<HTMLElement | null>, page: string, paused: boolean) {
  useEffect(() => {
    const node = ref.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (!node || paused || reduced.matches) return;
    const animation = node.animate([
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 240, easing: 'cubic-bezier(.22,1,.36,1)' });
    const stop = () => { if (reduced.matches) animation.cancel(); };
    reduced.addEventListener('change', stop);
    return () => { animation.cancel(); reduced.removeEventListener('change', stop); };
  }, [ref, page, paused]);
}
