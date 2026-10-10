'use client';



import { useEffect, useMemo, useRef, useState } from 'react';

import { ArrowDown, ArrowRight, Check, ChevronDown, ChevronRight, ExternalLink, Gamepad2, Gift, Pause, Play, LoaderCircle, LockKeyhole, LogOut, Minus, Monitor, Plus, ShieldCheck, ShoppingBag, Trash2, UserRound, X } from 'lucide-react';

import { purchaseLabel, type Catalog, type Product } from '@/lib/catalog';

import { storeConfig as config } from '@/lib/config';

import { ProductArt, CategoryArt } from './artwork';

import { ItemModel } from './item-model';

import { MinecraftText } from './minecraft-text';

import { ServerBanner } from './server-banner';

import { Modal } from './modal';

import { PlayerAvatar } from './player-avatar';

import { ServerStatus } from './server-status';

import { StoreBuyers } from './store-buyers';
import { StoreHome } from './store-home';
import { usePageTransition } from './use-page-transition';
import { HomePrototypePicker, StoreHomePrototype, homePrototypes, type HomePrototype } from './store-home-prototypes';

import { RankComparison } from './rank-comparison';

import { StoreNews } from './store-news';

import { PromotionBar } from './promotion-bar';

import { PackagePrice } from './package-price';

import { CurrencyProvider, CurrencySelect, CurrencyNote, useCurrency } from './currency';



type Player = { username: string; platform: 'java' | 'bedrock' };

type CartItem = { product: Product; quantity: number };

type Page = 'home' | 'support' | `category-${number}`;

type Dialog = 'login' | 'cart' | 'join' | 'terms' | 'privacy' | null;

const faq = config.faq;



export function Storefront() {

  return <CurrencyProvider base={config.currency}><StorefrontInner/></CurrencyProvider>;

}



