import { useState } from 'react';
import type { Product, ProductKind } from '@/lib/catalog';
import { storeConfig } from '@/lib/config';
import { ItemModel } from './item-model';
import type { ItemModelName } from '@/lib/item-models';

// Rank icons progress through iron, gold, diamond and a star.
const RANKS: Record<string, ItemModelName> = { vip: 'iron_ingot', 'vip+': 'gold_ingot', hero: 'diamond', mvp: 'diamond_sword', legend: 'nether_star' };
// Crate keys are the real in-game key items (ExcellentCrates keys/*.yml on the server).
const KEYS: Record<string, ItemModelName> = { common: 'iron_nugget', rare: 'prismarine_crystals', legendary: 'blaze_rod', admin: 'magma_cream' };
const WHITE = '#ffffff';

function keyModel(productName: string): ItemModelName {
  const key = productName.toLowerCase().replace(/\s*(crate\s*)?key\s*$/, '').trim();
  return KEYS[key] || 'tripwire_hook';
}
export function CategoryArt({ kind }: { kind: ProductKind }) {
  if (kind === 'rank') return <ItemModel motion="sway" name="enchanted_book" glint={WHITE}/>;
  if (kind === 'keys') return <ItemModel motion="sway" name="tripwire_hook"/>;
  if (kind === 'coins') return <ItemModel motion="sway" name="money"/>;
  return <ItemModel motion="sway" name="spawner"/>;
}
export function ProductArt({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [failed, setFailed] = useState('');
  const name = product.name.toLowerCase().replace(/\s/g, '');
  const model: ItemModelName = product.kind === 'rank' ? RANKS[name] || 'enchanted_book' : product.kind === 'keys' ? keyModel(product.name) : product.kind === 'coins' ? 'money' : 'spawner';
  const glint = product.kind === 'keys' ? product.color : product.kind === 'rank' && model === 'enchanted_book' ? WHITE : undefined;
  const external = (storeConfig.productArtwork === 'tebex' || product.kind === 'other') && product.image && product.image !== failed;
  return <div className={`product-art ${compact ? 'compact' : ''} art-${product.kind}`}>{external ? <img className="item-render" src={product.image} alt={product.name} width={96} height={96} onError={() => setFailed(product.image || '')}/> : <ItemModel motion="sway" name={model} label={product.name} seed={product.id} glint={glint}/>}</div>;
}
export function DiscordIcon() {
  return <svg className="discord-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.3 4.4a19.8 19.8 0 0 0-4.9-1.5l-.6 1.3a18.3 18.3 0 0 0-5.5 0l-.6-1.3a19.7 19.7 0 0 0-5 1.5C.6 9-.3 13.6.1 18.1a20 20 0 0 0 6.1 3.1c.5-.6.9-1.3 1.2-2l-1.9-.9.4-.3a18.4 18.4 0 0 0 12.1 0l.4.3-1.9.9c.3.7.8 1.4 1.2 2a19.8 19.8 0 0 0 6.1-3.1c.5-5.2-.9-9.7-3.6-13.7ZM8 15.3c-1.2 0-2.2-1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>;
}
export function TelegramIcon() {
  return <svg className="telegram-icon" viewBox="-1 -1 26 26" overflow="visible" aria-hidden="true"><path fill="currentColor" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;
}
