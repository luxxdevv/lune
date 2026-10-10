import { ArrowRight, Check, Ticket } from 'lucide-react';
import { storeConfig } from '@/lib/config';

export function PromotionBar({ applied, useCoupon }: { applied: boolean; useCoupon: () => void }) {
  const promotion = storeConfig.promotion;
  if (!promotion.enabled) return null;
  return <div className="promotion-bar">
    {promotion.enabled ? <button className="promotion-code" onClick={useCoupon} aria-label={`${promotion.code} · ${promotion.percent}% off at checkout`}><Ticket className="promotion-ticket" size={26}/><span className="promotion-copy"><strong>{promotion.percent}% off your order</strong><span>Use <b>{promotion.code}</b> at checkout</span></span><span className="promotion-apply">{applied ? <><Check size={15}/> Applied</> : <>Apply code <ArrowRight size={15}/></>}</span></button> : <span className="promotion-label">Checkout by Tebex</span>}
    
  </div>;
}
