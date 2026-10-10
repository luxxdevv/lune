import { NextResponse } from 'next/server';
import { storeConfig } from '@/lib/config';
export async function GET() {
  if (storeConfig.serverAddress.endsWith('.example')) return NextResponse.json({ state: 'unknown', players: null, max: null });
  try {
    const response = await fetch(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(storeConfig.serverAddress)}`, { next: { revalidate: 30 }, signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error('Status provider unavailable');
    const data = await response.json();
    if (typeof data.online !== 'boolean' || (data.online && !Number.isInteger(data.players?.online))) throw new Error('Invalid status');
    return NextResponse.json({ state: data.online ? 'online' : 'offline', players: data.online ? data.players.online : 0, max: data.players?.max ?? null, checkedAt: data.retrieved_at || Date.now() }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' } });
  } catch { return NextResponse.json({ state: 'unknown', players: null, max: null }, { headers: { 'Cache-Control': 'no-store' } }); }
}
