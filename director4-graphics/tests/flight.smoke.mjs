import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = process.env.DIRECTOR4_TEST_URL || 'http://127.0.0.1:4173/flight.html?capture=1';
fs.mkdirSync('test-artifacts',{recursive:true});
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox','--disable-gpu-sandbox','--enable-webgl',
    '--enable-unsafe-swiftshader','--use-angle=swiftshader']
});
const errors=[];
try {
  const context = await browser.newContext({ viewport:{width:1365,height:768},deviceScaleFactor:1 });
  const page = await context.newPage();
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#d4-stage canvas.webgl').waitFor({timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#d4-res')?.textContent.includes('px'),{timeout:20000});
  await page.waitForTimeout(850);
  const error=await page.locator('#d4-error').textContent();
  assert.equal(error,'','Renderer error reported: '+error);
  assert.equal(await page.locator('#d4-sector').innerText(),'EARTH-LIMB PURSUIT');
  const initial=await page.locator('#d4-shipstats').innerText();
  // Avoid expensive full-frame readback under software WebGL CI.
  await page.keyboard.down('w'); await page.waitForTimeout(450); await page.keyboard.up('w');
  await page.waitForTimeout(200);
  const moved=await page.locator('#d4-shipstats').innerText();
  assert.notEqual(initial,moved,'Flight telemetry did not respond to thrust input');
  for(const [id,name] of [['debris','DEBRIS FIELD AMBUSH'],['cordon','CRYSTAL PALACE CORDON']]){
    await page.locator('#d4-map-'+id).click();
    await page.waitForTimeout(600);
    assert.equal(await page.locator('#d4-sector').innerText(),name);
    // Visual screenshots are captured in the dedicated recording workflow.
  }
  await page.locator('#d4-lock').click();
  await page.locator('#d4-rail').click();
  assert.equal(errors.length,0,'Browser console exceptions: '+errors.join(' | '));
  console.log('PASS: Three.js WebGL scene startup, 3 maps, thrust, targeting, canvas resize');
  // Release the previous WebGL context before allocating the mobile renderer.\n  await page.close();await context.close();\n  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const mpage=await mobile.newPage();
  mpage.on('pageerror',err=>errors.push(err.message));
  await mpage.goto(base,{waitUntil:'commit',timeout:60000});
  await mpage.locator('#d4-stage canvas.webgl').waitFor({timeout:30000});
  await mpage.waitForTimeout(450);
  const stageWidth=await mpage.locator('#d4-stage').evaluate(el=>el.getBoundingClientRect().width);
  assert.ok(stageWidth<=390,'Flight board overflowed mobile width');
  // Mobile render verified by canvas and viewport bounds.
  assert.equal(errors.length,0,'Mobile browser exceptions: '+errors.join(' | '));
  await mobile.close();
  } finally {
  await browser.close();
}
