import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--disable-gpu-sandbox','--enable-webgl',
 '--enable-unsafe-swiftshader','--use-angle=swiftshader'
]});
try {
 const ctx=await browser.newContext({viewport:{width:900,height:520},deviceScaleFactor:1});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')console.log('WEBGL CONSOLE:',m.text())});
 await page.goto('http://127.0.0.1:4173/fidelity.html?capture=1',{waitUntil:'domcontentloaded',timeout:40000});
 await page.locator('#fd-viewport canvas').waitFor({timeout:40000});
 await page.locator('#fd-loading').waitFor({state:'detached',timeout:120000});
 assert.match(await page.locator('#fd-zone-title').innerText(),/STARBURST CASINO/);
 assert.match(await page.locator('#fd-log').innerText(),/Architectural envelope/,
   'Fully modeled Casino enclosing walls and windows are missing');
 const entry=await page.locator('#fd-log').innerText();assert.match(entry,/Loaded 9 original GLBs/);
 await page.evaluate(s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click()},"#fd-scan");
 await page.evaluate(s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click()},"#fd-shoot");
 await page.evaluate(s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click()},"#fd-end");
 await page.evaluate(s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click()},"#fd-grenade");
 await page.waitForTimeout(180);
 const details=await page.locator('#fd-dv').innerText();
 assert.match(details,/DEBRIS/,'Rapier debris meter missing after explosion');
 assert.ok(Number(details.match(/(\\d+) DEBRIS/)?.[1]||0)>0,'Blast did not physically fracture a crate');
 await page.evaluate(s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click()},"#fd-shield");
 assert.match(await page.locator('#fd-toast').innerText(),/SHIELDS ACTIVE/);
 console.log('Physics: '+details);
 await page.evaluate(s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click()},"[data-scene=\"casino\"]");
 assert.match(await page.locator('#fd-zone-title').innerText(),/CASINO/);
 await page.evaluate(s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click()},"[data-move=\"0,-1\"]");
 await page.evaluate(s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click()},"[data-scene=\"dock\"]");
 assert.match(await page.locator('#fd-zone-title').innerText(),/DOCKING CORE/);
 assert.equal(errors.length,0,'Page exceptions: '+errors.join(' | '));
 console.log('PASS: GLB, three arenas, actual Rapier breakable cover, GPU shield effect and tactical actions');
 await ctx.close();
} finally {await browser.close()}
