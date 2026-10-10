import settings from '../../site.config.json';
export const landingContent = {
  version: settings.version, storeUrl: settings.storeUrl, telegramUrl: settings.discordUrl, wikiUrl: settings.wikiUrl,
  about: settings.description,
  features: [
    { name: 'Ranks', image: 'enchanted_book', model: 'enchanted_book' as const },
    { name: 'Crates', image: 'tripwire_hook', model: 'tripwire_hook' as const },
    { name: 'Rewards', image: 'nether_star', model: 'nether_star' as const },
    { name: 'Economy', image: 'money', model: 'money' as const },
    { name: 'Community', image: 'grass_block', model: 'grass_block' as const },
    { name: 'Adventures', image: 'diamond_sword', model: 'diamond_sword' as const },
  ],
  staff: settings.staff as { name: string; role: string; mc: string; github?: string }[],
  faq: settings.faq,
};
