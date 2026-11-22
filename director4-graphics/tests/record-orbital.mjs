import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT=path.resolve('test-artifacts','video');
fs.mkdirSync(OUT,{recursive:true});
const pageErrors=[];
const browser=await chromium.launch({
 headless:true,
 args:['--no-sandbox','--disable-gpu-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
});
try {
 const context=await browser.newContext({viewport:{width:1250,height:704},deviceScaleFactor:1});
 const page=await context.newPage();
 page.on('pageerror',e=>pageErrors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')console.log('BROWSER ERROR:',m.text())});
 console.log('Loading DIRECTOR 4.0 3D flight renderer...');
 await page.goto('http://127.0.0.1:4173/flight.html',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#d4-stage canvas.webgl').waitFor({timeout:35000});
 await page.selectOption('#d4-quality','low');
 await page.waitForTimeout(1800);
 const startupError=await page.locator('#d4-error').innerText();
 if(startupError.trim())throw new Error(startupError);
 const sections=[
   {id:'earth',name:'EARTH-LIMB PURSUIT',count:23},
   {id:'debris',name:'DEBRIS FIELD AMBUSH',count:23},
   {id:'cordon',name:'CRYSTAL PALACE CORDON',count:28},
 ];
 let frame=0;
 for(const item of sections){
   console.log('Rendering',item.name);
   await page.locator('#d4-map-'+item.id).click();
   await page.waitForTimeout(650);
   await page.locator('#d4-lock').click();
   await page.keyboard.down('KeyW');
   for(let i=0;i<item.count;i++){
     if(i===5)await page.keyboard.down('KeyA');
     if(i===12)await page.keyboard.up('KeyA');
     if(i===13)await page.keyboard.down('ArrowUp');
     if(i===18)await page.keyboard.up('ArrowUp');
     if(i===16)await page.locator('#d4-rail').click({timeout:10000});
     if(i===21)await page.locator('#d4-missile').click({timeout:10000});
     await page.waitForTimeout(95);
     const num=String(frame).padStart(4,'0');
     await page.screenshot({path:path.join(OUT,'frame-'+num+'.png'),animations:'disabled',timeout:30000});
     frame++;
   }
   await page.keyboard.up('KeyW').catch(()=>{});
   await page.keyboard.up('KeyA').catch(()=>{});
   await page.keyboard.up('ArrowUp').catch(()=>{});
 }
 if(pageErrors.length)console.log('PAGE ERRORS: '+pageErrors.join(' | '));
 if(frame<55)throw new Error('Not enough real rendered frames');
 console.log('Encoded frame count',frame);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','9','-i',path.join(OUT,'frame-%04d.png'),
 '-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p',
 '-c:v','libx264','-preset','fast','-crf','25','-movflags','+faststart',
 path.resolve('test-artifacts','Director4_Orbital_Real3D_Gameplay.mp4')],{stdio:'inherit',timeout:200000});
 console.log('VIDEO READY: test-artifacts/Director4_Orbital_Real3D_Gameplay.mp4');
}finally {await browser.close()}
