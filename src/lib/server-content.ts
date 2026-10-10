// Optional server-specific data can be added by a developer. Live products come from Tebex.
export const serverRanks: Record<string, { group: string; homes: number; vaults: number; kit: string; color: string; image: string }> = {};
export const serverKeys: { id: number; name: string; price: number; crateId: string; keyId: string; color: string; image: string; acquisition?: 'vote' | 'staff'; tebexPackageId: number | null }[] = [];
