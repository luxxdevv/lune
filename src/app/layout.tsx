import type { Metadata } from 'next';
import { storeConfig } from '@/lib/config';
import './globals.css';
import './reference-font.css';
import './store-design.css';
import './home-design.css';
import './store-community.css';
import './store-panels.css';
import './mobile-polish.css';
import './theme.css';
export const metadata: Metadata = { title: `${storeConfig.name} Store`, description: storeConfig.description, metadataBase: new URL(storeConfig.storeUrl), alternates:{canonical:'/'}, icons:{icon:'/favicon.svg'} };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
