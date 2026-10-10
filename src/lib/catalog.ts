export type ProductKind = 'rank' | 'coins' | 'keys' | 'other';
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  image?: string;
  kind: ProductKind;
  color: string;
  label?: string;
  features: string[];
  quantityEnabled: boolean;
  recurring: boolean;
  optionsRequired?: boolean;
  available?: boolean;
  acquisition?: 'vote' | 'staff';
  rank?: { group: string; homes: number; vaults: number; kit: string; color: string };
  itemImage?: string;
}
export interface Category { id: number; name: string; kind: ProductKind; products: Product[] }
export interface Catalog { mode: 'demo' | 'live'; categories: Category[]; error?: string }
const rank = (id: number, name: string, price: number, color: string, features: string[], label?: string): Product => ({ id, name, price, color, features, label, kind: 'rank', description: `${name} lets you skip the join queue when the server is full. See what's included below.`, currency: 'USD', quantityEnabled: false, recurring: false });
export const demoCatalog: Catalog = {
  mode: 'demo',
  categories: [
    { id: 1, name: 'Queue Skips', kind: 'rank', products: [
      rank(7658619, 'Queue Skip 1 Day', 4.99, '#4cbafa', ['Skip the join queue', 'Valid for 24 hours', 'Works whenever the server is full', 'Activates on your next login']),
      rank(7658616, 'Queue Skip 1 Week', 9.99, '#49dbc4', ['Skip the join queue', 'Valid for 30 days', 'Works whenever the server is full', 'Activates on your next login']),
      { ...rank(7730818, 'Queue Skip Perm', 14.99, '#9290ff', ['Skip the join queue', 'Permanent, never expires', 'Works whenever the server is full', 'One-time purchase'], 'MOST POPULAR'), originalPrice: 19.99 },
    ] },
  ],
};
export function money(amount: number, currency = 'USD') {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount); }
  catch { return `${amount.toFixed(2)} ${currency}`; }
}
export function purchaseLabel(product: Product) {
  return product.acquisition === 'vote' ? 'Earn with /vote' : product.acquisition === 'staff' ? 'Staff issued' : product.available === false ? 'Coming soon' : product.optionsRequired ? 'Options required' : 'Add to basket';
}
export function productKind(name: string): ProductKind {
  if (/rank|vip|membership|queue|skip/i.test(name)) return 'rank';
  if (/coin|gold|gem|currency|credit|token/i.test(name)) return 'coins';
  if (/key|crate/i.test(name)) return 'keys';
  return 'other';
}