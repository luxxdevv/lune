// Server-only integration. Credentials and upstream records never reach the browser.
export class PluginError extends Error {
  constructor(public status: number) { super('Tebex lookup unavailable'); }
}

export async function tebexPlugin(path: string): Promise<unknown> {
  const secret = process.env.TEBEX_PLUGIN_SECRET?.trim();
  if (!secret) throw new PluginError(503);
  let response: Response;
  try {
    response = await fetch(`https://plugin.tebex.io${path}`, { headers: { 'X-Tebex-Secret': secret, Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  } catch { throw new PluginError(502); }
  if (!response.ok) throw new PluginError(response.status);
  try { return await response.json(); } catch { throw new PluginError(502); }
}
