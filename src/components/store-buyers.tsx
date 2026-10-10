'use client';
import { useEffect, useState } from 'react';
import type { StoreActivity } from '@/lib/store-activity';
import { PlayerAvatar } from './player-avatar';
import { ItemModel } from './item-model';
import { Crown } from 'lucide-react';
import { GiftcardBalance } from './giftcard-balance';
import { storeConfig } from '@/lib/config';
import { money } from '@/lib/catalog';

export function StoreBuyers() {
  const [data, setData] = useState<StoreActivity | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      if (document.hidden) return;
      try {
        const response = await fetch('/api/store-activity', { signal: controller.signal });
        if (!response.ok) throw new Error('Unavailable');
        const value = await response.json() as StoreActivity;
        if (!controller.signal.aborted) { setData(value); setFailed(false); }
      } catch { if (!controller.signal.aborted) setFailed(true); }
    }
    void refresh(); const timer = setInterval(refresh, 300_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, []);
  const message = failed ? 'Purchase activity is temporarily unavailable.' : !data ? 'Loading purchases…' : null;
  const customer = data?.topCustomer?.username || data?.latestBuyers[0]?.username;
  const username = customer || storeConfig.showcaseName;
  const platform = username.startsWith('.') ? 'bedrock' : 'java';
  const query = `username=${encodeURIComponent(username)}&platform=${platform}`;
  const goal = data?.communityGoal;
  const month = goal ? new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(`${goal.month}-15T12:00:00Z`)) : null;
  return <div className="buyer-panels">
    <section className={`buyer-panel top-customer customer-showcase ${message ? 'is-loading' : ''}`} aria-labelledby="top-customer-title">
      <h2 id="top-customer-title"><Crown size={13}/>{!data?.topCustomer && customer ? 'Latest supporter' : 'Top customer'}</h2>
      <div className="customer-copy">
        {message ? <p className="buyer-empty">{message}</p> : <><strong>{username}</strong><p>{customer ? 'Thank you for supporting our community!' : 'Community showcase'}</p><span className="customer-caption">{customer ? 'You make it possible.' : 'Your skin could be here.'}</span></>}
      </div>
      {!message && <span className={`customer-character ${customer ? 'has-live-skin' : ''}`}>
        {customer ? <ItemModel name="player_skin" label={`${username}'s Minecraft skin`} skinUrl={`/api/player/skin?${query}`} fallbackSrc={`/api/player/avatar?${query}`} motion="still" facing="right"/> : <ItemModel name="demo_skin" label="Demo Minecraft character" motion="still" facing="right" />}
      </span>}
    </section>
    <section className="buyer-panel latest-buyers" aria-labelledby="latest-buyers-title">
      <h2 id="latest-buyers-title">Latest buyers</h2>
      {message ? <p className="buyer-empty">{message}</p> : data?.latestBuyers.length ? <ul className="buyer-faces">{data.latestBuyers.map((buyer, i) => <li key={`${buyer.username}-${i}`} tabIndex={0}>
        <PlayerAvatar username={buyer.username} platform={buyer.username.startsWith('.') ? 'bedrock' : 'java'}/>
        <span className="buyer-face-tooltip"><strong>{buyer.username}</strong>{buyer.packageName}</span>
      </li>)}</ul> : <div className="buyer-empty-state"><p>No recent purchases.</p></div>}
    </section>
    {storeConfig.community.enabled && <section className="buyer-panel community-goal" aria-labelledby="community-goal-title">
      <div className="community-ring" role={goal ? 'progressbar' : undefined} aria-label="Monthly community goal" aria-valuemin={goal ? 0 : undefined} aria-valuemax={goal ? 100 : undefined} aria-valuenow={goal ? Math.round(goal.percentage) : undefined} aria-valuetext={goal ? `${money(goal.current, goal.currency)} of ${money(goal.target, goal.currency)}` : undefined}>
        <svg viewBox="0 0 64 64" aria-hidden="true"><circle className="ring-track" cx="32" cy="32" r="26"/><circle className="ring-progress" cx="32" cy="32" r="26" pathLength="100" strokeDasharray={`${goal?.percentage || 0} 100`}/></svg><strong>{goal ? `${Math.floor(goal.percentage)}%` : '—'}</strong>
      </div>
      <div><h2 id="community-goal-title">Community goal</h2><p>{goal ? <><strong>{money(goal.current, goal.currency).replace(/\.00$/, '')}</strong><span> / {money(goal.target, goal.currency).replace(/\.00$/, '')} {goal.currency}</span></> : 'Progress temporarily unavailable'}</p><small>{month ? `${month} · ${data?.demo ? 'Demo preview' : 'Resets monthly'}` : `${money(storeConfig.community.goal, storeConfig.currency)} monthly goal`}</small></div>
    </section>}
    <GiftcardBalance/>
  </div>;
}
