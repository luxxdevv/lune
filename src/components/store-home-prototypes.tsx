'use client';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ItemModel } from './item-model';
import { CategoryArt, DiscordIcon } from './artwork';
import { storeConfig } from '@/lib/config';
import type { ProductKind } from '@/lib/catalog';

export const homePrototypes = [
  { id: 'cards', label: 'A · Category cards' },
  { id: 'scene', label: 'B · Character scene' },
  { id: 'rows', label: 'C · Category rows' },
] as const;
export type HomePrototype = typeof homePrototypes[number]['id'];
const categories: { kind: ProductKind; name: string; description: string }[] = [
  { kind: 'rank', name: 'Ranks', description: 'Compare perks, homes and kits.' },
  { kind: 'keys', name: 'Crate keys', description: 'Choose a key for your next crate.' },
  { kind: 'coins', name: 'Credits', description: 'Spend in the in-game store.' },
];

export function HomePrototypePicker({ value, change }: { value: HomePrototype; change: (value: HomePrototype) => void }) {
  return <nav className="home-prototype-picker" aria-label="Homepage design previews"><strong>Homepage previews</strong><div>{homePrototypes.map(option=><button key={option.id} aria-pressed={value === option.id} onClick={()=>change(option.id)}>{option.label}</button>)}</div><a href="/">Exit preview <ArrowUpRight size={13}/></a></nav>;
}

function HomeHelp() {
  return <div className="prototype-help"><section><span className="prototype-help-art"><ItemModel name="discord_head"/></span><div><h3>Need a hand?</h3><p>Open a Discord ticket with your username and order details.</p><a href={storeConfig.discordUrl}><DiscordIcon/> Join Discord <ArrowUpRight size={14}/></a></div></section><section><span className="prototype-help-art"><ItemModel name="enchanted_book"/></span><div><h3>Before checkout</h3><p>Check your Minecraft username and the package details. Payments are handled by Tebex.</p><a href={storeConfig.termsUrl}>Purchase terms <ArrowUpRight size={14}/></a></div></section></div>;
}

export function StoreHomePrototype({ variant, browse }: { variant: HomePrototype; browse: (kind: ProductKind) => void }) {
  const intro=<div className="prototype-intro"><h2>{storeConfig.name} Store</h2><p>Ranks, crate keys and credits for your Minecraft account.</p></div>;
  const categoryLinks=<div className="prototype-categories">{categories.map(category=><button key={category.kind} onClick={()=>browse(category.kind)} aria-label={`Browse ${category.name}`}><span className="prototype-category-art"><CategoryArt kind={category.kind}/></span><span className="prototype-category-copy"><strong>{category.name}</strong><span>{category.description}</span></span><ArrowRight size={19}/></button>)}</div>;
  return <section className={`store-home-prototype prototype-${variant}`} data-home-prototype={variant}>
    {variant === 'scene' ? <div className="prototype-scene-hero"><div>{intro}<button className="button prototype-browse" onClick={()=>browse('rank')}>Browse ranks <ArrowRight size={17}/></button></div><div className="prototype-item-scene" aria-hidden="true"><span className="scene-character"><ItemModel name="demo_skin" facing="right" motion="still"/></span><span className="scene-book"><ItemModel name="enchanted_book" glint="#ffffff"/></span><span className="scene-star"><ItemModel name="nether_star"/></span><span className="scene-key"><ItemModel name="tripwire_hook"/></span><span className="scene-money"><ItemModel name="money"/></span></div></div> : intro}
    {categoryLinks}
    <p className="prototype-delivery">Enter the Minecraft account that should receive your purchase at checkout.</p>
    <HomeHelp/>
  </section>;
}
