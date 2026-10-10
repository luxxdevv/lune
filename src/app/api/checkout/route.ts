import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { accountPath, configured, getCatalog, StoreError, tebex, type Basket } from '@/lib/tebex';
import { authorizationUrl, checkOrigin, customerIp, finishCheckout, publicOrigin, readSession, sessionSecret, signSession, validateInput, type CheckoutSession } from '@/lib/checkout';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const COOKIE = 'server-template-checkout';
function fail(e: unknown) { return NextResponse.json({ error: e instanceof StoreError ? e.message : 'Checkout could not be completed. Please try again.' }, { status: e instanceof StoreError ? e.status : 500, headers: { 'Cache-Control': 'no-store' } }); }
function response(body: unknown) { return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } }); }
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!configured()) throw new StoreError('This is a preview store. Live payments will be available once Tebex is connected.', 503);
    sessionSecret();
    if (!request.headers.get('content-type')?.includes('application/json')) throw new StoreError('Expected a JSON checkout request.', 415);
    const text = await request.text();
    if (Buffer.byteLength(text) > 8192) throw new StoreError('The checkout request is too large.', 413);
    let body;
    try { body = JSON.parse(text); } catch { throw new StoreError('Invalid checkout request.'); }
    if (!body || typeof body !== 'object') throw new StoreError('Invalid checkout request.');
    const jar = await cookies();
    if (body.action === 'resume') {
      const session = readSession(jar.get(COOKIE)?.value);
      if (!session) throw new StoreError('Your checkout session has expired. Start checkout again from your basket.', 401);
      return response({ url: await finishCheckout(session) });
    }
    if (body.action !== 'create') throw new StoreError('Invalid checkout action.');
    const input = validateInput(body, await getCatalog());
    const origin = publicOrigin();
    const basket = await tebex<Basket>(accountPath('/baskets'), 'POST', {
      username: input.username, ip_address: customerIp(request),
      complete_url: `${origin}/?checkout=complete`, cancel_url: `${origin}/?checkout=cancelled`,
      complete_auto_redirect: true,
    });
    if (!basket.ident || !/^[a-zA-Z0-9-]{10,150}$/.test(basket.ident)) throw new StoreError('Tebex could not create your basket.', 502);
    const session: CheckoutSession = { ...input, ident: basket.ident, expires: Date.now() + 2 * 60 * 60 * 1000 };
    jar.set(COOKIE, signSession(session), { httpOnly: true, secure: origin.startsWith('https:'), sameSite: 'lax', maxAge: 7200, path: '/' });
    const auth = await tebex<{ name: string; url: string }[]>(accountPath(`/baskets/${basket.ident}/auth?returnUrl=${encodeURIComponent(`${origin}/?checkout=resume`)}`));
    const authUrl = authorizationUrl(auth);
    if (authUrl) return response({ url: authUrl, authorization: true });
    return response({ url: await finishCheckout(session) });
  } catch (e) { return fail(e); }
}
export async function GET() {
  try {
    if (!configured()) return response({ complete: false });
    const jar = await cookies(); const session = readSession(jar.get(COOKIE)?.value);
    if (!session) return response({ complete: false });
    const basket = await tebex<Basket>(accountPath(`/baskets/${session.ident}`));
    if (basket.complete) jar.delete(COOKIE);
    return response({ complete: basket.complete === true });
  } catch (e) { return fail(e); }
}
