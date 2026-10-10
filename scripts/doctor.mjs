import { existsSync, readFileSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
let errors=0;
const check=(ok,description)=>{console.log(`${ok?'OK':'FIX'}  ${description}`);if(!ok)errors++;};
check(Number(process.versions.node.split('.')[0])===24,'Use Node.js 24.');
let settings;try{settings=JSON.parse(readFileSync('site.config.json','utf8'));}catch{console.error('FIX  site.config.json is not valid JSON. Check commas and quotation marks.');process.exit(1);}
check(typeof settings.serverName==='string'&&settings.serverName.length>0,'Server name is set.');
let origin;try{origin=new URL(settings.storeUrl).origin;}catch{}
check(!!origin,'storeUrl is a complete URL (http://localhost:3100 or https://store.example.com).');
check(/^[A-Z]{3}$/.test(settings.currency),'Currency is a three-letter uppercase code matching Tebex.');
check(Number.isFinite(settings.community.goal)&&settings.community.goal>0,'Monthly goal is a positive number.');
try{new Intl.DateTimeFormat('en',{timeZone:settings.community.timeZone});check(true,'Community time zone is valid.');}catch{check(false,'Community time zone is valid, e.g. Europe/Berlin or UTC.');}
for(const key of ['logo','background'])check(typeof settings[key]==='string'&&settings[key].startsWith('/')&&existsSync('public'+settings[key]),`${key} points to a file inside public/.`);
const env=process.env;
if(!env.TEBEX_PUBLIC_TOKEN&&!env.TEBEX_PRIVATE_KEY){console.log('DEMO  No Tebex credentials set. Preview products work; payments are disabled.');}
else {
  check(!!env.TEBEX_PUBLIC_TOKEN&&!!env.TEBEX_PRIVATE_KEY,'Both Tebex Headless credentials are set (values are never printed).');
  check(!!env.SESSION_SECRET&&env.SESSION_SECRET.length>=32,'SESSION_SECRET has at least 32 characters. Run npm run setup to create one.');
  let envOrigin;try{envOrigin=new URL(env.STORE_URL).origin;}catch{}
  check(envOrigin===origin,'STORE_URL in .env.local matches storeUrl in site.config.json.');
  if(origin&&!origin.startsWith('http://localhost')&&!origin.startsWith('http://127.0.0.1')) {
    check(origin.startsWith('https://'),'Live checkout uses HTTPS.');
    check(!!env.TRUSTED_IP_HEADER,'Set TRUSTED_IP_HEADER to the header your hosting provider or proxy overwrites.');
  }
}
console.log(env.TEBEX_PLUGIN_SECRET?'OPTIONAL  Goal and gift-card integration enabled.':'OPTIONAL  Set TEBEX_PLUGIN_SECRET for live goal totals and gift-card balances.');
console.log(errors?`\nFix ${errors} item(s), then run npm run doctor again.`:'\nConfiguration checks passed.');
process.exitCode=errors?1:0;
