import { Check, Minus, ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/catalog';
import { ProductArt } from './artwork';
import { useCurrency } from './currency';

export function RankComparison({ products, addToCart }: { products: Product[]; addToCart: (product: Product) => void }) {
  const { fmt } = useCurrency();
  const rows: { label: string; value: (p: Product) => React.ReactNode }[] = [
    { label: 'Package details', value: p => p.description || 'See the package details before purchasing.' },
    { label: 'Payment', value: p => p.recurring ? 'Subscription' : 'One-time' },
  ];
  return <section className="rank-comparison" id="rank-comparison"><div className="section-heading"><div><h2>Rank comparison</h2><p>Available on Java and Bedrock.</p></div></div><div className="comparison-scroll" tabIndex={0} role="region" aria-label="Scrollable rank comparison"><table className="comparison-table"><caption className="visually-hidden">YourServer rank benefits comparison</caption><thead><tr><th scope="col">Permissions</th>{products.map(p => <th key={p.id} scope="col"><ProductArt product={p} compact/><h3>{p.name}</h3><strong>{fmt(p.price, p.currency)}</strong></th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{products.map(p => <td key={p.id}>{row.value(p)}</td>)}</tr>)}<tr className="comparison-buy"><th scope="row">Add to basket</th>{products.map(p => <td key={p.id}><button className="button" onClick={() => addToCart(p)} disabled={p.available === false || p.optionsRequired} aria-label={`Add ${p.name} to basket`}>{p.name} <ArrowRight size={12}/></button></td>)}</tr></tbody></table></div></section>;
}
