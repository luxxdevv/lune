import { createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { storeConfig } from './config.ts';
import { accountPath, StoreError, tebex, type Basket } from './tebex.ts';
import type { Catalog } from './catalog.ts';

export interface CheckoutInput { username: string; platform: 'java' | 'bedrock'; items: { id: number; quantity: number }[]; coupon: string; giftcard: string }
export interface CheckoutSession extends CheckoutInput { ident: string; expires: number }
export function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new StoreError('The store’s checkout is still being configured. Please try again later.', 503);
  return secret;
}
export function signSession(session: CheckoutSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${createHmac('sha256', sessionSecret()).update(payload).digest('base64url')}`;
}
export function readSession(cookie?: string): CheckoutSession | null {
  if (!cookie || cookie.length > 6000) return null;
  const [payload, signature, extra] = cookie.split('.');
  if (!payload || !signature || extra) return null;
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const result = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isFinite(result.expires) || result.expires < Date.now() || !/^[a-zA-Z0-9-]{10,150}$/.test(result.ident) || !Array.isArray(result.items)) return null;
    return result;
  } catch { return null; }
}
export function publicOrigin() {
  let url: URL;
  try { url = new URL(process.env.STORE_URL || 'http://localhost:3100'); }
  catch { throw new StoreError('The store URL is not configured correctly.', 503); }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new StoreError('The store requires a secure public URL.', 503);
  return url.origin;
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = publicOrigin();
  if (origin !== expected) {
    // Both loopback forms are allowed only for the local preview.
    const local = ['http://localhost:3100', 'http://127.0.0.1:3100'];
    if (!(local.includes(expected) && origin && local.includes(origin))) throw new StoreError('This checkout request was not made from the store.', 403);
  }
}
export function customerIp(request: Request): string {
  if (['http://localhost:3100', 'http://127.0.0.1:3100'].includes(publicOrigin())) return '127.0.0.1';
  const trustedHeader = process.env.TRUSTED_IP_HEADER;
  const value = trustedHeader ? request.headers.get(trustedHeader)?.split(',')[0]?.trim() : '';
  const ip = value?.startsWith('::ffff:') ? value.slice(7) : value;
  if (!ip || !isIP(ip)) throw new StoreError('Checkout needs a supported customer network address. Please contact the server team.', 503);
  return ip;
}
export function validateInput(value: unknown, catalog: Catalog): CheckoutInput {
  if (!value || typeof value !== 'object') throw new StoreError('Invalid checkout request.');
  const v = value as Record<string, unknown>;
  const player = v.player as Record<string, unknown> | undefined;
  if (!player || typeof player.username !== 'string' || !['java', 'bedrock'].includes(String(player.platform))) throw new StoreError('Enter your Minecraft username first.');
  const raw = player.username.trim();
  const platform = player.platform as 'java' | 'bedrock';
  // Accept an already-prefixed Bedrock name without adding the prefix twice.
  const username = platform === 'bedrock' && storeConfig.bedrockPrefix && raw.startsWith(storeConfig.bedrockPrefix) ? raw.slice(storeConfig.bedrockPrefix.length) : raw;
  if (!(platform === 'java' ? /^[a-zA-Z0-9_]{3,16}$/ : /^[a-zA-Z0-9_ .-]{1,16}$/).test(username)) throw new StoreError('Check your Minecraft username and selected edition.');
  if (!Array.isArray(v.items) || v.items.length < 1 || v.items.length > 20) throw new StoreError('Your basket must contain between 1 and 20 packages.');
  const products = catalog.categories.flatMap(c => c.products);
  const ids = new Set<number>(); const currencies = new Set<string>();
  const items = v.items.map(item => {
    if (!item || !Number.isSafeInteger(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 || ids.has(item.id)) throw new StoreError('Your basket contains an invalid package or quantity.');
    const product = products.find(p => p.id === item.id);
    if (!product) throw new StoreError('A package in your basket is no longer available. Refresh the store and try again.');
    if (product.available === false) throw new StoreError('This package is not on sale yet.');
    if (!product.quantityEnabled && item.quantity !== 1) throw new StoreError('This package can only be purchased once per basket.');
    if (product.optionsRequired) throw new StoreError('This package requires additional options. Please contact the server team.');
    currencies.add(product.currency); ids.add(item.id);
    return { id: item.id as number, quantity: item.quantity as number };
  });
  if (currencies.size > 1) throw new StoreError('All packages in one basket must use the same currency.');
  function code(key: string) { if (v[key] === undefined || v[key] === '') return ''; if (typeof v[key] !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(v[key] as string)) throw new StoreError(`Enter a valid ${key} code.`); return v[key] as string; }
  return { username: platform === 'bedrock' ? `${storeConfig.bedrockPrefix}${username}` : username, platform, items, coupon: code('coupon'), giftcard: code('giftcard') };
}
export function safeCheckoutUrl(url: unknown): string {
  if (typeof url !== 'string') throw new StoreError('Tebex did not provide a checkout link. Please try again.', 502);
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new StoreError('The checkout link is invalid.', 502); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || (parsed.hostname !== 'tebex.io' && !parsed.hostname.endsWith('.tebex.io'))) throw new StoreError('The checkout provider returned an unexpected link.', 502);
  return parsed.toString();
}
export function authorizationUrl(value: unknown): string | null {
  if (!Array.isArray(value)) throw new StoreError('Tebex could not return player authorization options.', 502);
  // Minecraft baskets with a resolved username currently return [[]].
  // An empty provider is not a sign-in link and must not cause a redirect.
  const providers = value.filter(provider => !(Array.isArray(provider) && provider.length === 0));
  if (!providers.length) return null;
  if (!providers.every(provider => provider && typeof provider === 'object' && typeof provider.url === 'string')) throw new StoreError('Tebex could not return player authorization options.', 502);
  return safeCheckoutUrl(providers[0].url);
}
// Serialize retries for the same basket within a process. Re-read upstream state
// before each add so sequential authorization callbacks do not duplicate packages.
const pending = new Map<string, Promise<string>>();
export async function finishCheckout(session: CheckoutSession): Promise<string> {
  const existing = pending.get(session.ident);
  if (existing) return existing;
  const job = async () => {
    const path = accountPath(`/baskets/${encodeURIComponent(session.ident)}`);
    let basket = await tebex<Basket>(path);
    if (basket.complete) throw new StoreError('This basket has already been paid. Start a new order from the store.');
    for (const item of session.items) {
      const included = basket.packages?.find(p => p.id === item.id);
      if (!included) {
        // The mutation returns the current basket. An immediate GET can still
        // return the pre-update snapshot, including an empty checkout link.
        basket = await tebex<Basket>(`/baskets/${encodeURIComponent(session.ident)}/packages`, 'POST', { package_id: String(item.id), quantity: item.quantity });
      } else if (included.in_basket?.quantity !== item.quantity) {
        await tebex(`/baskets/${encodeURIComponent(session.ident)}/packages/${item.id}`, 'PUT', { quantity: item.quantity });
        if (included.in_basket) included.in_basket.quantity = item.quantity;
      }
    }
    if (session.coupon && !basket.coupons?.some(c => c.code === session.coupon)) {
      const result = await tebex<{ success?: boolean }>(`${path}/coupons`, 'POST', { coupon_code: session.coupon });
      if (result?.success === false) throw new StoreError('That coupon could not be applied. Check the code and try again.');
    }
    if (session.giftcard && !basket.giftcards?.some(c => c.card_number === session.giftcard)) {
      const result = await tebex<{ success?: boolean }>(`${path}/giftcards`, 'POST', { card_number: session.giftcard });
      if (result?.success === false) throw new StoreError('That gift card could not be applied. Check the number and try again.');
    }
    return safeCheckoutUrl(basket.links?.checkout);
  };
  const promise = job(); pending.set(session.ident, promise);
  try { return await promise; } finally { pending.delete(session.ident); }
}
