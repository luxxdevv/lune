import { storeConfig } from '@/lib/config';

async function json(url: string) {
  const response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error('Profile unavailable');
  return response.json();
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const platform = query.get('platform') || 'java';
  let username = query.get('username')?.trim() || '';
  if (platform === 'bedrock' && username.startsWith(storeConfig.bedrockPrefix)) username = username.slice(storeConfig.bedrockPrefix.length);
  if (!['java', 'bedrock'].includes(platform) || !(platform === 'java' ? /^[a-zA-Z0-9_]{3,16}$/ : /^[a-zA-Z0-9_ .-]{1,16}$/).test(username)) {
    return Response.json({ error: 'Invalid player name' }, { status: 400 });
  }
  try {
    let skinUrl: string;
    if (platform === 'java') {
      const profile = await json(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
      if (!/^[a-f0-9]{32}$/i.test(profile.id)) throw new Error('Invalid profile');
      const session = await json(`https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}`);
      const property = session.properties?.find((p: { name?: string }) => p.name === 'textures');
      const texture = JSON.parse(Buffer.from(property?.value || '', 'base64').toString('utf8'));
      skinUrl = String(texture?.textures?.SKIN?.url || '').replace(/^http:/, 'https:');
    } else {
      const profile = await json(`https://api.geysermc.org/v2/xbox/xuid/${encodeURIComponent(username)}`);
      if (!/^\d{1,20}$/.test(String(profile.xuid))) throw new Error('Invalid profile');
      const skin = await json(`https://api.geysermc.org/v2/skin/${profile.xuid}`);
      skinUrl = `https://textures.minecraft.net/texture/${skin.texture_id}`;
    }
    if (!/^https:\/\/textures\.minecraft\.net\/texture\/[a-f0-9]{32,128}$/i.test(skinUrl)) throw new Error('Invalid texture');
    const response = await fetch(skinUrl, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error('Skin unavailable');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > 256000 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Invalid PNG');
    return new Response(bytes, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600, s-maxage=3600', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return Response.json({ error: 'Skin unavailable' }, { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } });
  }
}
