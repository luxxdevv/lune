import settings from '../../site.config.json' with { type: 'json' };
// Public display settings only. Put credentials in .env.local, never in this file.
export const storeConfig = {
  ...settings, name: settings.serverName, suffix: '', legalUrl: settings.legalNoticeUrl,
  hiddenPackageIds: settings.hiddenPackageIds as number[],
  productArtwork: settings.productArtwork as 'theme' | 'tebex',
  support: [{ role: 'Support', question: 'Server and purchase help', name: 'Server team', mc: '', head: 'support_head' as const, telegram: '' }],
  supporters: [] as { name: string; tier: string; avatar: string; color: string }[],
};
