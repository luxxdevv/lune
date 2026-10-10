'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import { storeConfig } from '@/lib/config';
import type { NewsPost } from '@/lib/news';

function date(value: string) { return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }); }
export function StoreNews({ limit, title = 'Server news' }: { limit?: number; title?: string } = {}) {
  const [posts, setPosts] = useState<NewsPost[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/news', { signal: controller.signal }).then(async response => { if (!response.ok) throw new Error(); return response.json(); }).then(data => setPosts(data.posts)).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  return <section className="store-news" aria-labelledby="news-heading"><div className="section-heading"><h2 id="news-heading">{title}</h2><a className="text-button" href={storeConfig.websiteUrl}>{storeConfig.name} <ArrowUpRight size={14}/></a></div>
    {!posts && !failed && <div className="news-loading" role="status"><LoaderCircle className="spin" size={16}/> Loading news…</div>}
    {(failed || posts?.length === 0) && <p className="news-unavailable">{failed ? 'News could not be loaded.' : 'No news has been published yet.'} <a href={storeConfig.websiteUrl}>Visit {storeConfig.name} <ArrowUpRight size={14}/></a></p>}
    {!!posts?.length && <ol className="news-list">{posts.slice(0, limit).map(post => <li key={`${post.date}:${post.title}`}><time dateTime={post.date}>{date(post.date)}</time><div><div className="news-head"><span className={`tag tag-${['update', 'store', 'event', 'notice'].includes(post.tag.toLowerCase()) ? post.tag.toLowerCase() : 'notice'}`}>{post.tag}</span><h3>{post.title}</h3></div><p>{post.body}</p></div></li>)}</ol>}
  </section>;
}
