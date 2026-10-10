'use client';

import { useEffect, useRef } from 'react';
import type { ItemModelName, ItemModelOptions } from '@/lib/item-models';

// Textured 3D items turn gently; characters can explicitly keep a stationary pose.
export function ItemModel({ name, label = '', seed = 0, glint, motion = 'sway', facing = 'left', skinUrl, fallbackSrc }: { name: ItemModelName; label?: string; seed?: number; glint?: string; motion?: ItemModelOptions['motion']; facing?: ItemModelOptions['facing']; skinUrl?: string; fallbackSrc?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let disposed = false, detach: (() => void) | undefined;
    void import('@/lib/item-renderer').then(({ registerItem }) => {
      if (disposed || !ref.current) return;
      const canvas = ref.current;
      detach = registerItem(canvas, name, (Math.abs(seed) % 7) * .09, () => canvas.parentElement?.classList.add('model-ready'), { glint, motion, facing, skinUrl });
    }).catch(() => { /* Keep the unanimated fallback when WebGL is unavailable. */ });
    const canvas = ref.current;
    return () => { disposed = true; detach?.(); canvas?.parentElement?.classList.remove('model-ready'); };
  }, [name, seed, glint, motion, facing, skinUrl]);
  const render = fallbackSrc || `/assets/render/${name}${facing === 'right' ? '-right' : ''}.svg`;
  return <span className="item-model" data-model={name} data-glint={glint} style={glint ? { '--glint': glint } as React.CSSProperties : undefined} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
    <img className="item-render model-fallback" src={render} alt="" width="96" height="96"/>
    {glint && <span className="fx-glint model-fallback" style={{ '--m': `url(${render})` } as React.CSSProperties} aria-hidden="true"/>}
    <canvas ref={ref} className="model-canvas" width="192" height="192" aria-hidden="true"/>
  </span>;
}
