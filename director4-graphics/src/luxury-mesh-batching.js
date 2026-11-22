import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Art geometry consolidation. Bakes static mesh transforms into common
 * material batches; preserves scanned GLBs, damageable tables and all
 * instanced/transparent/cyberware effects as independent scene objects.
 * Greatly reduces draw calls without reducing polygon detail.
 */
export function batchLuxuryArchitecture(root,{maxPerBatch=90,log=()=>{}}={}){
 root.updateMatrixWorld(true);
 const rootInverse=root.matrixWorld.clone().invert();
 const buckets=new Map();
 let candidates=0;
 function visit(node,locked=false){
  locked=locked||!!node.userData?.keepSeparate||!!node.userData?.preserveArtAsset;
  if(!locked&&node.isMesh&&!node.isInstancedMesh&&
     node.geometry&&!Array.isArray(node.material)&&
     node.material&&!node.material.transparent&&node.material.depthWrite!==false){
   const attrs=node.geometry.attributes;
   if(attrs.position&&attrs.normal&&attrs.uv){
    const signature=Object.entries(attrs).map(([name,a])=>name+':'+a.itemSize+':'+a.array.constructor.name).sort().join(',');
    const key=node.material.uuid+'|'+signature+'|'+(node.geometry.index?'i':'n');
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(node);candidates++;
   }
  }
  for(const child of node.children)visit(child,locked)
 }
 visit(root);
 let batches=0,mergedCount=0;
 for(const nodes of buckets.values()){
  if(nodes.length<4)continue;
  for(let k=0;k<nodes.length;k+=maxPerBatch){
   const items=nodes.slice(k,k+maxPerBatch);
   if(items.length<3)continue;
   const geometries=[];
   let invalid=false;
   for(const mesh of items){
    const inverse=rootInverse.clone().multiply(mesh.matrixWorld);
    const g=mesh.geometry.clone();
    g.applyMatrix4(inverse);
    geometries.push(g);
   }
   let combined;
   try{combined=mergeGeometries(geometries,false)}
   catch(e){invalid=true;log('Static asset merge skipped: '+e.message)}
   geometries.forEach(g=>g.dispose());
   if(invalid||!combined)continue;
   const mat=items[0].material;
   combined.computeBoundingSphere();
   const merged=new THREE.Mesh(combined,mat);
   merged.name='Director4_BatchedAuthoredArchitecture_'+(++batches);
   merged.castShadow=items.some(o=>o.castShadow);
   merged.receiveShadow=true;
   root.add(merged);
   for(const mesh of items){mesh.parent?.remove(mesh);mesh.geometry.dispose();mergedCount++}
  }
 }
 root.updateMatrixWorld(true);
 log('Luxury architectural mesh batching: '+mergedCount+' static meshes → '+batches+' material batches');
 return {candidates,merged:mergedCount,batches};
}
