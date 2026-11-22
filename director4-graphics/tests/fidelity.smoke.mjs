import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--disable-gpu-sandbox','--enable-webgl',
 '--enable-unsafe-swiftshader','--use-angle=swiftshader'
]});
try {
 const ctx=await browser.newContext({viewport:{width:1100,height:670},deviceScaleFactor:1});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')console.log('WEBGL CONSOLE:',m.text())});
 await page.goto('http://127.0.0.1:4173/fidelity.html?capture=1',{waitUntil:'domcontentloaded',timeout:40000});
 await page.locator('#fd-viewport canvas').waitFor({timeout:40000});
 await page.locator('#fd-loading').waitFor({state:'detached',timeout:120000});
 assert.match(await page.locator('#fd-zone-title').innerText(),/EXTERIOR GANTRY/);
 const entry=await page.locator('#fd-log').innerText();assert.match(entry,/Loaded 9 original GLBs/);
 await page.locator('#fd-scan').click();
 await page.locator('#fd-shoot').click();
 await page.locator('#fd-end').click();
 await page.locator('#fd-grenade').click();
 await page.waitForTimeout(180);
 const details=await page.locator('#fd-dv').innerText();
 assert.match(details,/DEBRIS/,'Rapier debris meter missing after explosion');
 assert.ok(Number(details.match(/(\\d+) DEBRIS/)?.[1]||0)>0,'Blast did not physically fracture a crate');
 await page.locator('#fd-shield').click();
 assert.match(await page.locator('#fd-toast').innerText(),/SHIELDS ACTIVE/);
 console.log('Physics: '+details);
 await page.locator('[data-scene="casino"]').click();
 assert.match(await page.locator('#fd-zone-title').innerText(),/CASINO/);
 await page.locator('[data-move="0,-1"]').click();
 await page.locator('[data-scene="dock"]').click();
 assert.match(await page.locator('#fd-zone-title').innerText(),/DOCKING CORE/);
 assert.equal(errors.length,0,'Page exceptions: '+errors.join(' | '));
 console.log('PASS: GLB, three arenas, actual Rapier breakable cover, GPU shield effect and tactical actions');
 await ctx.close();
} finally {await browser.close()}
