import { PortalLinks } from './portal-panels';
import { storeConfig as config } from '@/lib/config';
import { SkyBackground } from './sky-background';

export function ServerBanner({ paused = false, home = false }: { paused?: boolean; home?: boolean }) {
  return <><SkyBackground paused={paused}/><header className={`masthead ${home ? 'home-header' : 'shop-header'}`} data-paused={paused}>
    <PortalLinks/>
    <h1 className="visually-hidden">{config.name} {home ? "Minecraft server" : "store"}</h1>
    <a className="masthead-logo" href={config.websiteUrl} aria-label={`${config.name} homepage`}><img src={config.logo} alt={config.name} width="1254" height="1254" fetchPriority="high"/></a>
  </header></>;
}
