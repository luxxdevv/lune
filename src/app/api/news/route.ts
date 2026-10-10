import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { validateNews } from '@/lib/news';
export async function GET() {
  try { const posts=validateNews(JSON.parse(await readFile(path.join(process.cwd(),'public/news.json'),'utf8'))); return NextResponse.json({posts},{headers:{'Cache-Control':'public, max-age=60'}}); }
  catch { return NextResponse.json({error:'News are temporarily unavailable.'},{status:503}); }
}
