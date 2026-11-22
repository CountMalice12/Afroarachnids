#!/usr/bin/env python3
"""Download a few artist-authored CC0 Poly Haven 3D props as reusable GLBs."""
from urllib.request import Request,urlopen
from pathlib import Path
import json,tempfile,zipfile,io,os
import trimesh

BASE=Path(__file__).resolve().parent.parent/'public'/'hero-models'
BASE.mkdir(parents=True,exist_ok=True)
ASSETS={'pipes':'modular_industrial_pipes_01','toolbox':'metal_toolbox','cargo':'plastic_crate_02'}
def fetch(url):
 with urlopen(Request(url,headers={'User-Agent':'Director4-PalaceAssets/1.0'}),timeout=150) as r:return r.read()
def extract_url(data):
 if isinstance(data,dict):
  for key in ('1k','2k','gltf','glb','url'):
   if key in data:
    u=extract_url(data[key])
    if u:return u
  for value in data.values():
   u=extract_url(value)
   if u:return u
 if isinstance(data,str) and data.startswith('http'):return data
 return None
manifest={}
for name,slug in ASSETS.items():
 data=json.loads(fetch('https://api.polyhaven.com/files/'+slug))
 print(slug,'FILES',list(data),flush=True)
 node=data.get('gltf') or data.get('glb') or data.get('GLTF')
 if not node:
  print('Skipping unsupported model '+slug,flush=True)
  continue
 url=extract_url(node)
 if not url:print('No URL',slug);continue
 print('Downloading',name,url,flush=True)
 blob=fetch(url)
 with tempfile.TemporaryDirectory() as td:
  td=Path(td);archive=td/'asset.zip'
  archive.write_bytes(blob)
  if zipfile.is_zipfile(archive):
   with zipfile.ZipFile(archive) as z:z.extractall(td)
  else:
   ext='.glb' if blob[:4]==b'glTF' else '.gltf'
   (td/('source'+ext)).write_bytes(blob)
  candidates=list(td.rglob('*.glb'))+list(td.rglob('*.gltf'))
  if not candidates:print('No glTF asset found in zip:',slug);continue
  source=sorted(candidates,key=lambda x:len(x.parts))[0]
  print('Importing',source,flush=True)
  scene=trimesh.load(source,force='scene')
  if len(scene.geometry)==0:raise RuntimeError('Empty geometry '+slug)
  out=BASE/(name+'.glb');out.write_bytes(scene.export(file_type='glb'))
  manifest[name]={'source':'https://polyhaven.com/a/'+slug,'license':'CC0','path':'hero-models/'+name+'.glb','bytes':out.stat().st_size,'geometries':len(scene.geometry)}
  print('OK',name,manifest[name],flush=True)
if len(manifest)<2:raise RuntimeError('At least 2 photoreal author-made assets required')
(BASE/'manifest.json').write_text(json.dumps(manifest,indent=2))
(BASE/'SOURCES.md').write_text('# CC0 hero props\n'+''.join(f"- {name}: https://polyhaven.com/a/{ASSETS[name]}\n" for name in manifest))
