'use client';
import { useEffect, useRef } from 'react';
import { storeConfig } from '@/lib/config';

const motes = [[3,46,3,22,-9],[7,23,2,18,-4],[11,9,3,23,-14],[13,78,2,20,-8],[17,62,3,21,-11],[21,37,2,17,-5],[26,15,3,17,-7],[29,55,2,24,-16],[33,28,3,21,-10],[35,75,2,22,-3],[40,8,2,23,-8],[44,37,3,19,-15],[47,63,2,24,-17],[52,12,3,23,-9],[55,48,2,20,-13],[58,29,2,18,-5],[61,66,3,20,-6],[64,6,2,23,-11],[68,26,3,24,-17],[72,72,2,19,-4],[76,49,3,18,-12],[80,31,2,21,-8],[84,14,3,21,-2],[87,58,2,20,-10],[91,72,3,23,-14],[94,10,2,18,-7],[96,35,3,20,-8],[99,63,2,22,-15]];

export function SkyBackground({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    function update() {
      frame = 0;
      if (!node) return;
      const progress = Math.min(Math.max(window.scrollY, 0) / 1400, 1);
      node.style.transform = `scale(${paused || reduced.matches ? 1 : 1 + progress * .04})`;
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reduced.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reduced.removeEventListener('change', schedule);
    };
  }, [paused]);
  return <><div className="sky-background" ref={ref} style={{ backgroundImage: `linear-gradient(180deg,#070e189e,#080d16c9),url(${JSON.stringify(storeConfig.background)})` }} aria-hidden="true"/><div className="sky-particles" aria-hidden="true" data-paused={paused}>{motes.map(([x,y,size,duration,delay],i)=><i key={i} style={{left:`${x}%`,top:`${y}%`,width:size,height:size,animationDuration:`${duration}s`,animationDelay:`${delay}s`}}/>)}</div></>;
}
