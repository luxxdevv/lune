import { NextResponse } from 'next/server';
import { accountPath, configured, tebex } from '@/lib/tebex';
import { parseStoreActivity, type StoreActivity } from '@/lib/store-activity';
import { loadMonthlyGoal, goalMonth } from '@/lib/community-goal';
import { tebexPlugin } from '@/lib/tebex-plugin';
import { storeConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';
let cached: { value: StoreActivity; expires: number; month: string } | undefined;
let pending: Promise<StoreActivity> | undefined;

async function activity() {
  if (!configured()) return { topCustomer: null, latestBuyers: [], demo: true, communityGoal: { current: 0, target: storeConfig.community.goal, currency: storeConfig.currency, percentage: 0, month: goalMonth(new Date(), storeConfig.community.timeZone) } };
  if (cached && cached.expires > Date.now() && cached.month === goalMonth(new Date(), storeConfig.community.timeZone)) return cached.value;
  if (!pending) pending = Promise.all([
    tebex<unknown>(accountPath('/sidebar')),
    loadMonthlyGoal(tebexPlugin, storeConfig.community.goal, storeConfig.currency, new Date(), storeConfig.community.timeZone).catch(() => null),
  ]).then(([data, communityGoal]) => {
    const value = { ...parseStoreActivity(data), communityGoal };
    cached = { value, expires: Date.now() + (communityGoal ? 300_000 : 60_000), month: goalMonth(new Date(), storeConfig.community.timeZone) };
    return value;
  }).finally(() => { pending = undefined; });
  return pending;
}

export async function GET() {
  try {
    return NextResponse.json(await activity(), { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } });
  } catch {
    return NextResponse.json({ error: 'Purchase activity is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
