#!/usr/bin/env python3
"""Import selected CC0 Poly Haven photogrammetry-grade furnishings and plants.

Files API glTF entries have *include* URLs for each referenced .bin and texture.
Download from those explicit include URLs; relative URL guessing is unreliable.
Pack into self-contained GLBs so Three.js doesn't need runtime CDN access.
"""
from pathlib import Path, PurePosixPath
from urllib.request import Request,urlopen
from urllib.parse import urlparse,urljoin
import json,tempfile,zipfile
import trimesh

BASE=Path(__file__).resolve().parent.parent/'public'/'hero-models'
BASE.mkdir(parents=True,exist_ok=True)
ASSETS={
    'lounge_chair':'modern_arm_chair_01',
    'potted_plant':'potted_plant_01',
    'flowering_shrub':'shrub_01'
}
HEADERS={'User-Agent':'Director4-Graphics-Offline-CC0-Importer/2.0'}
def fetch(url):
    with urlopen(Request(url,headers=HEADERS),timeout=150) as r:
        return r.read()
def safe_path(p):
    value=PurePosixPath(p)
    if value.is_absolute() or '..' in value.parts:raise ValueError('Unsafe external asset path '+p)
    return Path(*value.parts)
def package_model(slug,name,td):
    info=json.loads(fetch('https://api.polyhaven.com/files/'+slug))
    file=info['gltf']['1k']['gltf']
    url=file['url'];metadata=file.get('include',{})
    src=td/Path(urlparse(url).path).name
    src.write_bytes(fetch(url))
    print('GLTF',slug,src.name,src.stat().st_size,'include',len(metadata),flush=True)
    if src.suffix.lower()=='.glb':
        scene=trimesh.load(src,force='scene')
        if not scene.geometry:raise RuntimeError('No meshes for '+slug)
        return src.read_bytes(),len(scene.geometry)
    gltf=json.loads(src.read_text())
    dependencies=[v['uri'] for v in gltf.get('buffers',[])+gltf.get('images',[])
                  if 'uri' in v and not v['uri'].startswith('data:')]
    for uri in dependencies:
        path=safe_path(uri)
        match=metadata.get(uri)
        if match is None:
            match=next((v for k,v in metadata.items()
                       if k.endswith(uri) or Path(k).name==path.name),None)
        if match and isinstance(match,dict) and match.get('url'):
            data=fetch(match['url'])
        else:
            # API may include absolute file URLs or a dependency path relative to the source.
            print('Fallback dependency',uri,'available includes:',list(metadata)[:5],flush=True)
            data=fetch(urljoin(url,uri))
        dest=src.parent/path;dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_bytes(data)
        print('INCLUDE',dest,len(data),flush=True)
    scene=trimesh.load(src,force='scene',process=False)
    if not scene.geometry:raise RuntimeError('No meshes for '+slug)
    blob=scene.export(file_type='glb')
    if len(blob)<10000:raise RuntimeError('Suspiciously small GLB')
    return blob,len(scene.geometry)

manifest={}
for name,slug in ASSETS.items():
    try:
        with tempfile.TemporaryDirectory() as tmp:
            blob,parts=package_model(slug,name,Path(tmp))
        filename=name+'.glb'
        (BASE/filename).write_bytes(blob)
        manifest[name]={'source':'https://polyhaven.com/a/'+slug,
            'license':'CC0','path':'hero-models/'+filename,
            'bytes':len(blob),'meshes':parts}
        print('SUCCESS',name,len(blob),'bytes',parts,'mesh parts',flush=True)
    except Exception as e:
        print('ASSET ERROR',name,repr(e),flush=True)
if len(manifest)<2:
    raise RuntimeError('Could not import enough high-detail hero assets: '+str(manifest))
(BASE/'manifest.json').write_text(json.dumps(manifest,indent=2))
(BASE/'SOURCES.md').write_text('# CC0 Poly Haven scanned architectural props\n\n'+
    ''.join(f'- {name}: https://polyhaven.com/a/{ASSETS[name]} (CC0)\n'
            for name in manifest))
print('ALL ASSETS IMPORTED',list(manifest),flush=True)
