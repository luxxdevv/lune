'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export function Modal({ title, onClose, children, drawer = false }: { title: string; onClose: () => void; children: React.ReactNode; drawer?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusables = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], select, [tabindex="0"]') || []);
    focusables()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab') {
        const items = focusables(); const first = items[0]; const last = items.at(-1);
        if (!items.length) { e.preventDefault(); return; }
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  return <div className={`modal-overlay ${drawer ? 'drawer-overlay' : ''}`} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={`modal ${drawer ? 'cart-drawer' : ''}`} ref={ref} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20}/></button></div>
      {children}
    </div>
  </div>;
}
