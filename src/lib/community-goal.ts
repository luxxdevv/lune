export interface CommunityGoal {
  current: number; target: number; currency: string; percentage: number; month: string;
}

export function goalMonth(date: Date, timeZone = 'Europe/Berlin') {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(date);
  return `${parts.find(part => part.type === 'year')!.value}-${parts.find(part => part.type === 'month')!.value}`;
}

// Sum only completed purchases from this calendar month, never demo/manual grants.
// The response exposes the aggregate, not payment or customer records.
export function monthlyGoal(payments: unknown[], target: number, currency: string, now = new Date(), timeZone = 'Europe/Berlin'): CommunityGoal {
  const month = goalMonth(now, timeZone);
  const seen = new Set<string>();
  let cents = 0;
  for (const value of payments) {
    if (!value || typeof value !== 'object') throw new Error('Invalid payment');
    const payment = value as Record<string, unknown>;
    const date = new Date(String(payment.date));
    if (!Number.isFinite(date.getTime())) throw new Error('Invalid payment date');
    if (date > now || goalMonth(date, timeZone) !== month || String(payment.status).toLowerCase() !== 'complete') continue;
    const gateway = payment.gateway as { name?: string } | undefined;
    if (/manual|test/i.test(gateway?.name || '')) continue;
    const id = String(payment.id ?? '');
    if (!id) throw new Error('Missing payment identity');
    if (seen.has(id)) continue;
    seen.add(id);
    if ((payment.currency as { iso_4217?: string })?.iso_4217 !== currency) throw new Error('Payment currency does not match goal');
    if (!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(String(payment.amount))) throw new Error('Invalid payment amount');
    const amount = Math.round(Number(payment.amount) * 100);
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Invalid payment amount');
    cents += amount;
  }
  return { current: cents / 100, target, currency, percentage: Math.min(100, cents / target), month };
}

export async function loadMonthlyGoal(fetchPage: (path: string) => Promise<unknown>, target: number, currency: string, now = new Date(), timeZone = 'Europe/Berlin') {
  const payments: unknown[] = [];
  const month = goalMonth(now, timeZone);
  // The payments endpoint returns newest first. Follow pagination through the
  // month boundary rather than truncating at 100 or re-reading years of orders.
  for (let page = 1; page <= 200; page++) {
    const response = await fetchPage(`/payments?paged=1&page=${page}`) as { data?: unknown[]; last_page?: number; current_page?: number };
    if (!Array.isArray(response?.data) || response.current_page !== page || !Number.isInteger(response.last_page) || response.last_page! < page) throw new Error('Invalid payment page');
    payments.push(...response.data);
    const reachedOlderPage = response.data.length > 0 && response.data.every(value => {
      const date = new Date(String((value as { date?: string })?.date));
      return Number.isFinite(date.getTime()) && goalMonth(date, timeZone) < month;
    });
    if (response.last_page === page || reachedOlderPage) return monthlyGoal(payments, target, currency, now, timeZone);
  }
  throw new Error('Payment history exceeded the supported page count');
}
