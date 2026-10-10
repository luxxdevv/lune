'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Pause, Play, Plus } from 'lucide-react';
import { storeConfig } from '@/lib/config';
import { landingContent as content } from '@/lib/landing-content';
import { ServerBanner } from './server-banner';
import { StoreNews } from './store-news';
import { ItemModel } from './item-model';
import { FeatureEffect } from './feature-effect';
import { PlayerAvatar } from './player-avatar';
import { usePageTransition } from './use-page-transition';

const sections = ['About', 'News', 'FAQ', 'Staff'] as const;
type Section = typeof sections[number];
function sectionFromHash(): Section {
  return sections.find(section => `#${section.toLowerCase()}` === window.location.hash) || 'About';
}

export function LandingPage() {
  const [section, setSection] = useState<Section>('About');
  const [paused, setPaused] = useState(false);
  const pageRef = useRef<HTMLElement>(null);
  usePageTransition(pageRef, section, paused);
  useEffect(() => {
    const update = () => setSection(sectionFromHash());
    update(); window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  function navigate(next: Section) {
    setSection(next);
    window.history.replaceState(null, '', `#${next.toLowerCase()}`);
  }

  return <div className={`storefront landing-site ${paused ? 'motion-paused' : ''}`}>
    <button className="motion-toggle motion-toggle-fixed" aria-label={paused ? 'Play animations' : 'Pause animations'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={14}/> : <Pause size={14}/>}</button>
    <ServerBanner paused={paused} home/>
    <div className="site-shell homepage-shell">
      <nav className="homepage-nav" aria-label="Server navigation">
        <div className="homepage-pages">
          {sections.map(name => <button key={name} className={section === name ? 'is-active' : ''} aria-current={section === name ? 'page' : undefined} onClick={() => navigate(name)}>{name}</button>)}
          <a href={content.wikiUrl}>Wiki</a>
        </div>
        <a className="homepage-store" href={content.storeUrl}>Visit store <ArrowUpRight size={17}/></a>
      </nav>
      <main className="homepage-main" id="home-content" ref={pageRef}>
        {section === 'About' ? <div className="homepage-overview">
          <section className="home-intro home-panel" aria-labelledby="about-heading">
            <span className="home-editions">JAVA &amp; BEDROCK · {storeConfig.version}</span>
            <h2 id="about-heading">{storeConfig.aboutTitle}</h2>
            <p>{content.about}</p>
            <ul className="home-features">{content.features.map(feature => <li key={feature.name}>
              <span className="tile-art">{<ItemModel motion="sway" name={feature.model} glint={feature.model === 'enchanted_book' || feature.model === 'diamond_sword' ? '#ffffff' : undefined}/>}</span>
              <span>{feature.name}</span>
            </li>)}</ul>
            <div className="home-intro-footer"><span>New to the server?</span><a href={content.wikiUrl}>Read the guide <ArrowRight size={16}/></a></div>
          </section>
          <aside className="home-updates home-panel">
            <StoreNews title="Latest news" limit={2}/>
            <button className="home-all-news" onClick={() => navigate('News')}>All server news <ArrowRight size={16}/></button>
          </aside>
        </div> : <section className={`home-panel homepage-section section-${section.toLowerCase()}`}>
          {section === 'News' && <StoreNews/>}
          {section === 'FAQ' && <><div className="section-heading"><h2>Frequently asked questions</h2></div><div className="faq-list">{content.faq.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={17}/></summary><p>{answer}</p></details>)}</div></>}
          {section === 'Staff' && <><div className="section-heading"><h2>Server team</h2></div><ul className="landing-staff">{content.staff.map(member => <li className="surface" key={member.name}><PlayerAvatar username={member.mc} platform="java"/><div><h3>{member.name}</h3><p>{member.role}</p>{'github' in member && <a className="text-button" href={member.github} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={12}/></a>}</div></li>)}</ul></>}
        </section>}
      </main>
      <footer className="site-footer"><div className="footer-links"><a href={content.wikiUrl}>Wiki</a><a href={content.storeUrl}>Store</a><a href={storeConfig.legalNoticeUrl}>Legal notice</a><a href={storeConfig.privacyUrl}>Privacy</a><a href={storeConfig.termsUrl}>Terms</a></div><p>© {new Date().getFullYear()} {storeConfig.name} · Not associated with Mojang or Microsoft.</p></footer>
    </div>
  </div>;
}
