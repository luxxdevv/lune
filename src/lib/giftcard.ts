export function giftcardCode(value: unknown): string {
  if (typeof value !== 'string' || value.length > 64) throw new Error('Enter a valid gift card number.');
  const code = value.trim().replace(/ /g, '');
  if (!/^[a-zA-Z0-9-]{5,64}$/.test(code)) throw new Error('Enter a valid gift card number.');
  return code;
}

export function giftcardBalance(value: unknown): { balance: number; currency: string } | null {
  const card = (value as { data?: { void?: boolean; balance?: { remaining?: unknown; currency?: unknown } } })?.data;
  if (!card || typeof card.void !== 'boolean') throw new Error('Invalid gift card response');
  if (card.void) return null;
  const amount = card.balance?.remaining;
  const currency = card.balance?.currency;
  if ((typeof amount !== 'number' && typeof amount !== 'string') || !/^[0-9]+(?:\.[0-9]{1,2})?$/.test(String(amount)) || !Number.isFinite(Number(amount)) || typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) throw new Error('Invalid gift card balance');
  // Do not return the code, original value, internal note or recipient information.
  return { balance: Number(amount), currency };
}
