import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({
  headless:true,
  args:['--no-sandbox','--disable-gpu-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
});
try {
 const page=await browser.newPage({viewport:{width:750,height:560},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4173/palace.html?capture=1',{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#cp-stage canvas').waitFor({timeout:20000});
 await page.waitForTimeout(700);
 assert.equal(await page.locator('#cp-error').innerText(),'','WebGL initialization failed');
 const floors=['Docking Core','Immigration & Customs','Starburst Casino','Celestial Hotel',
  'Glass Biosphere','Habitation Quarter','Industrial Torus','Orbital Medtech Archive',
  'Administration Spindle','Exterior Service Gantry'];
 for(let i=1;i<=10;i++){
  const name='CP-'+String(i).padStart(2,'0');
  await page.locator('#cp-btn-'+name).click();
  await page.waitForTimeout(70);
  const title=await page.locator('#cp-title').innerText();
  assert.ok(title.includes(name),name+' failed to activate: '+title);
  assert.ok((await page.locator('#cp-status').innerText()).includes('PLAYABLE OBJECTS'),'No physics map on '+name);
  console.log(name+' OK '+floors[i-1]);
 }
 await page.locator('#cp-btn-CP-03').click();
 await page.locator('#cp-fire').click();
 assert.ok((await page.locator('#cp-actions-left').innerText()).includes('SPENT'),'Fire did not spend action');
 await page.locator('#cp-end').click();
 assert.ok((await page.locator('#cp-actions-left').innerText()).includes('READY'),'Turn did not refresh');
 await page.locator('#cp-alert').click();
 await page.locator('#cp-debug').click();
 assert.equal(errors.length,0,'Page exceptions: '+errors.join(' | '));
 await page.close();
 console.log('PASS: all ten 3D sectors load, tactical actions, physics registry, combat and alarms.');
} finally{await browser.close()}
