import type { Product } from '@/lib/catalog';
import { useCurrency } from './currency';

export function PackagePrice({ product }: { product: Product }) {
  const { fmt, code } = useCurrency();
  if (product.acquisition) return <div className="package-price key-acquisition"><strong>{product.acquisition === 'vote' ? 'Earn with /vote' : 'Staff issued'}</strong><span>Not sold in the store</span></div>;
  const original = product.originalPrice;
  const sale = original !== undefined && original > product.price;
  const percent = sale ? Math.round((1 - product.price / original) * 100) : 0;
  return <div className={`package-price ${sale ? 'on-sale' : ''}`}>
    {sale && <div className="price-before"><span>Was <del>{fmt(original, product.currency)}</del></span><b>{percent}% off</b></div>}
    <div className="product-price"><strong>{fmt(product.price, product.currency)}</strong><span>{code}</span></div>
    {sale && <span className="sale-saving">You save {fmt(original - product.price, product.currency)}</span>}
  </div>;
}
