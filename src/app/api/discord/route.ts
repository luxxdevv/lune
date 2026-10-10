import { NextResponse } from 'next/server';
import { storeConfig } from '@/lib/config';

function avatarUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['cdn.discordapp.com', 'media.discordapp.net', 'discord.com'].includes(url.hostname) ? url.href : null;
  } catch { return null; }
}

export async function GET() {
  if (!storeConfig.discordServerId) return NextResponse.json({ online: null, members: [] });
  try {
    const response = await fetch(`https://discord.com/api/guilds/${storeConfig.discordServerId}/widget.json`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Widget unavailable');
    const data = await response.json();
    if (data.id !== storeConfig.discordServerId || !Number.isInteger(data.presence_count) || data.presence_count < 0 || !Array.isArray(data.members)) throw new Error('Invalid widget');
    const members = data.members.slice(0, 6).flatMap((member: unknown) => {
      if (!member || typeof member !== 'object' || !('username' in member) || typeof member.username !== 'string') return [];
      const value = member as Record<string, unknown>;
      const game = value.game && typeof value.game === 'object' && 'name' in value.game && typeof value.game.name === 'string' ? value.game.name.slice(0, 48) : '';
      return [{ name: member.username.slice(0, 48), avatar: avatarUrl(value.avatar_url), game }];
    });
    return NextResponse.json({ online: data.presence_count, members }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } });
  } catch {
    return NextResponse.json({ error: 'Discord status unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
