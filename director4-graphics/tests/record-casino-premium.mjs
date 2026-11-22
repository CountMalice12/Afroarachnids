import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
fs.mkdirSync('test-artifacts/casino-premium',{recursive:true});
const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-gpu-sandbox','--enable-webgl',
  '--enable-unsafe-swiftshader','--use-angle=swiftshader'
]});
let orig=null;
try{
 const ctx=await browser.newContext({viewport:{width:1100,height:630},deviceScaleFactor:1,
  recordVideo:{dir:'test-artifacts/casino-premium',size:{width:1100,height:630}}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message)});
 page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERROR',m.text().slice(0,250))});
 await page.goto('http://127.0.0.1:4173/fidelity.html?capture=1&renderMaterial=1',{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#fd-viewport canvas').waitFor({timeout:60000});
 await page.locator('#fd-loading').waitFor({state:'detached',timeout:145000});
 const name=await page.locator('#fd-zone-title').innerText();
 if(!name.includes('CASINO'))throw Error('The Casino is not the default visual showcase: '+name);
 const log=await page.locator('#fd-log').innerText();
 if(!log.includes('Rebuilt photorealism-oriented Casino'))throw Error('Premium 3D casino hero assets did not load: '+log.slice(0,300));
 console.log('CASINO PREMIUM SCENE INITIALIZED',name);
 await page.waitForTimeout(1800);
 await page.evaluate(()=>document.querySelector('#fd-film').click());
 await page.waitForTimeout(1700);
 const vp=await page.locator('#fd-viewport').boundingBox();
 await page.mouse.move(vp.x+vp.width*.58,vp.y+vp.height*.43);
 await page.mouse.down();
 await page.mouse.move(vp.x+vp.width*.63,vp.y+vp.height*.50,{steps:14});
 await page.mouse.up();
 await page.waitForTimeout(1600);
 await page.evaluate(()=>document.querySelector('#fd-film').click());
 await page.waitForTimeout(1000);
 await page.evaluate(()=>document.querySelector('#fd-scan').click());
 await page.waitForTimeout(850);
 await page.evaluate(()=>document.querySelector('#fd-grenade').click());
 await page.waitForTimeout(1400);
 console.log('PHYSICS AFTER BREACH',await page.locator('#fd-dv').innerText());
 await page.evaluate(()=>document.querySelector('#fd-shield').click());
 await page.waitForTimeout(900);
 await page.evaluate(()=>document.querySelector('#fd-film').click());
 await page.waitForTimeout(1800);
 orig=await page.video().path();
 await ctx.close();
 if(errors.length)console.warn('PAGE WARNINGS:',errors.slice(0,5));
}finally{await browser.close()}
if(!orig||fs.statSync(orig).size<10000)throw Error('No usable real-time browser recording');
const output='test-artifacts/Director4_CrystalPalace_PremiumCasino_3D.mp4';
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',orig,
 '-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
 '-c:v','libx264','-preset','fast','-crf','21','-movflags','+faststart',output],
 {timeout:200000,stdio:'inherit'});
console.log('COMPLETE PREMIUM CASINO VIDEO:',output,'bytes',fs.statSync(output).size);
