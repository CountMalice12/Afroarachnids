import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

fs.mkdirSync('test-artifacts/video',{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--disable-gpu-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'
]});
let videoPath;
try {
 const context=await browser.newContext({
  viewport:{width:1070,height:608},deviceScaleFactor:1,
  recordVideo:{dir:'test-artifacts/video',size:{width:1070,height:608}}
 });
 const page=await context.newPage();
 page.on('pageerror',e=>console.log('PAGE ERROR:',String(e)));
 await page.goto('http://127.0.0.1:4173/flight.html?capture=1',{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#d4-stage canvas.webgl').waitFor({timeout:30000});
 await page.selectOption('#d4-quality','low');
 await page.waitForTimeout(1200);
 const error=await page.locator('#d4-error').innerText();
 if(error.trim())throw new Error(error);
 const samples=[
  ['earth','EARTH-LIMB PURSUIT',4800],
  ['debris','DEBRIS FIELD AMBUSH',4900],
  ['cordon','CRYSTAL PALACE CORDON',5700]
 ];
 for(const [id,title,period] of samples){
  console.log('Recording live 3D scene:',title);
  await page.locator('#d4-map-'+id).click();
  await page.locator('#d4-lock').click();
  await page.keyboard.down('w');
  await page.waitForTimeout(1200);
  await page.keyboard.down('a');
  await page.waitForTimeout(1150);
  await page.keyboard.up('a');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(900);
  await page.keyboard.up('ArrowUp');
  await page.locator('#d4-rail').click();
  await page.waitForTimeout(Math.max(450,period-3250));
  await page.keyboard.up('w');
 }
 console.log('Video capture reached all maps.');
 videoPath=await page.video().path();
 await context.close();
 const stat=fs.statSync(videoPath);
 console.log('Raw webm captured:',videoPath,stat.size,'bytes');
 if(stat.size<20000)throw new Error('Recording was nearly empty');
}finally {await browser.close()}
if(!videoPath)throw new Error('Missing recorded video');
const output='test-artifacts/Director4_Orbital_Real3D_Gameplay.mp4';
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',videoPath,
'-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
'-c:v','libx264','-preset','fast','-crf','23','-movflags','+faststart',output],
{timeout:200000,stdio:'inherit'});
console.log('DONE:',output,fs.statSync(output).size,'bytes');
