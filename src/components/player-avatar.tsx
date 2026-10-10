'use client';
import { useState } from 'react';
import { UserRound } from 'lucide-react';
export function PlayerAvatar({ username, platform }: { username: string; platform: 'java' | 'bedrock' }) {
  const src = `/api/player/avatar?username=${encodeURIComponent(username)}&platform=${platform}`;
  const [failed, setFailed] = useState('');
  if (failed === src) return <span className="player-avatar avatar-unavailable" title={`Skin unavailable for ${username}`}><UserRound size={18}/></span>;
  return <img className="player-avatar" src={src} alt={`${username}'s Minecraft skin`} width={32} height={32} onError={() => setFailed(src)}/>;
}
