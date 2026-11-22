import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
// Capture revision 3: CC0 scanned PBR materials, authored architectural dressing and cinematic composition.
fs.mkdirSync('test-artifacts/fidelity-video',{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--disable-gpu-sandbox','--enable-webgl',
 '--enable-unsafe-swiftshader','--use-angle=swiftshader'
]});
let video;
try {
 const context=await browser.newContext({
  viewport:{width:960,height:540},deviceScaleFactor:1,
  recordVideo:{dir:'test-artifacts/fidelity-video',size:{width:960,height:540}}
 });
 const page=await context.newPage();
 page.on('pageerror',e=>console.error('PAGE EXCEPTION:',e.message));
 await page.goto('http://127.0.0.1:4173/fidelity.html?capture=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#fd-viewport canvas').waitFor({timeout:45000});
 await page.locator('#fd-loading').waitFor({state:'detached',timeout:130000});
 console.log('GLBs loaded; recording live 3D materials and camera.');
 const stage=page.locator('#fd-viewport');const r=await stage.boundingBox();
 // Exterior: show deck, real bulkhead and ring, crew movement, scanning and attack.
 await page.waitForTimeout(1200);
 await page.mouse.move(r.x+r.width*.58,r.y+r.height*.43);
 await page.mouse.down();await page.mouse.move(r.x+r.width*.68,r.y+r.height*.46,{steps:8});await page.mouse.up();
 await page.waitForTimeout(800);
 await page.keyboard.press('w');await page.keyboard.press('d');
 await page.locator('#fd-scan').click();await page.waitForTimeout(800);
 await page.locator('#fd-shoot').click();await page.waitForTimeout(500);
 await page.locator('#fd-alarm').click();await page.waitForTimeout(450);
 await page.locator('#fd-camera').click();await page.waitForTimeout(500);
 // Casino: real reflective marble material, ring-balcony geometry and crystal feature.
 console.log('Switching scene: casino');
 await page.locator('[data-scene="casino"]').click();await page.waitForTimeout(500);
 await page.locator('#fd-camera').click();await page.waitForTimeout(600);
 await page.locator('#fd-scan').click();await page.waitForTimeout(950);
 await page.locator('#fd-shoot').click();await page.waitForTimeout(1000);
 // Dock: actual ships, engineered dock assets and material reflections.
 console.log('Switching scene: docking');
 await page.locator('[data-scene="dock"]').click();await page.waitForTimeout(1200);
 await page.keyboard.press('a');await page.keyboard.press('w');await page.waitForTimeout(700);
 await page.locator('#fd-scan').click();await page.waitForTimeout(600);
 video=await page.video().path();
 await context.close();
}finally{await browser.close()}
if(!video||fs.statSync(video).size<15000)throw Error('No usable WebGL capture');
const output='test-artifacts/Director4_CrystalPalace_Authored_Assets_Gameplay.mp4';
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',video,
 '-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
 '-c:v','libx264','-preset','fast','-crf','23','-movflags','+faststart',output],
 {stdio:'inherit',timeout:200000});
console.log('VIDEO OUTPUT:',output,fs.statSync(output).size);
