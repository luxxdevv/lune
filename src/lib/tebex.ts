import { demoCatalog, productKind, type Catalog, type Product } from './catalog.ts';
import { storeConfig } from './config.ts';
const API = 'https://headless.tebex.io/api';
export class StoreError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
export function configured() { return !!process.env.TEBEX_PUBLIC_TOKEN?.trim(); }
export function accountPath(path: string) {
  const token = process.env.TEBEX_PUBLIC_TOKEN?.trim();
  if (!token) throw new StoreError('This preview store is not connected to Tebex yet.', 503);
  return `/accounts/${encodeURIComponent(token)}${path}`;
}
export async function tebex<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (process.env.TEBEX_PRIVATE_KEY) headers.Authorization = `Basic ${Buffer.from(`${process.env.TEBEX_PUBLIC_TOKEN}:${process.env.TEBEX_PRIVATE_KEY}`).toString('base64')}`;
  let response: Response;
  try { response = await fetch(`${API}${path}`, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), cache: 'no-store', signal: AbortSignal.timeout(15000) }); }
  catch { throw new StoreError('Tebex could not be reached. Please try again in a moment.', 502); }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 429) throw new StoreError('The store is busy. Please wait a moment and try again.', 429);
    // Do not expose upstream credentials, URLs, traces, or error payloads to the browser.
    throw new StoreError(response.status === 401 || response.status === 403
      ? 'Tebex could not authorize this request. Please contact the server team.'
      : response.status === 422 ? 'Tebex could not accept this order. Check your player name, package eligibility, and any coupon or gift card, then try again.'
      : 'Tebex is temporarily unavailable. Please try again shortly.', 502);
  }
  return (payload?.data ?? payload) as T;
}
interface TebexPackage {
  id: number; name: string; description?: string; image?: string; total_price: number; base_price?: number;
  currency: string; discount?: number; sales_tax?: number; disable_quantity?: boolean; type?: string; order?: number;
  options?: unknown[]; variables?: unknown[];
}
interface TebexCategory { id: number; name: string; packages?: TebexPackage[]; order?: number; dynamic?: boolean }
export function plainText(html: string) {
  return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

export async function getCatalog(): Promise<Catalog> {
  if (!configured()) return demoCatalog;
  const data = await tebex<TebexCategory[]>(accountPath('/categories?includePackages=1'));
  if (!Array.isArray(data)) throw new StoreError('The catalog could not be loaded.', 502);
  return { mode: 'live', categories: data.filter(c => !c.dynamic).sort((a,b)=>(a.order||0)-(b.order||0)).map(c => ({
    id: c.id, name: c.name, kind: productKind(c.name),
    products: (c.packages || []).filter(p => !storeConfig.hiddenPackageIds.includes(p.id as never)).sort((a,b)=>(a.order||0)-(b.order||0)).map((p): Product => {
      const base = p.base_price ?? p.total_price;
      const payable = typeof p.sales_tax === 'number' ? Math.round((p.total_price-p.sales_tax)*100)/100 : base;
      const onSale = typeof p.discount === 'number' && p.discount > 0 && Number.isFinite(payable) && payable >= 0 && payable < base;
      const price = onSale ? payable : base;
      if (!Number.isFinite(price) || price < 0 || !/^[A-Z]{3}$/.test(p.currency)) throw new StoreError('A package has an invalid price or currency.',502);
      return { id:p.id, name:p.name, description:plainText(p.description || ''), price, originalPrice:onSale?base:undefined,
        currency:p.currency, image:p.image && /^https:\/\//i.test(p.image)?p.image:undefined, color:'#83d8ed', kind:productKind(c.name),
        features:[], available:true, quantityEnabled:!p.disable_quantity && productKind(c.name)!=='rank', recurring:p.type==='subscription', optionsRequired:!!(p.options?.length||p.variables?.length),
      };
    }),
  })) };
}
export interface Basket {
  ident: string; complete: boolean; username_id?: number; username?: string;
  packages?: { id: number; in_basket?: { quantity: number } }[];
  coupons?: { code: string }[]; giftcards?: { card_number: string }[];
  links?: { checkout?: string }; total_price?: number; currency?: string;
}
