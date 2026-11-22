import * as THREE from 'three';

/**
 * Load genuine CC0 photo-scanned material maps that are bundled locally.
 * Source metadata is in public/materials/manifest.json.
 * Never requires network calls to third-party websites at game runtime.
 */
export async function loadScannedMaterials(log=()=>{}) {
  const response=await fetch('./materials/manifest.json');
  if(!response.ok)throw new Error('Scanned material manifest not installed');
  const manifest=await response.json();
  const loader=new THREE.TextureLoader();
  const bank={};
  for (const [name,item] of Object.entries(manifest)){
    const maps={};
    for (const [channel,path] of Object.entries(item.channels)){
      try {
        const tex=await loader.loadAsync('./'+path);
        tex.colorSpace=channel==='albedo'?THREE.SRGBColorSpace:THREE.NoColorSpace;
        tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
        tex.minFilter=THREE.LinearMipmapLinearFilter;
        tex.magFilter=THREE.LinearFilter;
        tex.anisotropy=8;
        tex.repeat.set(name==='casino_marble'?3:3.8,name==='casino_marble'?2:3);
        maps[channel]=tex;
      }catch(e){ log('Scanned texture channel failed: '+name+'/'+channel); }
    }
    if(!maps.albedo||!maps.normal||!maps.roughness)continue;
    bank[name]=new THREE.MeshPhysicalMaterial({
      name:'CC0 Poly Haven '+name,
      map:maps.albedo,
      normalMap:maps.normal,
      normalScale:new THREE.Vector2(.65,.65),
      roughnessMap:maps.roughness,
      metalnessMap:maps.metalness,
      metalness:name==='casino_marble'?.08:.87,
      roughness:name==='casino_marble'?.25:.68,
      clearcoat:name==='casino_marble'?.81:.25,
      clearcoatRoughness:name==='casino_marble'?.13:.34,
      envMapIntensity:name==='casino_marble'?1.65:1.22,
      side:THREE.FrontSide,
    });
    log('Loaded scanned '+name+' ('+Object.keys(maps).join(', ')+')');
  }
  if(!bank.gantry_metal||!bank.casino_marble)throw new Error('Essential scanned PBR sets incomplete');
  return bank;
}

export function remapAuthoredHullMaterials(gltfRoots, scanned, log=()=>{}) {
  let updated=0;
  for (const [name,root] of gltfRoots.entries()) {
    root.traverse(node=>{
      if(!node.isMesh)return;
      const old=node.material;
      if (!old || typeof old.name!=='string')return;
      if (!old.name.toLowerCase().includes('brushed titanium'))return;
      // UVs were authored in the source GLB and remain valid for the new scans.
      node.material=(name.includes('crate')||name.includes('bulkhead'))
        ? scanned.weathered_hull||scanned.gantry_metal
        : scanned.gantry_metal;
      updated++;
    });
  }
  log('Remapped '+updated+' authored hull mesh materials to photo-scanned maps');
  return updated;
}
