import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
fs.mkdirSync('test-artifacts/casino-premium',{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--disable-gpu-sandbox','--enable-webgl',
 '--enable-unsafe-swiftshader','--use-angle=swiftshader'
]});
let original;
try{
 const ctx=await browser.newContext({
  viewport:{width:960,height:540},deviceScaleFactor:1,
  recordVideo:{dir:'test-artifacts/casino-premium',size:{width:960,height:540}}
 });
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('ERROR',e.message)});
 await page.goto('http://127.0.0.1:4173/fidelity.html?capture=1&renderMaterial=1',
   {waitUntil:'domcontentloaded',timeout:50000});
 await page.locator('#fd-viewport canvas').waitFor({timeout:45000});
 await page.locator('#fd-loading').waitFor({state:'detached',timeout:180000});
 const name=await page.locator('#fd-zone-title').innerText();
 const messages=await page.locator('#fd-log').innerText();
 if(!name.includes('CASINO')||!messages.includes('Architectural envelope'))
  throw Error('Fully modeled Casino failed to initialize: '+name+' / '+messages.slice(0,300));
 console.log('Verified latest Casino architecture:',name);
 console.log('Model registry:',messages.slice(0,700));
 await page.waitForTimeout(800);
 await page.evaluate(()=>document.querySelector('#fd-film').click());
 await page.waitForTimeout(2600);
 await page.evaluate(()=>document.querySelector('#fd-grenade').click());
 await page.waitForTimeout(1100);
 console.log('Destruction renderer:',await page.locator('#fd-dv').innerText());
 await page.waitForTimeout(1000);
 await page.evaluate(()=>document.querySelector('#fd-shield').click());
 await page.waitForTimeout(800);
 original=await page.video().path();
 await ctx.close();
 if(errors.length)console.warn('Browser warnings',errors.slice(0,4));
}finally{await browser.close()}
if(!original||fs.statSync(original).size<10000)throw Error('Video recording unavailable');
const out='test-artifacts/Director4_CrystalPalace_PremiumCasino_3D.mp4';
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',original,
 '-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
 '-c:v','libx264','-preset','fast','-crf','22','-movflags','+faststart',out],
 {timeout:150000,stdio:'inherit'});
console.log('Latest luxury Casino live renderer video',out,fs.statSync(out).size);
