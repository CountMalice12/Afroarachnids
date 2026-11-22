import { chromium } from 'playwright';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
fs.mkdirSync('test-artifacts/palace',{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--disable-gpu-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'
]});
let video;
try{
 const ctx=await browser.newContext({viewport:{width:1100,height:620},deviceScaleFactor:1,
  recordVideo:{dir:'test-artifacts/palace',size:{width:1100,height:620}}});
 const page=await ctx.newPage();
 page.on('pageerror',e=>console.error('PAGE ERROR',e.message));
 await page.goto('http://127.0.0.1:4173/palace.html?capture=1',{waitUntil:'domcontentloaded',timeout:35000});
 await page.locator('#cp-stage canvas').waitFor({timeout:35000});
 await page.waitForTimeout(500);
 if((await page.locator('#cp-error').innerText()).trim())throw Error('Renderer startup failed');
 for(let i=1;i<=10;i++){
  const id='CP-'+String(i).padStart(2,'0');
  console.log('RECORD SCENE',id);
  await page.locator('#cp-btn-'+id).click();
  await page.waitForTimeout(1200);
  if(i===3){
   await page.locator('#cp-fire').click();
   await page.waitForTimeout(260);
   await page.locator('#cp-end').click();
   await page.keyboard.press('w');
   await page.waitForTimeout(400);
   await page.locator('#cp-alert').click()
  }
 }
 video=await page.video().path();
 await ctx.close();
 console.log('ORIGINAL BROWSER VIDEO',video);
}finally{await browser.close()}
if(!video||fs.statSync(video).size<10000)throw Error('Video missing or empty');
const output='test-artifacts/Director4_CrystalPalace_10Sector_Real3D.mp4';
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',video,
 '-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
 '-c:v','libx264','-preset','fast','-crf','24','-movflags','+faststart',output],
{timeout:200000,stdio:'inherit'});
console.log('SUCCESS:',output,fs.statSync(output).size,'bytes');
