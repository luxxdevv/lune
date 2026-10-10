# Minecraft Server Website & Tebex Store

Version 1.0.0 · Next.js 16 · React 19 · TypeScript · Three.js

A customizable Minecraft server website and standalone Tebex storefront. Includes the complete source code, original vector demo icons and characters, a sky background, responsive layouts and a guided setup.

**Start with `SETUP.txt`. No API keys are needed to try the demo.**

## Quick start

1. Install **Node.js 24** from https://nodejs.org.
2. Extract the ZIP. Open the extracted folder, not the ZIP itself.
3. On Windows, double-click **START-WINDOWS.cmd**. On macOS/Linux, open a terminal in the folder and run `sh start-here.sh`.
4. Answer the short setup questions. Press Enter to keep a default.
5. Open **http://localhost:3100** for the store, or **http://localhost:3100/server** for the server website.

Keep the terminal open while previewing. Press Ctrl+C to stop.

Prefer terminal commands?

```sh
npm ci
npm run setup
npm run dev
```

## Included

- Store homepage, featured packages and illustrated category links.
- Live Tebex categories, prices, package details, basket and hosted checkout.
- Java and Bedrock username entry; account skin and avatar lookups.
- Coupon and gift-card redemption during checkout.
- Optional gift-card balance lookup and a monthly community goal.
- Public top-customer activity and recent buyer faces from Tebex.
- Server homepage with news, FAQ, staff, server status and Discord links.
- Gentle 3D item motion, stationary login character, upper-sky particles and motion controls.
- Phone layout with a fixed bottom menu, compact product cards and accessible forms.
- Public configuration file, setup wizard, diagnostic command and hosting examples.

## Customize without searching through the code

| Change | File |
| --- | --- |
| Server name, address, Discord, URLs, skins, goal, staff and FAQ | `site.config.json` |
| Your private Tebex credentials and session secret | `.env.local` (created on your computer) |
| Logo | Replace `public/assets/logo/server.svg`, or change `logo` in the settings |
| Background | Replace `public/assets/sky.png`, or change `background` in the settings |
| News posts | `public/news.json` |
| Colours and custom styling | `src/app/theme.css` |
| Demo products | `src/lib/catalog.ts` |
| Real categories, package descriptions, prices and delivery | Your Tebex dashboard |

After changing public settings or styling on a live server, rebuild and restart the app.

## Requirements and product type

This is a **self-hosted Next.js website using Tebex Headless**, not a Twig theme uploaded to the Tebex template editor. It needs Node.js hosting or Docker. Static-only hosting cannot run its checkout APIs.

You need your own Tebex store and Headless credentials for live payments. The optional goal and balance widgets additionally use a Tebex game-server Plugin API key. Delivery commands, available payment methods and package eligibility are managed by Tebex and your game server. No game-server plugins or rank permissions are included.

The demo works without credentials and cannot charge a payment. It contains clearly labelled sample products. When you connect your account, your actual Tebex products replace those samples. Unrecognized category names remain available with their Tebex package images; use names containing Ranks, Keys/Crates or Credits/Coins for the matching themed illustrations.

Packages requiring custom checkout variables/options show “Options required” and cannot be added through this template. Configure those packages without required custom variables, or extend the form before offering them here.

## Useful commands

```sh
npm run setup      # Set public details; create a private local session secret
npm run doctor     # Check configuration without printing secrets
npm run dev        # Local preview
npm run build      # Production build
npm start          # Production server
npm test           # Integration-data validation tests
npm run typecheck  # TypeScript check
```

## Files and support

`SETUP.txt` covers connecting Tebex, hosting, common problems and file replacement. `THIRD-PARTY-NOTICES.md` describes bundled assets and dependencies. `LICENSE.txt` explains where the purchase licence applies.

For template support, contact the seller through the resource's BuiltByBit support channel. Include your Node version, hosting type, the error message and steps to reproduce. **Do not send API keys, `.env.local`, payment details or your session secret.**
