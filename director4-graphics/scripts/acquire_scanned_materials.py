#!/usr/bin/env python3
"""Fetch CC0 photo-scanned PBR maps from the official Poly Haven Files API.
This tool writes real scanned texture data, not a simulated noise map.
Keep this offline step separate from game startup and retain attribution.
"""
from pathlib import Path
from urllib.request import Request, urlopen
import json, time, sys
BASE=Path(__file__).resolve().parent.parent/"public"/"materials"
BASE.mkdir(exist_ok=True,parents=True)
assets={"gantry_metal":"metal_plate","casino_marble":"marble_tiles","weathered_hull":"metal_plate_02"}
channels={"Diffuse":"albedo","nor_gl":"normal","Rough":"roughness","Metal":"metalness"}
headers={"User-Agent":"Director4.0-CC0-Material-Build/1.0 (github.com/CountMalice12/Afroarachnids)"}
def get(url):
 with urlopen(Request(url,headers=headers),timeout=90) as r:
  return r.read()
def lookup(node,resolution="2k"):
 if isinstance(node,dict):
  for target in (resolution,"1k","4k"):
   for key,value in node.items():
    if key.lower()==target:return lookup(value,resolution)
  for target in ("jpg","jpeg","png","webp"):
   for key,value in node.items():
    if key.lower()==target:return lookup(value,resolution)
  for key in ("url","download_url"):
   if isinstance(node.get(key),str):return node[key]
  for val in node.values():
   found=lookup(val,resolution)
   if found:return found
 return None
manifest={}
for name,slug in assets.items():
 print("Poly Haven files API:",slug,flush=True)
 details=json.loads(get(f"https://api.polyhaven.com/files/{slug}"))
 out=BASE/name;out.mkdir(exist_ok=True)
 manifest[name]={"source":f"https://polyhaven.com/a/{slug}","license":"CC0","channels":{}}
 for ch,target in channels.items():
  data=details.get(ch)
  if not data:
   print("MISSING CHANNEL",slug,ch,"keys:",list(details),flush=True)
   continue
  url=lookup(data)
  if not url:print("NOT FOUND:",slug,ch,"data:",str(data)[:250],flush=True);continue
  clean=url.split("?")[0].lower();ext="jpg" if clean.endswith((".jpg",".jpeg")) else "png" if clean.endswith(".png") else "exr" if clean.endswith(".exr") else "jpg"
  if ext=="exr":print("Skipping EXR",url);continue
  output=out/f"{target}.{ext}"
  blob=get(url)
  if len(blob)<4000:raise RuntimeError(f"Suspiciously small texture: {slug} {ch} {url}")
  output.write_bytes(blob)
  manifest[name]["channels"][target]=str(output.relative_to(BASE.parent)).replace("\\","/")
  print(name,ch,len(blob),"bytes",url[:120],flush=True)
 if not {"albedo","normal","roughness"}.issubset(manifest[name]["channels"]):
  raise RuntimeError(f"Missing mandatory PBR channels for {name}: {manifest[name]['channels']}")
(BASE/"manifest.json").write_text(json.dumps(manifest,indent=2))
(BASE/"LICENSES.md").write_text(
 "# Material Provenance\nThe textures here are original photography-based PBR assets from Poly Haven under CC0.\n"+
 "".join(f"- **{name}**: [{slug}](https://polyhaven.com/a/{slug}) (CC0)\n" for name,slug in assets.items())+
 "\nThe renderer can fall back to original materials if scanned texture files fail to load.\n"
)
print("SUCCESS: all required PBR maps acquired",flush=True)
