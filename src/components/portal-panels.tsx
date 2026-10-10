'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Play } from 'lucide-react';
import { DiscordIcon } from './artwork';
import { storeConfig as config } from '@/lib/config';
import { ServerStatus } from './server-status';
export function PortalLinks() {
 const [copied,setCopied]=useState(false); const [failed,setFailed]=useState(false);
 const [online, setOnline] = useState<number | null>(null);
 useEffect(() => {
  const controller = new AbortController();
  async function refresh() {
   if (document.hidden) return;
   try {
    const response = await fetch('/api/discord', { signal: controller.signal });
    const value = response.ok ? await response.json() : null;
    if (!controller.signal.aborted) setOnline(Number.isInteger(value?.online) ? value.online : null);
   } catch { if (!controller.signal.aborted) setOnline(null); }
  }
  void refresh(); const timer = setInterval(refresh, 60_000);
  return () => { controller.abort(); clearInterval(timer); };
 }, []);
 useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(false), 2500); return () => clearTimeout(timer); }, [copied]);
 async function copy(){try{await navigator.clipboard.writeText(config.serverAddress);setCopied(true);setFailed(false)}catch{setFailed(true)}}
 return <div className="portal-links">
  <div className="header-action-group header-play">
   <button className="header-action play-action" onClick={copy}>{copied ? <Check size={18}/> : <Play size={18} fill="currentColor"/>}<span>{copied ? 'Address copied' : 'Play now'}</span></button>
   <span className="header-address">{failed ? 'Copy manually: ' : ''}{config.serverAddress}</span>
   <ServerStatus compact/>
  </div>
  <div className="header-action-group header-discord">
   <a className="header-action discord-action" href={config.discordUrl} target="_blank" rel="noreferrer"><DiscordIcon/><span>Join Discord</span><ArrowUpRight size={15}/></a>
   <span className="header-address">{config.discordUrl.replace(/^https?:\/\//, "")}</span>
   <span className="header-presence">{online !== null ? <><i className="status-dot"/>{online.toLocaleString()} online</> : 'Community & support'}</span>
  </div>
 </div>
}
