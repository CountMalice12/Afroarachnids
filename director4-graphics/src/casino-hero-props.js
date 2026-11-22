import * as THREE from 'three';

/**
 * Physical glTF decor bank sourced from Poly Haven CC0.
 * The geometry is real high-detail asset data with original UV and texture maps.
 * Fails open to authored fallback furniture if the optional GLBs are missing.
 */
export async function loadCasinoHeroProps(loader,log=()=>{}){
 const sources={
  lounge_chair:'./hero-models/lounge_chair.glb',
  potted_plant:'./hero-models/potted_plant.glb',
  flowering_shrub:'./hero-models/flowering_shrub.glb'
 };
 const models=new Map();
 for(const [name,path] of Object.entries(sources)){
  try{
   const result=await loader.loadAsync(path);
   result.scene.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(result.scene);
   const dims=new THREE.Vector3();bounds.getSize(dims);
   if(!(dims.y>0.001)||!Number.isFinite(dims.y))throw Error('Model has invalid dimensions');
   result.scene.userData.originalSize=dims;
   result.scene.userData.bounds=bounds;
   models.set(name,result.scene);
   log('Loaded licensed CC0 photoreal glTF furniture: '+name);
  }catch(e){log('Optional photoreal prop unavailable: '+name+' '+e.message)}
 }
 return models;
}
function putAsset(group,model,x,z,{height=1.0,rotation=0,y=0,scaleMult=1}={}){
 const container=new THREE.Group();container.position.set(x,y,z);container.rotation.y=rotation;
 const mesh=model.clone(true);
 const size=model.userData.originalSize||new THREE.Vector3(1,1,1);
 const scale=height/Math.max(.001,size.y)*scaleMult;
 mesh.scale.setScalar(scale);
 const bb=model.userData.bounds;
 mesh.position.set(-(bb.min.x+bb.max.x)*.5*scale,-bb.min.y*scale,
                   -(bb.min.z+bb.max.z)*.5*scale);
 mesh.traverse(part=>{
  if(part.isMesh){part.castShadow=true;part.receiveShadow=true;
   // Keep photo-scanned maps and all original glTF UVs and material properties.
   if(part.material&&part.material.isMeshStandardMaterial)part.material.envMapIntensity=1.25;
  }
 });
 container.add(mesh);group.add(container);return container;
}
export function dressCasinoWithScans(group,modelBank,{mobile=false}={}){
 const info={chairs:0,plants:0,shrubs:0};
 const lounge=modelBank.get('lounge_chair'),pot=modelBank.get('potted_plant'),shrub=modelBank.get('flowering_shrub');
 const chairs=[
  [-19,-3,2.2],[-18,1,1.9],[-9,-7,.4],[-7,-5,-.2],
  [12,-10,.65],[15,-8,-.3],[9,6,-.65],[8,9,.2],
  [-6,12,-1.1],[-3,12,-1.0]
 ];
 if(lounge)for(const [x,z,r] of (mobile?chairs.slice(0,6):chairs)){
  putAsset(group,lounge,x,z,{height:1.22,rotation:r});info.chairs++
 }
 const planters=[[-20,9],[19,-10],[5,-12],[-3,-12],[-18,-12],[20,12]];
 if(pot)for(const [x,z] of (mobile?planters.slice(0,3):planters)){
  putAsset(group,pot,x,z,{height:2.65,rotation:Math.abs(x*.42+z)*.3});info.plants++
 }
 const flowerBeds=[[-18,14],[-11,-12],[4,-13],[19,13],[-20,-6]];
 if(shrub)for(const [x,z] of (mobile?flowerBeds.slice(0,2):flowerBeds)){
  putAsset(group,shrub,x,z,{height:1.32,rotation:.7+x*.2});info.shrubs++
 }
 return info;
}
