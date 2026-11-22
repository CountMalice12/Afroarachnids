#!/usr/bin/env python3
"""Download two Poly Haven CC0 HDRI reflection probes for physical materials."""
from pathlib import Path
from urllib.request import Request,urlopen
import json
ROOT=Path(__file__).resolve().parent.parent/'public'/'hdri'
ROOT.mkdir(parents=True,exist_ok=True)
def fetch(url):
 with urlopen(Request(url,headers={"User-Agent":"Director4-Asset-Build/1.0"}),timeout=100) as r:
  return r.read()
def resolve(data):
 # Poly Haven JSON is keyed by HDRI channel, size and file format.
 if isinstance(data,dict):
  for key in ('1k','2k','hdr','exr','url'):
   if key in data:
    a=resolve(data[key])
    if a:return a
  for x in data.values():
   a=resolve(x)
   if a:return a
 if isinstance(data,str) and data.startswith('http'):
  return data
 return None
for name,slug in [('gantry','studio_small_09'),('casino','industrial_workshop_foundry')]:
 details=json.loads(fetch('https://api.polyhaven.com/files/'+slug))
 # Prefer RGBE HDR not EXR (RGBELoader supports HDR directly).
 hdri=details.get('hdri',{})
 url=None
 if isinstance(hdri,dict):
  for k in ('1k','2k'):
   part=hdri.get(k,{})
   if isinstance(part,dict):
    for variant in ('hdr','HDR'):
     if variant in part:url=resolve(part[variant]);break
   if url:break
 if not url:
  print(name,'keys',list(details), 'hdri keys',list(hdri) if isinstance(hdri,dict) else str(hdri)[:120])
  raise RuntimeError('No HDR environment available for '+slug)
 blob=fetch(url)
 if len(blob)<20000:raise RuntimeError('HDR is invalid or too small')
 (ROOT/(name+'.hdr')).write_bytes(blob)
 print('HDRI:',name,slug,len(blob),url)
(ROOT/'SOURCES.md').write_text(
 '# CC0 HDRIs\n\n- Exterior material probe: https://polyhaven.com/a/studio_small_09\n'
 '- Interior material probe: https://polyhaven.com/a/industrial_workshop_foundry\n'
 'Both are Poly Haven CC0. These illuminate/reflected materials; the actual scene background remains orbital space.\n')
