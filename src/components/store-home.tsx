'use client';

import { ArrowRight, ArrowUpRight, LifeBuoy, ShieldCheck } from 'lucide-react';
import { CategoryArt, DiscordIcon, ProductArt } from './artwork';
import { useCurrency } from './currency';
import { storeConfig } from '@/lib/config';
import type { Product, ProductKind } from '@/lib/catalog';

const categories: { kind: ProductKind; name: string; detail: string }[] = [
  { kind: 'rank', name: 'Ranks', detail: 'Perks & daily kits' },
  { kind: 'keys', name: 'Crate keys', detail: 'Find your next reward' },
  { kind: 'coins', name: 'Credits', detail: 'For the in-game store' },
];

export function StoreHome({ products, browse, openProduct }: { products: Product[]; browse: (kind: ProductKind) => void; openProduct: (product: Product) => void }) {
  const { fmt } = useCurrency();
  const featured = products.filter(product => product.kind === 'rank' && product.available !== false).slice(0, 3);
  return <section className="store-home" aria-label="Store home">
    <header className="store-home-heading"><span className="store-eyebrow">GEAR UP FOR YOUR NEXT ADVENTURE</span><h2>{storeConfig.name} Store</h2></header>

    {!!featured.length && <section className="home-featured" aria-labelledby="home-featured-heading">
      <div className="home-section-label"><h3 id="home-featured-heading">Featured packages</h3><button onClick={() => browse('rank')}>All ranks <ArrowRight size={14}/></button></div>
      <div className="home-package-row">{featured.map(product => <button className="home-package" key={product.id} onClick={() => openProduct(product)} aria-label={`View ${product.name}, ${fmt(product.price, product.currency)}`}>
        <ProductArt product={product} compact/><span><strong>{product.name}</strong><small>{fmt(product.price, product.currency)}</small></span><ArrowUpRight size={16}/>
      </button>)}</div>
    </section>}

    <section className="home-welcome-box" aria-labelledby="home-welcome-heading">
      <span className="store-eyebrow">WELCOME TO</span><h2 id="home-welcome-heading">{storeConfig.name}</h2>
      <p>Find your next upgrade. Explore ranks with extra perks, keys for your favourite crates, and credits to spend in-game.</p>
      <p>Choose the Minecraft account that should receive your purchase at checkout, then join the server with that account after payment. Every purchase helps support {storeConfig.name}.</p>
      <div className="home-category-row">{categories.filter(category => products.some(product => product.kind === category.kind)).map(category => <button key={category.kind} onClick={() => browse(category.kind)} aria-label={`Browse ${category.name}`}>
        <span className="home-category-art"><CategoryArt kind={category.kind}/></span><span><strong>{category.name}</strong><small>{category.detail}</small></span><ArrowRight size={16}/>
      </button>)}</div>
    </section>

    <div className="home-info-panels">
      <section className="home-purchase-info"><h3><ShieldCheck size={19}/> Purchase information</h3><p>Check your username, package perks and billing details before paying. Payments are handled by Tebex.</p><div className="home-info-links"><a href={storeConfig.termsUrl}>Purchase terms <ArrowUpRight size={13}/></a><a href={storeConfig.withdrawalUrl}>Withdrawal information <ArrowUpRight size={13}/></a></div></section>
      <section className="home-support-info"><h3><LifeBuoy size={19}/> Need a hand?</h3><p>Questions before buying, or something missing from your order? Open a ticket with your username and transaction ID.</p><a className="home-support-link" href={storeConfig.discordUrl}><DiscordIcon/> Join Discord <ArrowUpRight size={14}/></a></section>
    </div>
  </section>;
}
