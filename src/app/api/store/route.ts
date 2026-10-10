import { NextResponse } from 'next/server';
import { getCatalog, StoreError } from '@/lib/tebex';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { return NextResponse.json(await getCatalog(), { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } }); }
  catch (e) { return NextResponse.json({ error: e instanceof StoreError ? e.message : 'The store could not be loaded. Please try again.' }, { status: e instanceof StoreError ? e.status : 500, headers: { 'Cache-Control': 'no-store' } }); }
}
