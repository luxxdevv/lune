import type { CommunityGoal } from './community-goal.ts';

export interface StoreActivity {
  demo?: boolean;
  topCustomer: { username: string } | null;
  latestBuyers: { username: string; packageName: string }[];
  communityGoal?: CommunityGoal | null;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function playerName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return /^[a-zA-Z0-9_. -]{1,32}$/.test(name) ? name : null;
}

// Only pass the public sidebar's player and package names to the browser.
// Never expose payment IDs, email addresses, amounts, or raw upstream data.
export function parseStoreActivity(value: unknown, now = Date.now()): StoreActivity {
  if (!Array.isArray(value)) throw new Error('Invalid sidebar response');
  const modules = value.map(record).filter(module => {
    const start = typeof module.start_time === 'string' ? Date.parse(module.start_time) : NaN;
    const end = typeof module.end_time === 'string' ? Date.parse(module.end_time) : NaN;
    return !(start > now) && !(end <= now);
  });
  const top = record(modules.find(module => module.type === 'top_customer')?.data);
  const username = playerName(top.username);
  const recent = record(modules.find(module => module.type === 'recent_payments')?.data);
  const latestBuyers = (Array.isArray(recent.payments) ? recent.payments : []).flatMap(value => {
    const payment = record(value);
    const username = playerName(payment.username);
    const name = record(payment.package).name;
    if (!username || typeof name !== 'string' || !name.trim()) return [];
    return [{ username, packageName: name.trim().slice(0, 80) }];
  }).slice(0, 5);
  return { topCustomer: username ? { username } : null, latestBuyers };
}
