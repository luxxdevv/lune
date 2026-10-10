import { NextResponse } from 'next/server';
import { isIP } from 'node:net';
import { checkOrigin } from '@/lib/checkout';
import { PluginError, tebexPlugin } from '@/lib/tebex-plugin';
import { giftcardBalance, giftcardCode } from '@/lib/giftcard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const attempts = new Map<string, { count: number; expires: number }>();
const headers = { 'Cache-Control': 'private, no-store' };
function fail(error: string, status: number) { return NextResponse.json({ error }, { status, headers }); }

export async function POST(request: Request) {
  try { checkOrigin(request); } catch { return fail('Open the store to check your gift card.', 403); }
  if (!request.headers.get('content-type')?.includes('application/json')) return fail('Expected a JSON request.', 415);
  const ipHeader = process.env.TRUSTED_IP_HEADER;
  const local = ['localhost', '127.0.0.1'].includes(new URL(process.env.STORE_URL || 'http://localhost:3100').hostname);
  const ip = local ? 'local' : ipHeader ? request.headers.get(ipHeader)?.split(',')[0]?.trim() || '' : '';
  if (!local && !isIP(ip)) return fail('The balance checker is temporarily unavailable.', 503);
  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  const attempt = attempts.get(ip) || { count: 0, expires: now + 60_000 };
  if (attempt.count >= 8 || (!attempts.has(ip) && attempts.size >= 5000)) return fail('Please wait a minute before checking another gift card.', 429);
  attempt.count++; attempts.set(ip, attempt);
  let code: string;
  try {
    if (Number(request.headers.get('content-length')) > 256) return fail('Enter a valid gift card number.', 400);
    const text = await request.text();
    if (text.length > 256) return fail('Enter a valid gift card number.', 400);
    code = giftcardCode(JSON.parse(text)?.code);
  } catch { return fail('Enter a valid gift card number.', 400); }
  try {
    const balance = giftcardBalance(await tebexPlugin(`/gift-cards/lookup/${encodeURIComponent(code)}`));
    if (!balance) return fail('This gift card is no longer active.', 404);
    return NextResponse.json(balance, { headers });
  } catch (error) {
    if (error instanceof PluginError && error.status === 404) return fail('Gift card not found. Check the number and try again.', 404);
    if (error instanceof PluginError && error.status === 429) return fail('Please wait a minute and try again.', 429);
    return fail('The balance checker is temporarily unavailable. Please try again shortly.', 503);
  }
}
