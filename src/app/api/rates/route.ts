import { NextResponse } from 'next/server';
import { CURRENCIES, type Rates } from '@/lib/currency';
export const dynamic = 'force-dynamic';

// Daily ECB reference rates via Frankfurter (no key, no account). Cached in memory for six hours;
// the last good answer is served if the upstream is down.
const cache = new Map<string, { at: number; rates: Rates }>();
const TTL = 6 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const base = new URL(request.url).searchParams.get('base') || 'USD';
  if (!/^[A-Z]{3}$/.test(base)) return NextResponse.json({ error: 'Invalid base currency.' }, { status: 400 });
  const cached = cache.get(base);
  if (cached && Date.now() - cached.at < TTL) return NextResponse.json(cached.rates, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  try {
    const symbols = CURRENCIES.map(c => c.code).filter(code => code !== base).join(',');
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${symbols}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Rates unavailable (${response.status})`);
    const data = await response.json() as { base: string; date: string; rates: Record<string, number> };
    if (data.base !== base || !data.rates || typeof data.rates !== 'object') throw new Error('Unexpected rates payload');
    const rates: Rates = { base, date: String(data.date), rates: Object.fromEntries(Object.entries(data.rates).filter(([, v]) => Number.isFinite(v))) as Record<string, number> };
    cache.set(base, { at: Date.now(), rates });
    return NextResponse.json(rates, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    if (cached) return NextResponse.json(cached.rates, { headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json({ base, date: '', rates: {} } satisfies Rates, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
