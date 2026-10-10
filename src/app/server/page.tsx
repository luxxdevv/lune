import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing-page';
import { storeConfig } from '@/lib/config';
export const metadata: Metadata = { title: `${storeConfig.name} · Minecraft server`, description: storeConfig.description, alternates: { canonical: storeConfig.websiteUrl } };
export default function Page() { return <LandingPage/>; }
