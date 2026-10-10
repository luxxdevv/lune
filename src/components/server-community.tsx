'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { storeConfig as config } from '@/lib/config';
import { ServerStatus } from './server-status';
import { DiscordCommunity } from './discord-community';
import { MinecraftText } from './minecraft-text';

export function ServerCommunity({ copyAddress }: { copyAddress: (address?: string) => Promise<boolean> }) {
  const [copied, setCopied] = useState<'java' | 'bedrock' | null>(null);
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (reset.current) clearTimeout(reset.current); }, []);

  async function copy(edition: 'java' | 'bedrock') {
    const address = edition === 'java' ? config.serverAddress : `${config.bedrockAddress}:${config.bedrockPort}`;
    if (await copyAddress(address)) {
      setCopied(edition);
      if (reset.current) clearTimeout(reset.current);
      reset.current = setTimeout(() => setCopied(null), 2200);
    }
  }

  return <section className="stats" aria-label="Server and community">
    <div className="stat surface server-stat">
      <div className="stat-head"><span className="label">Minecraft</span><ServerStatus compact/></div>
      <div className="server-addresses">
        <button className="address-copy java-address" onClick={() => copy('java')} aria-label={`Copy ${config.serverAddress} server address`}>
          <span className="address-heading"><span className="label">Java IP</span></span>
          <span className="address-value"><MinecraftText text={config.serverAddress} height={20} iron/>{copied === 'java' ? <Check size={14}/> : <Copy size={14}/>}</span>
          {copied === 'java' && <span className="visually-hidden">Copied to clipboard</span>}
        </button>
        <button className="address-copy bedrock-address" onClick={() => copy('bedrock')} aria-label="Copy Bedrock server address">
          <span className="address-heading"><span className="label">Bedrock IP</span></span>
          <span className="address-value"><MinecraftText text={`${config.bedrockAddress}:${config.bedrockPort}`} height={11}/>{copied === 'bedrock' ? <Check size={14}/> : <Copy size={14}/>}</span>
          {copied === 'bedrock' && <span className="visually-hidden">Address and port copied</span>}
        </button>
      </div>
      <span className="copy-hint" aria-live="polite">{copied ? `${copied === 'java' ? 'Java IP' : 'Bedrock IP and port'} copied` : 'Click an address to copy'}</span>
    </div>
    <DiscordCommunity/>
  </section>;
}
