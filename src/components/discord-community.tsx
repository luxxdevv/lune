'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Users } from 'lucide-react';
import { storeConfig } from '@/lib/config';
import { DiscordIcon } from './artwork';

type Community = { online: number; members: { name: string; avatar: string | null; game: string }[] };

export function DiscordCommunity() {
  const [data, setData] = useState<Community | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function refresh() {
      if (document.hidden) return;
      try {
        const response = await fetch('/api/discord', { signal: controller.signal });
        if (!response.ok) throw new Error('Unavailable');
        const community = await response.json();
        if (active) { setData(community); setUnavailable(false); }
      } catch { if (active) { setData(null); setUnavailable(true); } }
    }
    void refresh();
    const timer = setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  return <section className="community-card" aria-label="Discord community">
    <div className="community-heading"><DiscordIcon/><h2>Discord</h2><span className="community-presence" aria-live="polite">{data ? <><i className="status-dot"/>{data.online} online</> : unavailable ? 'Unavailable' : 'Connecting…'}</span></div>
    <p className="community-description">Announcements and order support.</p>
    {data && data.members.length > 0 && <ul className="community-members">{data.members.slice(0, 4).map((member, index) => <li key={`${member.name}-${index}`}>
      <span className="community-avatar"><Users size={16}/>{member.avatar && <img src={member.avatar} alt="" width="28" height="28" loading="lazy" referrerPolicy="no-referrer" onError={event => { event.currentTarget.hidden = true; }}/>}</span>
      <span><b>{member.name}</b>{member.game && <small>{member.game}</small>}</span>
    </li>)}</ul>}
    {unavailable && <p className="community-unavailable">The member list is unavailable. You can still join below.</p>}
    {data && !data.members.length && <p className="community-description">Join the conversation on Discord.</p>}
    <a className="community-join" href={storeConfig.discordUrl} target="_blank" rel="noreferrer"><span>Join Discord</span><ArrowUpRight size={16}/></a>
  </section>;
}