function StorefrontInner() {

  const { fmt, base, code, converted } = useCurrency();

  const [catalog, setCatalog] = useState<Catalog>({ mode: 'live', categories: [] });

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState<Page>('home');

  const [dialog, setDialog] = useState<Dialog>(null);

  const [detail, setDetail] = useState<Product | null>(null);

  const [player, setPlayer] = useState<Player | null>(null);

  const [platform, setPlatform] = useState<Player['platform']>('java');

  const [username, setUsername] = useState('');

  const [loginError, setLoginError] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);

  const [hydrated, setHydrated] = useState(false);

  const [toast, setToast] = useState('');

  

  const [motionPaused, setMotionPaused] = useState(false);

  const [quantity, setQuantity] = useState(1);

  const [cardQuantity, setCardQuantity] = useState<Record<number, number>>({});

  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const [checkoutError, setCheckoutError] = useState('');

  const [coupon, setCoupon] = useState('');

  const [giftcard, setGiftcard] = useState('');

  const resumeStarted = useRef(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const pageTransitionRef = useRef<HTMLDivElement>(null);
  const [homePrototype, setHomePrototype] = useState<HomePrototype | null>(null);
  usePageTransition(pageTransitionRef, `${page}:${homePrototype || 'cards'}`, motionPaused);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('home-preview');
    setHomePrototype(homePrototypes.find(option => option.id === requested)?.id || null);
  }, []);
  function changeHomePrototype(next: HomePrototype) {
    setHomePrototype(next); setPage('home');
    const url = new URL(window.location.href); url.searchParams.set('home-preview', next);
    window.history.replaceState(null, '', url);
  }


  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const allProducts = useMemo(() => catalog.categories.flatMap(c => c.products), [catalog]);

  const category = catalog.categories.find(c => `category-${c.id}` === page);

  const featured = allProducts.find(p => p.id === config.featuredPackageId && p.available !== false) || allProducts.find(p => p.available !== false);
  const currency = cart[0]?.product.currency || allProducts[0]?.currency || config.currency;



  useEffect(() => {

    let active = true;

    fetch('/api/store').then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || 'The store is temporarily unavailable.'); return data as Catalog; })

      .then(data => { if (active) setCatalog(data); })

      .catch((e: Error) => { if (active) setCatalog({ mode: 'live', categories: [], error: e.message }); })

      .finally(() => { if (active) setLoading(false); });

    try {

      const savedPlayer = JSON.parse(localStorage.getItem('server-template-player') || 'null');

      if (savedPlayer && typeof savedPlayer.username === 'string' && ['java', 'bedrock'].includes(savedPlayer.platform)) setPlayer(savedPlayer);

      const savedCoupon = localStorage.getItem('server-template-coupon') || '';

      if (/^[a-zA-Z0-9_-]{1,64}$/.test(savedCoupon)) setCoupon(savedCoupon);

      const savedCart = JSON.parse(localStorage.getItem('server-template-cart') || '[]');

      if (Array.isArray(savedCart)) setCart(savedCart.filter(i => i?.product && Number.isInteger(i.product.id) && typeof i.product.name === 'string' && Number.isFinite(i.product.price) && i.product.price >= 0 && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 100).slice(0, 20));

    } catch { /* Storage can be unavailable in private browsing. */ }

    setHydrated(true);

    return () => { active = false; };

  }, []);



  useEffect(() => {

    if (!hydrated) return;

    try { localStorage.setItem('server-template-cart', JSON.stringify(cart)); localStorage.setItem('server-template-player', JSON.stringify(player)); } catch { /* Keep the in-memory basket functional. */ }

  }, [cart, player, hydrated]);



  useEffect(() => { if (hydrated) { try { localStorage.setItem('server-template-coupon', coupon); } catch { /* Keep the selected code in memory. */ } } }, [coupon, hydrated]);



  useEffect(() => {

    if (loading || catalog.error) return;

    setCart(current => current.flatMap(item => {

      const product = allProducts.find(p => p.id === item.product.id);

      return product && product.available !== false ? [{ product, quantity: product.quantityEnabled ? item.quantity : 1 }] : [];

    }));

  }, [loading, catalog.error, allProducts]);



  useEffect(() => {

    if (!toast) return;

    const timeout = setTimeout(() => setToast(''), 4000);

    return () => clearTimeout(timeout);

  }, [toast]);



  useEffect(() => {

    const url = new URL(window.location.href);

    const status = url.searchParams.get('checkout');

    if (!status || resumeStarted.current) return;

    resumeStarted.current = true;

    window.history.replaceState({}, '', window.location.pathname);

    if (status === 'resume') {

      setDialog('cart'); setCheckoutBusy(true);

      fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resume' }) })

        .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error); if (data.url) window.location.assign(data.url); })

        .catch((e: Error) => setCheckoutError(e.message || 'Could not resume checkout. Please try again.'))

        .finally(() => setCheckoutBusy(false));

    } else if (status === 'complete') {

      fetch('/api/checkout').then(r => r.json()).then(data => {

        if (data.complete) { setCart([]); setToast('Thank you for supporting the server! Your payment is confirmed.'); }

        else setToast('Your order is being checked. Keep your Tebex receipt for confirmation.');

      }).catch(() => setToast('Check your Tebex receipt for your order status.'));

    } else if (status === 'cancelled') { setToast('Checkout cancelled. Your items are still in your basket.'); }

  }, []);



  function navigate(next: Page) {
    setPage(next);
    if (window.matchMedia('(max-width: 650px)').matches) {
      requestAnimationFrame(() => document.getElementById('shop-content')?.scrollIntoView({ behavior: motionPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }));
    }
  }



  function browseRanks() { const c = catalog.categories.find(c => c.kind === 'rank'); if (c) navigate(`category-${c.id}`); requestAnimationFrame(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }

  function usePromotion() { setCoupon(config.promotion.code); setToast(`${config.promotion.code} added. Tebex will apply eligible savings at checkout.`); }

  function openProduct(p: Product) { setQuantity(1); setDetail(p); }

  function addToCart(product: Product, amount = 1) {

    if (loading || catalog.error) { setToast('Please wait for the store catalog to load.'); return; }

    if (product.available === false) { setToast('This package is coming soon.'); return; }

    if (product.optionsRequired) { setToast('This package needs custom options. Contact the server team to purchase it.'); return; }

    if (cart.some(i => i.product.currency !== product.currency)) { setToast('Choose packages in the same currency for one basket.'); return; }

    setCart(current => {

      const exists = current.find(i => i.product.id === product.id);

      if (exists) return current.map(i => i.product.id === product.id ? { ...i, quantity: product.quantityEnabled ? Math.min(100, i.quantity + amount) : 1 } : i);

      if (current.length >= 20) return current;

      return [...current, { product, quantity: product.quantityEnabled ? amount : 1 }];

    });

    setToast(`${product.name} added to your basket`); setDetail(null); setCheckoutError('');

  }

  function changeQuantity(id: number, amount: number) { setCart(current => current.map(i => i.product.id === id ? { ...i, quantity: Math.min(100, Math.max(1, i.quantity + amount)) } : i)); setCheckoutError(''); }

  async function copyAddress(address = config.serverAddress) {

    if (config.serverAddress.endsWith('.example')) { setDialog('join'); return false; }

    try { await navigator.clipboard.writeText(address); setToast('Server address copied.'); return true; } catch { setDialog('join'); return false; }

  }

  function login(e: React.FormEvent) {

    e.preventDefault(); const value = username.trim();

    const valid = platform === 'java' ? /^[a-zA-Z0-9_]{3,16}$/.test(value) : /^[a-zA-Z0-9_ .-]{1,16}$/.test(value);

    if (!valid) { setLoginError(platform === 'java' ? 'Enter a Java username with 3–16 letters, numbers, or underscores.' : 'Enter your Bedrock gamertag (up to 16 characters).'); return; }

    setPlayer({ username: value, platform }); setDialog(null); setLoginError(''); setToast(`Logged in as ${value}.`);

  }

  async function checkout() {

    if (catalog.mode === 'demo') { setCheckoutError('This is a preview store. Live payments will be available when the server owner connects Tebex.'); return; }

    if (!player) { setDialog('login'); return; }

    setCheckoutBusy(true); setCheckoutError('');

    try {

      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', player, items: cart.map(i => ({ id: i.product.id, quantity: i.quantity })), coupon: coupon.trim(), giftcard: giftcard.trim() }) });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Checkout could not be started.');

      if (!result.url) throw new Error('Tebex did not provide a checkout link. Please try again.');

      window.location.assign(result.url);

    } catch (e) { setCheckoutError(e instanceof Error ? e.message : 'Checkout is unavailable. Please try again.'); }

    finally { setCheckoutBusy(false); }

  }



  function renderProductCard(product: Product) {

    return <article key={product.id} className="product-card surface">

      <button className="product-visual-button" onClick={() => openProduct(product)} aria-label={`View ${product.name}`}><ProductArt product={product}/></button>

      <div className="product-card-body">

        <div className="product-title-row"><h3 style={product.kind === 'keys' ? { color: product.color } : undefined}>{product.name}</h3>{product.kind === 'rank' && <span className="mini-label">{product.recurring ? 'Subscription' : 'One-time'}</span>}</div>

        <p className="product-subtitle">{product.acquisition === 'vote' ? 'Earned by voting for the server.' : product.acquisition === 'staff' ? 'Issued by the server staff.' : product.rank ? `${product.rank.homes} homes · ${product.rank.vaults} vaults · daily ${product.rank.kit} kit` : product.kind === 'rank' ? 'Minecraft server rank.' : product.kind === 'coins' ? 'Spend in the in-game store.' : 'One physical crate key.'}</p>

        <PackagePrice product={product}/>

        {product.quantityEnabled && !product.acquisition && <label className="card-quantity"><span className="label">Quantity</span><select className="quantity-select" value={cardQuantity[product.id] || 1} disabled={product.available === false} onChange={e => setCardQuantity({ ...cardQuantity, [product.id]: Number(e.target.value) })} aria-label={`Quantity of ${product.name}`}>{[1, 2, 3, 5, 10, 20].map(q => <option key={q} value={q}>{q} × {fmt(product.price * q, product.currency)}</option>)}</select></label>}

        <button className="button buy-button purchase-button" onClick={() => addToCart(product, cardQuantity[product.id] || 1)} disabled={loading || !!catalog.error || product.available === false || product.optionsRequired}><ShoppingBag size={16}/>{purchaseLabel(product)}</button>

        <button className="text-button details-link" onClick={() => openProduct(product)}>{product.kind === 'rank' ? 'View perks' : 'View details'} <ChevronRight size={12}/></button>

      </div>

    </article>;

  }

  const categories = [...catalog.categories].sort((a, b) => ['rank', 'keys', 'coins', 'other'].indexOf(a.kind) - ['rank', 'keys', 'coins', 'other'].indexOf(b.kind));



  return <div className={`storefront shop-site ${motionPaused ? 'motion-paused' : ''}`}>

    <button className="motion-toggle motion-toggle-fixed" aria-label={motionPaused ? 'Play animations' : 'Pause animations'} aria-pressed={motionPaused} onClick={() => setMotionPaused(!motionPaused)}>{motionPaused ? <Play size={14}/> : <Pause size={14}/>}</button>



          <div className="account-tools"><h2 className="store-title" aria-label={`${config.name} store`}><MinecraftText text={config.name} height={18} iron/><MinecraftText text="store" height={18} shadow/></h2><div className="header-actions"><CurrencySelect/><button className="button basket-button" onClick={() => setDialog('cart')} aria-label={`Open basket, ${count} items`}><ShoppingBag size={20}/><span>Basket</span><b className="pill basket-count" key={count}>{count}</b></button></div></div>
    <ServerBanner paused={motionPaused}/>
    <div className="site-shell">

    {homePrototype && <HomePrototypePicker value={homePrototype} change={changeHomePrototype}/>}
    <main className="container">

      

      <div className="site-columns">
      <aside className="side-panel"><div className="sidebar-login"><span>WELCOME TO {config.name.toUpperCase()}</span><button className="button login-button" onClick={() => { setUsername(player?.username || ''); setPlatform(player?.platform || 'java'); setDialog('login'); }}><span className="login-character">{player ? <ItemModel key={`${player.platform}:${player.username}`} name="player_skin" skinUrl={`/api/player/skin?username=${encodeURIComponent(player.username)}&platform=${player.platform}`} fallbackSrc={'/assets/render/demo_skin-right.svg'} motion="still" facing="right"/> : <ItemModel name="demo_skin" skinUrl={config.loginSkin || undefined} motion="still" facing="right"/>}</span><span className="login-copy"><strong>{player?.username || 'Log in to start shopping'}</strong>{player && <small>Change account</small>}</span><ArrowRight className="login-arrow" size={30}/></button></div>      <nav className="side-menu" aria-label="Store navigation"><button className={page === 'home' ? 'is-active' : ''} onClick={() => navigate('home')} aria-current={page === 'home' ? 'page' : undefined}><span className="menu-art"><ItemModel name="grass_block" motion="sway"/></span><MinecraftText text="Home"/>{page === 'home' && <span className="tab-ink"/>}</button>{categories.map(c => <button key={c.id} className={page === `category-${c.id}` ? 'is-active' : ''} aria-label={c.name} aria-current={page === `category-${c.id}` ? 'page' : undefined} onClick={() => navigate(`category-${c.id}`)}><span className="menu-art"><CategoryArt kind={c.kind}/></span><MinecraftText text={c.kind === 'keys' ? 'Keys' : c.name}/>{page === `category-${c.id}` && <span className="tab-ink"/>}</button>)}<button className={page === 'support' ? 'is-active' : ''} aria-label="Support" aria-current={page === 'support' ? 'page' : undefined} onClick={() => navigate('support')}><span className="menu-art"><ItemModel name="support_head" motion="sway"/></span><MinecraftText text="Help"/>{page === 'support' && <span className="tab-ink"/>}</button></nav></aside>

 

      <div className="content-panel" id="shop-content">
      {catalog.mode === 'demo' && <p className="demo-notice"><strong>Demo preview</strong> · Sample products. Live checkout is disabled.</p>}
      {page === 'home' && featured && <button className="featured-medallion" onClick={() => openProduct(featured)} aria-label={`Featured package: ${featured.name}`}><ProductArt product={featured} compact/><span><small>FEATURED PACKAGE</small><strong>{featured.name}</strong><b>{fmt(featured.price,featured.currency)}</b></span></button>}





      <div className="store-layout" ref={contentRef}><div className="store-content" ref={pageTransitionRef}>

        {catalog.error && <div className="error-banner surface" role="alert"><h2>Store unavailable</h2><p>{catalog.error}</p><button className="button" onClick={() => window.location.reload()}>Try again</button></div>}

        {loading && <div className="catalog-loading-note" role="status" aria-label="Loading store catalog"><LoaderCircle className="spin" size={16}/> Loading packages…</div>}

        {page === 'home' && <>{homePrototype && homePrototype !== 'cards' ? <StoreHomePrototype variant={homePrototype} browse={kind => { const target = catalog.categories.find(category => category.kind === kind); if (target) navigate(`category-${target.id}`); }}/> : <StoreHome products={allProducts} openProduct={openProduct} browse={kind => { const target = catalog.categories.find(category => category.kind === kind); if (target) navigate(`category-${target.id}`); }}/>}<PromotionBar applied={coupon.trim().toUpperCase() === config.promotion.code} useCoupon={usePromotion}/></>}
        {category && <>

          <div className="section-heading"><div><h2>{category.name}</h2><p>{category.kind === 'rank' ? 'Compare rank packages and billing.' : category.kind === 'coins' ? 'Credits are used in the in-game store.' : category.products.every(p => p.available === false) ? 'Store keys are coming soon.' : 'View crate rewards in-game before purchasing.'}</p></div>{category.kind === 'rank' && <button className="text-button compare-toggle" onClick={() => document.getElementById('rank-comparison')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Compare <ArrowDown size={14}/></button>}</div>

          <div className={`product-grid ${category.products.length === 1 ? 'single-product' : category.products.length === 4 ? 'four-products' : category.products.length > 4 && category.products.length % 2 !== 0 || category.products.length % 3 === 0 ? 'three-columns' : 'two-columns'}`}>{category.products.map(renderProductCard)}</div>

          {category.kind === 'rank' && <RankComparison products={category.products} addToCart={addToCart}/>}

          <CurrencyNote/><p className="category-note">{category.kind === 'keys' && category.products.every(p => p.available === false) ? 'Common, Rare, Legendary and Admin keys are coming soon.' : 'Delivered to the Minecraft account entered at checkout. Taxes and discounts are confirmed by Tebex.'}</p>

        </>}

        {page === 'support' && <section className="home-welcome-box"><h2>Server support</h2><p>Need help with the server or an order? Contact our team with your Minecraft username and transaction ID.</p><p><a className="button" href={config.discordUrl}>Open Discord <ExternalLink size={16}/></a></p><h3>Frequently asked questions</h3><div className="faq-list">{faq.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>}

      </div></div>

      </div><div className="buyer-area"><StoreBuyers/></div></div>

      <div className="socials"><a className="button" href={config.websiteUrl}>{config.name} <ExternalLink size={14}/></a><a className="button" href={config.discordUrl} target="_blank" rel="noreferrer"><span className="head-model"><ItemModel name="discord_head"/></span> Discord</a><button className="button support-button" onClick={() => { navigate('support'); contentRef.current?.scrollIntoView({ behavior: 'smooth' }); }}><span className="head-model"><ItemModel name="support_head"/></span> Support</button></div>

    </main>

    <footer className="site-footer container"><div className="footer-links"><a href={config.wikiUrl} target="_blank" rel="noreferrer">Wiki</a><a href={config.legalNoticeUrl} target="_blank" rel="noreferrer">Legal notice</a><a href={config.privacyUrl} target="_blank" rel="noreferrer">Privacy</a><a href={config.termsUrl} target="_blank" rel="noreferrer">Terms</a><a href={config.withdrawalUrl} target="_blank" rel="noreferrer">Withdrawal</a><button onClick={() => setDialog('terms')}>Store info</button><span>Checkout by Tebex</span></div><p>© {new Date().getFullYear()} {config.name} · Not associated with Mojang or Microsoft.</p>{catalog.mode === 'demo' && <p>Preview store · Sample packages</p>}</footer>

    </div>



    {dialog === 'login' && <Modal title={player ? 'Your player account' : 'Log in'} onClose={() => setDialog(null)}><p className="modal-intro">Enter the Minecraft username that should receive your purchase.</p><form onSubmit={login}><label className="field-label">YOUR EDITION</label><div className="platform-toggle"><button type="button" className={platform === 'java' ? 'active' : ''} onClick={() => { setPlatform('java'); setLoginError(''); }}><Monitor size={18}/> Java Edition {platform === 'java' && <Check size={14}/>}</button><button type="button" className={platform === 'bedrock' ? 'active' : ''} onClick={() => { setPlatform('bedrock'); setLoginError(''); }}><Gamepad2 size={18}/> Bedrock {platform === 'bedrock' && <Check size={14}/>}</button></div><label className="field-label" htmlFor="username">{platform === 'bedrock' ? 'BEDROCK GAMERTAG' : 'MINECRAFT USERNAME'}</label><div className="input-with-icon"><UserRound size={18}/><input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder={platform === 'java' ? 'Your in-game username' : 'Your Xbox gamertag'} maxLength={16} autoComplete="username" required/></div>{platform === 'bedrock' && <p className="input-hint">We’ll add the server’s “{config.bedrockPrefix}” prefix automatically at checkout.</p>}{loginError && <p className="form-error" role="alert">{loginError}</p>}<button className="button primary full-width login-submit" type="submit">{player ? 'Update player' : 'Log in'} <ArrowRight size={16}/></button></form><div className="modal-footnote"><ShieldCheck size={14}/> Your Minecraft password is not required.</div>{player && <button className="text-button logout-button" onClick={() => { setPlayer(null); setDialog(null); setToast('You’ve logged out. Your basket is still here.'); }}><LogOut size={14}/> Log out</button>}</Modal>}



    {dialog === 'cart' && <Modal title="Your basket" drawer onClose={() => setDialog(null)}><div className="cart-player">{player ? <><PlayerAvatar key={`${player.platform}:${player.username}`} username={player.username} platform={player.platform}/><span>Account: <b>{player.username}</b><small>{player.platform === 'java' ? 'Java Edition' : 'Bedrock Edition'}</small></span><button className="text-button" onClick={() => { setUsername(player.username); setPlatform(player.platform); setDialog('login'); }}>Change</button></> : <><UserRound size={20}/><span>Select a Minecraft account.</span><button className="text-button" onClick={() => setDialog('login')}>Log in <ArrowRight size={12}/></button></>}</div><div className="cart-items">{cart.length ? cart.map(item => <div className="cart-item" key={item.product.id}><ProductArt product={item.product} compact/><div className="cart-item-info"><h3>{item.product.name}</h3><span>{fmt(item.product.price, item.product.currency)}{item.product.recurring ? ' · Recurring' : ''}</span><div className="cart-item-bottom">{item.product.quantityEnabled ? <div className="quantity-control"><button onClick={() => changeQuantity(item.product.id, -1)} disabled={item.quantity <= 1} aria-label={`Decrease ${item.product.name} quantity`}><Minus size={12}/></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.product.id, 1)} disabled={item.quantity >= 100} aria-label={`Increase ${item.product.name} quantity`}><Plus size={12}/></button></div> : <small>One-time package</small>}<button className="icon-button remove-item" aria-label={`Remove ${item.product.name}`} onClick={() => { setCart(cart.filter(i => i.product.id !== item.product.id)); setCheckoutError(''); }}><Trash2 size={14}/></button></div></div></div>) : <div className="empty-state"><ShoppingBag size={42}/><h3>Your basket is empty.</h3><p>Select a package to add it to your basket.</p><button className="button primary" onClick={() => { setDialog(null); browseRanks(); }}>Browse ranks <ArrowRight size={15}/></button></div>}</div>{cart.length > 0 && <div className="cart-summary"><details className="discount-details"><summary><Gift size={15}/> Have a coupon or gift card? <ChevronDown size={14}/></summary><label className="field-label" htmlFor="coupon">COUPON CODE</label><input id="coupon" placeholder="Enter coupon code" value={coupon} onChange={e => setCoupon(e.target.value)} maxLength={64}/><label className="field-label" htmlFor="giftcard">GIFT CARD</label><input id="giftcard" placeholder="Enter gift card number" value={giftcard} onChange={e => setGiftcard(e.target.value)} maxLength={64}/><p className="input-hint">Applied and validated by Tebex at checkout.</p></details>{config.promotion.enabled && coupon.trim().toUpperCase() === config.promotion.code && <div className="applied-promotion"><Gift size={15}/><span><b>{config.promotion.code}</b> · {config.promotion.percent}% off at checkout</span><button aria-label="Remove coupon" onClick={() => setCoupon('')}><X size={14}/></button></div>}<div className="subtotal"><span>Subtotal <small>{count} {count === 1 ? 'item' : 'items'}</small></span><b>{fmt(total, currency)} <small>{converted && currency === base ? code : currency}</small></b></div><p className="tax-note">Taxes and discounts calculated at checkout.</p><CurrencyNote className="tax-note"/>{checkoutError && <div className="form-error" role="alert">{checkoutError}</div>}<button className="button purchase-button full-width checkout-button" onClick={checkout} disabled={checkoutBusy || loading || !!catalog.error}>{checkoutBusy ? <LoaderCircle className="spin" size={18}/> : <LockKeyhole size={16}/>} {checkoutBusy ? 'Preparing your checkout…' : 'Continue to checkout'} {!checkoutBusy && <ArrowRight size={16}/>}</button><div className="modal-footnote"><ShieldCheck size={13}/> Checkout by <b>tebex</b></div></div>}</Modal>}



    {detail && <Modal title={detail.name} onClose={() => setDetail(null)}>

      <div className="detail-art"><ProductArt product={detail}/></div>

      <p className="modal-intro product-description">{detail.description}</p>

      {detail.features.length > 0 && <ul className="perk-list">{detail.features.map(feature => <li key={feature}><Check size={16}/>{feature}</li>)}</ul>}

      <div className="detail-purchase">

        <div><strong>{detail.acquisition ? purchaseLabel(detail) : fmt(detail.price, detail.currency)}</strong>

          <span>{detail.acquisition ? 'Not sold in the store' : `${converted && detail.currency === base ? code : detail.currency} \u00b7 ${detail.recurring ? 'Recurring subscription' : 'One-time purchase'}`}</span>

        </div>

        {detail.quantityEnabled && <div className="quantity-control"><button disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)} aria-label="Decrease quantity"><Minus size={14}/></button><span>{quantity}</span><button disabled={quantity >= 100} onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={14}/></button></div>}

      </div>

      {detail.optionsRequired && <p className="input-hint">This package requires custom options. Contact the server team for help purchasing.</p>}

      <button className="button purchase-button full-width" onClick={() => addToCart(detail, quantity)} disabled={detail.available === false || detail.optionsRequired || loading}>

        <ShoppingBag size={16}/> {purchaseLabel(detail)}{!detail.acquisition && <> &middot; {fmt(detail.price * quantity, detail.currency)}</>}<ArrowRight size={16}/>

      </button>

    </Modal>}



    {dialog === 'join' && <Modal title={`Join ${config.name}.`} onClose={() => setDialog(null)}><p className="modal-intro">Open Minecraft and add the server address below.</p><div className="join-address"><ServerStatus/><span className="field-label">SERVER ADDRESS</span><b>{config.serverAddress}</b></div>{config.serverAddress.endsWith('.example') && <p className="input-hint">This is a preview address. The server owner can set the real address in the store config.</p>}<div className="join-editions"><span><Monitor size={20}/><b>Java Edition</b><small>Multiplayer → Add Server</small></span><span><Gamepad2 size={20}/><b>Bedrock Edition</b><small>Servers → Add Server · Port {config.bedrockPort}</small></span></div></Modal>}

    {(dialog === 'terms' || dialog === 'privacy') && <Modal title={dialog === 'terms' ? 'Store information' : 'Your privacy'} onClose={() => setDialog(null)}>{dialog === 'terms' ? <div className="legal-copy"><p>Digital packages are supplied for use on {config.name} {config.suffix}. Review the package details, account name, billing schedule, and final price before placing an order.</p><p>Payments are processed by Tebex. Its checkout presents the applicable purchase terms, cancellation rights, and payment details for your order.</p><p>For help with an order, contact the server team or Tebex customer support with your transaction ID.</p><a href="https://checkout.tebex.io/terms" target="_blank" rel="noreferrer" className="text-button">Read Tebex checkout terms <ExternalLink size={13}/></a></div> : <div className="legal-copy"><p>This storefront saves your player name and basket in this browser so they are available when you return. Your username is used to look up your skin through Mojang or Geyser; player heads are rendered by this site. You can remove them by clearing this site’s browser data.</p><p>When you start checkout, your selected packages, Minecraft username, and IP address are sent to Tebex to create and process your order. Payment details are entered directly with Tebex.</p><p>A temporary secure session cookie is used to resume checkout. This site does not ask for or store your Minecraft password.</p><a href="https://checkout.tebex.io/privacy" target="_blank" rel="noreferrer" className="text-button">Read Tebex privacy policy <ExternalLink size={13}/></a></div>}</Modal>}

    {toast && <div className="toast" role="status"><span><Check size={16}/></span>{toast}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15}/></button></div>}

  </div>;

}

