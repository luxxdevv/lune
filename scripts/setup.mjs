import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

if (Number(process.versions.node.split('.')[0]) !== 24) { console.error('Please install Node.js 24 from https://nodejs.org, then run setup again.'); process.exit(1); }
const settings = JSON.parse(readFileSync('site.config.json','utf8'));
console.log('\nMinecraft Server Template — setup\nPress Enter to keep any default. No API keys are needed for a preview.\n');
if (!process.argv.includes('--defaults')) {
  const input=createInterface({input:stdin,output:stdout});
  const ask=async(label,current,valid=()=>true)=>{while(true){const value=(await input.question(`${label} [${current}]: `)).trim()||current;if(valid(value))return value;console.log('Please enter a valid value.');}};
  const url=value=>{try{return /^https?:$/.test(new URL(value).protocol);}catch{return false;}};
  try {
    settings.serverName=await ask('Server name',settings.serverName,value=>value.length>0&&value.length<=40);
    settings.serverAddress=await ask('Minecraft address',settings.serverAddress,value=>/^[a-zA-Z0-9.:-]+$/.test(value));
    settings.bedrockAddress=settings.serverAddress;
    settings.storeUrl=(await ask('Store URL (keep localhost for a preview)',settings.storeUrl,url)).replace(/\/$/,'');
    settings.websiteUrl=settings.storeUrl+'/server';
    settings.discordUrl=await ask('Discord invite URL',settings.discordUrl,url);
    settings.currency=(await ask('Tebex base currency',settings.currency,value=>/^[A-Za-z]{3}$/.test(value))).toUpperCase();
  } finally { input.close(); }
  writeFileSync('site.config.json',JSON.stringify(settings,null,2)+'\n');
}
if (!existsSync('.env.local')) {
  const env=readFileSync('.env.example','utf8').replace(/^SESSION_SECRET=.*$/m,`SESSION_SECRET=${randomBytes(32).toString('hex')}`).replace(/^STORE_URL=.*$/m,`STORE_URL=${settings.storeUrl}`);
  writeFileSync('.env.local',env,{mode:0o600,flag:'wx'});
  console.log('Created .env.local with a new private session secret.');
} else {
  const existing=readFileSync('.env.local','utf8');
  const secret=existing.match(/^SESSION_SECRET=(.*)$/m)?.[1]?.trim();
  if(!secret || secret==='""' || secret==="''") {
    const line=`SESSION_SECRET=${randomBytes(32).toString('hex')}`;
    writeFileSync('.env.local',/^SESSION_SECRET=/m.test(existing)?existing.replace(/^SESSION_SECRET=.*$/m,line):existing+'\n'+line+'\n',{mode:0o600});
    console.log('Filled the missing session secret; kept your other environment settings.');
  } else { console.log('Kept your existing .env.local unchanged.'); }
  console.log('If you changed domains, update STORE_URL in .env.local too.');
}
console.log('\nReady! Run npm run dev and open http://localhost:3100\nEdit site.config.json to change branding, links, skins and community settings.\nFor live payments, follow SETUP.txt. Keep .env.local private.\n');
