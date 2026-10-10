'use client';
import { useEffect, useState } from 'react';
type Status = { state: 'online' | 'offline' | 'unknown'; players: number | null; max: number | null };
export function ServerStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => {
    let active = true; const controller = new AbortController();
    async function refresh() {
      if (document.hidden) return;
      try { const response = await fetch('/api/server-status', { signal: controller.signal }); if (!response.ok) throw new Error(); const data = await response.json(); if (active) setStatus(data); }
      catch { if (active) setStatus({ state: 'unknown', players: null, max: null }); }
    }
    refresh(); const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return <span className={`live-server-status ${compact ? 'compact-status' : ''} state-${status?.state || 'loading'}`} aria-live="polite"><i className="status-dot"/>{!status ? 'Checking server…' : status.state === 'online' ? <><b>{status.players?.toLocaleString()}</b> {compact ? 'online' : `player${status.players === 1 ? '' : 's'} online`}</> : status.state === 'offline' ? 'Server offline' : 'Status unavailable'}</span>;
}
