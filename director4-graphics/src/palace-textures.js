/**
 * Runtime-generated, reproducible PBR-style architectural texture channels.
 * Based on the existing cinema artwork's marble/brass/steel visual direction.
 * These are not photographic PBR assets and do not claim AAA photorealism.
 */
const clamp=(v,a=0,b=255)=>Math.max(a,Math.min(b,v));
export function generatePalaceMaterials(T){
 const size=512,pix=size*size,base=new Uint8Array(pix*4),normal=new Uint8Array(pix*4),rough=new Uint8Array(pix*4);
 const height=new Float32Array(pix);
 function noise(x,y){return Math.sin(x*12.773+y*37.719)*24117.772%1}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size;
  const warped=u+Math.sin(v*26+Math.cos(u*15)*3.2)*.035;
  const veins=Math.sin(warped*67+Math.cos(v*39)*1.9+Math.sin((warped+v)*32)*1.2);
  const stripes=Math.pow(Math.abs(veins),18);
  const flecks=(Math.sin(x*13.17+y*21.4)*Math.sin(y*3.4-x*14.3))*.05;
  height[y*size+x]=stripes*.15+flecks;
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,j=i*4,h=height[i];
  const tile=Math.min(x%128,128-x%128,y%128,128-y%128)<2;
  const shade=clamp(182+Math.sin(x*.07+y*.11)*17-h*112);
  base[j]=tile?162:shade;base[j+1]=tile?127:clamp(shade+4);
  base[j+2]=tile?87:clamp(shade+14);base[j+3]=255;
  const dx=height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size];
  const dy=height[((y+1)%size)*size+x]-height[((y+size-1)%size)*size+x];
  const d=Math.hypot(dx,dy,1);
  normal[j]=127+(-dx/d)*64;normal[j+1]=127+(-dy/d)*64;normal[j+2]=127+127/d;normal[j+3]=255;
  const r=clamp(80+h*100+(tile?45:0));
  rough[j]=r;rough[j+1]=r;rough[j+2]=r;rough[j+3]=255;
 }
 const texture=(bytes,srgb=false)=>{
  const tex=new T.DataTexture(bytes,size,size,T.RGBAFormat);
  tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(6,4);
  tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;
  tex.generateMipmaps=true;if(srgb)tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;tex.needsUpdate=true;
  return tex
 };
 const floorMap=texture(base,true),floorNormal=texture(normal),floorRoughness=texture(rough);
 return {
  marble:new T.MeshPhysicalMaterial({color:0xccccd9,map:floorMap,
    normalMap:floorNormal,normalScale:new T.Vector2(.5,.5),
    roughness:.29,roughnessMap:floorRoughness,metalness:.17,
    clearcoat:.9,clearcoatRoughness:.12}),
  brushedBrass:new T.MeshPhysicalMaterial({color:0xffd487,metalness:.92,roughness:.23,
    clearcoat:.26,clearcoatRoughness:.16}),
  ceramic:new T.MeshPhysicalMaterial({color:0xc9d5dc,metalness:.27,roughness:.31,clearcoat:.6}),
 };
}
