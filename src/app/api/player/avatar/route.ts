import { NextResponse } from 'next/server';
import { storeConfig } from '@/lib/config';
import sharp from 'sharp';
import { promises as fsp } from 'node:fs';
import path from 'node:path';

const CACHE_DIR = process.env.AVATAR_CACHE_DIR || path.join(process.cwd(), '.cache', 'avatars');

async function json(url: string) {
  const response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error('Profile unavailable');
  return response.json();
}

function pngResponse(bytes: Buffer) {
  return new Response(new Uint8Array(bytes).buffer as ArrayBuffer, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600, s-maxage=3600', 'X-Content-Type-Options': 'nosniff' } });
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const platform = query.get('platform') || 'java';
  let username = query.get('username')?.trim() || '';
  if (platform === 'bedrock' && username.startsWith(storeConfig.bedrockPrefix)) username = username.slice(storeConfig.bedrockPrefix.length);
  if (!['java', 'bedrock'].includes(platform) || !(platform === 'java' ? /^[a-zA-Z0-9_]{3,16}$/ : /^[a-zA-Z0-9_ .-]{1,16}$/).test(username)) return NextResponse.json({ error: 'Invalid player name' }, { status: 400 });
  try {
    // Resolve the player's skin on textures.minecraft.net — no third-party head service.
    let skinUrl: string;
    if (platform === 'java') {
      const profile = await json(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
      if (!/^[a-f0-9]{32}$/i.test(profile.id)) throw new Error('Unknown Java profile');
      const session = await json(`https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}`);
      const props = JSON.parse(Buffer.from(session.properties?.[0]?.value ?? '', 'base64').toString('utf8'));
      skinUrl = String(props?.textures?.SKIN?.url ?? '').replace(/^http:/, 'https:');
    } else {
      const profile = await json(`https://api.geysermc.org/v2/xbox/xuid/${encodeURIComponent(username)}`);
      if (!/^\d{1,20}$/.test(String(profile.xuid))) throw new Error('Unknown Bedrock profile');
      const skin = await json(`https://api.geysermc.org/v2/skin/${profile.xuid}`);
      if (!/^[a-f0-9]{32,128}$/i.test(skin.texture_id)) throw new Error('No cached Bedrock skin');
      skinUrl = `https://textures.minecraft.net/texture/${skin.texture_id}`;
    }
    if (!/^https:\/\/textures\.minecraft\.net\/texture\/[a-f0-9]{32,128}$/i.test(skinUrl)) throw new Error('Skin unavailable');

    const hash = skinUrl.split('/').pop()!;
    const cached = path.join(CACHE_DIR, `${hash}-64.png`);
    try { return pngResponse(await fsp.readFile(cached)); } catch {}

    const skinRes = await fetch(skinUrl, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(7000) });
    if (!skinRes.ok) throw new Error('Skin unavailable');
    const skin = Buffer.from(await skinRes.arrayBuffer());
    if (skin.byteLength > 256000) throw new Error('Unexpected skin size');

    // 8x8 face + hat overlay, nearest-neighbour upscale to 64x64.
    const face = await sharp(skin).extract({ left: 8, top: 8, width: 8, height: 8 }).png().toBuffer();
    const hat = await sharp(skin).extract({ left: 40, top: 8, width: 8, height: 8 }).png().toBuffer();
    const head = await sharp(face).composite([{ input: hat }]).resize(64, 64, { kernel: 'nearest' }).png().toBuffer();

    await fsp.mkdir(CACHE_DIR, { recursive: true }).catch(() => {});
    await fsp.writeFile(cached, head).catch(() => {});
    return pngResponse(head);
  } catch { return NextResponse.json({ error: 'Skin unavailable' }, { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } }); }
}
