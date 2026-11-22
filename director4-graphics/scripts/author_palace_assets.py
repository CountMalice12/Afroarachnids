#!/usr/bin/env python3
"""Original authored orbital architecture GLBs; no proprietary game models."""
from pathlib import Path
import trimesh, numpy as np, math, json
from PIL import Image
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public'/'models';OUT.mkdir(parents=True,exist_ok=True)
TEXT=ROOT/'public'/'textures';TEXT.mkdir(parents=True,exist_ok=True)
S=512;rng=np.random.default_rng(71);yy,xx=np.mgrid[:S,:S]
noise=rng.normal(0,7,(S,S));seam=(xx%128<2)|(yy%128<2)
scratches=np.maximum(0,np.sin(xx*.23+yy*.003)**39)*11
base=np.zeros((S,S,4),dtype=np.uint8);nrm=np.zeros_like(base);mr=np.zeros_like(base)
for i,c in enumerate([132,152,169]):
 base[:,:,i]=np.clip(c+noise+scratches-np.where(seam,35,0),0,255)
base[:,:,3]=255
height=noise/255+seam*.18+scratches/70
dx=np.gradient(height,axis=1);dy=np.gradient(height,axis=0)
nrm[:,:,0]=np.clip((.5-dx*.35)*255,0,255);nrm[:,:,1]=np.clip((.5-dy*.35)*255,0,255)
nrm[:,:,2:]=255
mr[:,:,0]=255;mr[:,:,1]=np.clip(95+noise*2+seam*36,24,255);mr[:,:,2]=np.clip(235+noise*1.2,0,255);mr[:,:,3]=255
for name,arr in [('steel_basecolor.png',base),('steel_normal.png',nrm),('steel_metalrough.png',mr)]:
 Image.fromarray(arr).save(TEXT/name,optimize=True)
MAT={
 'hull':PBRMaterial(name='Brushed titanium',baseColorFactor=[195,205,219,255],metallicFactor=.91,roughnessFactor=.30,baseColorTexture=Image.open(TEXT/'steel_basecolor.png'),normalTexture=Image.open(TEXT/'steel_normal.png'),metallicRoughnessTexture=Image.open(TEXT/'steel_metalrough.png')),
 'dark':PBRMaterial(baseColorFactor=[42,61,78,255],metallicFactor=.72,roughnessFactor=.43),
 'chrome':PBRMaterial(baseColorFactor=[219,225,232,255],metallicFactor=.99,roughnessFactor=.18),
 'gold':PBRMaterial(baseColorFactor=[209,153,79,255],metallicFactor=.94,roughnessFactor=.27),
 'rubber':PBRMaterial(baseColorFactor=[31,43,50,255],metallicFactor=.15,roughnessFactor=.79),
 'accent':PBRMaterial(baseColorFactor=[19,87,108,255],emissiveFactor=[.12,.78,1],metallicFactor=.3,roughnessFactor=.19),
 'warm':PBRMaterial(baseColorFactor=[122,61,17,255],emissiveFactor=[1,.45,.11],metallicFactor=.2,roughnessFactor=.28),
 'hazard':PBRMaterial(baseColorFactor=[231,169,55,255],metallicFactor=.52,roughnessFactor=.38),
 'glass':PBRMaterial(baseColorFactor=[69,129,160,180],metallicFactor=.18,roughnessFactor=.06,alphaMode='BLEND',doubleSided=True)
}
def uvbox(size):
 w,h,d=size;fqs=[
 [[-w/2,-h/2,d/2],[w/2,-h/2,d/2],[w/2,h/2,d/2],[-w/2,h/2,d/2]],
 [[w/2,-h/2,-d/2],[-w/2,-h/2,-d/2],[-w/2,h/2,-d/2],[w/2,h/2,-d/2]],
 [[-w/2,-h/2,-d/2],[-w/2,-h/2,d/2],[-w/2,h/2,d/2],[-w/2,h/2,-d/2]],
 [[w/2,-h/2,d/2],[w/2,-h/2,-d/2],[w/2,h/2,-d/2],[w/2,h/2,d/2]],
 [[-w/2,h/2,d/2],[w/2,h/2,d/2],[w/2,h/2,-d/2],[-w/2,h/2,-d/2]],
 [[-w/2,-h/2,-d/2],[w/2,-h/2,-d/2],[w/2,-h/2,d/2],[-w/2,-h/2,d/2]]]
 vv=[];uv=[];ff=[]
 for q in fqs:
  k=len(vv);vv.extend(q);uv.extend([[0,0],[1,0],[1,1],[0,1]])
  ff.extend([[k,k+1,k+2],[k,k+2,k+3]])
 m=trimesh.Trimesh(vertices=vv,faces=ff,process=False)
 m.visual=TextureVisuals(uv=np.array(uv),material=MAT['hull']);m.fix_normals();return m
class A:
 def __init__(self,name):self.name=name;self.s=trimesh.Scene();self.i=0
 def put(self,m,mat,xyz):
  m=m.copy();m.apply_translation(xyz)
  if mat!='hull' or m.visual.kind!='texture':m.visual=TextureVisuals(material=MAT[mat])
  self.s.add_geometry(m,node_name=f'{self.name}_{self.i:03d}');self.i+=1
 def box(self,x,y,z,w,h,d,mat='dark'):
  self.put(uvbox((w,h,d)) if mat=='hull' else trimesh.creation.box((w,h,d)),mat,(x,y,z))
 def cyl(self,p,q,r,mat='chrome',s=16):
  p=np.array(p);q=np.array(q);v=q-p
  m=trimesh.creation.cylinder(radius=r,height=np.linalg.norm(v),sections=s)
  m.apply_transform(trimesh.geometry.align_vectors([0,0,1],v/np.linalg.norm(v)))
  self.put(m,mat,tuple((p+q)/2))
 def bolt(self,x,y,z):self.cyl((x,y-.02,z),(x,y+.02,z),.065,'chrome',12)
 def done(self):
  p=OUT/(self.name+'.glb');p.write_bytes(self.s.export(file_type='glb'))
  print(self.name,p.stat().st_size,self.i);return {'name':self.name,'bytes':p.stat().st_size,'meshes':self.i}
models=[]
a=A('gantry_floor_panel');a.box(0,-.14,0,2,.28,2,'hull');a.box(0,.017,0,1.7,.055,1.68,'dark')
for z in np.linspace(-.7,.7,15):a.box(0,.05,float(z),1.62,.025,.052,'chrome')
for x in [-.94,.94]:a.box(x,.065,0,.075,.065,1.88,'gold')
for z in [-.93,.93]:a.box(0,.07,z,1.89,.05,.065,'chrome')
for x in [-.79,.79]:
 for z in [-.81,.81]:a.bolt(x,.097,z)
a.box(0,.103,-.93,.46,.03,.065,'accent');models.append(a.done())
a=A('gantry_truss_6m')
for zz in [-2.9,2.9]:
 for yy in [0,2.6]:a.cyl((-1.3,yy,zz),(1.3,yy,zz),.14,'chrome')
for xx in [-1.3,1.3]:
 for yy in [0,2.6]:a.cyl((xx,yy,-3),(xx,yy,3),.16,'hull',24)
 for zz in np.arange(-3,3,1.5):
  a.cyl((xx,0,float(zz)),(xx,2.6,float(zz+1.5)),.076)
  a.cyl((xx,2.6,float(zz)),(xx,0,float(zz+1.5)),.076)
for zz in np.arange(-3,3.1,1.5):
 a.cyl((-1.3,0,float(zz)),(1.3,2.6,float(zz)),.07,'gold')
 a.cyl((-1.3,2.6,float(zz)),(1.3,0,float(zz)),.07)
for zz in [-2.5,0,2.5]:a.box(0,2.63,zz,1.3,.13,.09,'warm')
models.append(a.done())
a=A('pressure_rail_4m')
for z in [-1.9,0,1.9]:
 a.box(0,.8,z,.1,1.6,.13,'chrome');a.box(0,.10,z,.43,.20,.32)
for y,r in [(1.55,.073),(.94,.054),(.42,.05)]:a.cyl((0,y,-2),(0,y,2),r)
a.box(0,.13,0,.05,.26,4,'hazard');models.append(a.done())
a=A('pressure_bulkhead_5m');a.box(0,2.9,0,5,5.8,.54,'hull')
for x in [-2.35,-1.5,0,1.5,2.35]:a.box(x,2.9,.39,.15,5.45,.24,'chrome')
for y in [.42,1.55,2.9,4.65,5.55]:a.box(0,y,.38,4.9,.12,.17)
for x in [-1.8,1.8]:
 for y in [1.7,3.1,4.4]:a.box(x,y,.52,.7,.31,.08,'rubber')
a.box(0,3,.51,1.8,2.6,.17)
for i in range(19):a.box(0,2.15+i*.094,.68,1.35,.043,.032,'chrome')
for y in [.6,5.2]:a.box(0,y,.61,4.6,.09,.08,'accent')
models.append(a.done())
a=A('airlock_door_3m');a.box(0,2,0,3.5,4,.48,'hull');a.box(0,2,.31,2.95,3.49,.2)
a.box(0,2,.45,2.2,3.05,.06,'chrome');a.box(0,2,.5,1.75,2.6,.06,'rubber')
for x in [-1.37,1.37]:
 a.cyl((x,.1,.5),(x,3.85,.5),.1)
 a.box(x,3.7,.7,.25,.22,.16,'hazard')
for y in [.5,1.85,3.25]:a.box(0,y,.63,2.72,.055,.05,'chrome')
a.box(0,3.63,.63,1.4,.13,.07,'accent');a.box(1.03,1.45,.66,.42,.23,.13,'gold');models.append(a.done())
a=A('cargo_crate_hardcase');a.box(0,.71,0,1.65,1.38,1.45);a.box(0,.73,0,1.48,1.22,1.28,'hull')
for x in [-.8,.8]:
 for z in [-.69,.69]:a.box(x,.7,z,.16,1.42,.17,'chrome')
for y in [.14,1.31]:
 for x in [-.72,.72]:a.box(x,y,0,.14,.09,1.34,'gold')
for z in [-.63,.63]:
 for y in [.21,.7,1.22]:a.box(0,y,z,1.48,.06,.1,'chrome')
for x in [-.38,.38]:a.box(x,.9,.755,.25,.19,.13,'gold')
a.box(0,1.44,0,1.1,.09,.8,'rubber');a.box(0,.7,.763,.72,.13,.035,'accent')
models.append(a.done())
a=A('gantry_service_console');a.box(0,.58,0,1.7,1.15,1.1);a.box(0,1.22,-.17,1.55,.55,.26,'hull')
a.box(0,1.27,.01,1.25,.42,.035,'accent');a.box(0,.81,.64,1.35,.26,.21,'gold')
for i in range(9):
 for j in range(3):a.box(-.52+i*.13,.99,-.59+j*.14,.085,.03,.066,'chrome')
for x in [-.7,.7]:a.cyl((x,1.3,.05),(x,2.18,.05),.027)
a.box(0,2.1,.05,1.7,.04,.045,'accent');models.append(a.done())
a=A('observation_glazing_5m');a.box(0,2.75,0,5,5.5,.05,'glass')
for x in [-2.45,0,2.45]:a.box(x,2.75,.09,.20,5.5,.22,'chrome')
for y in [.2,5.3]:a.box(0,y,.1,5,.17,.21,'gold')
for x in [-1.2,1.2]:a.box(x,5.1,.15,.6,.045,.03,'accent')
models.append(a.done())
a=A('habitat_ring_arc');R=26
for y,rad,mat in [(0,R,'hull'),(2,R+.25,'chrome'),(-2,R-.25,'dark')]:
 for j in range(32):
  t0=-.5+j/32;t1=-.5+(j+1)/32
  a.cyl((math.sin(t0)*rad,y,math.cos(t0)*rad),(math.sin(t1)*rad,y,math.cos(t1)*rad),.34 if y==0 else .19,mat)
for j in range(17):
 t=-.5+j/16;p=(math.sin(t)*R,0,math.cos(t)*R)
 a.cyl((p[0],-2,p[2]),(p[0],2,p[2]),.16)
 a.box(p[0],1,p[2]+.35,.4,.14,.25,'accent')
models.append(a.done())
(OUT/'manifest.json').write_text(json.dumps({'models':models,'license':'Original authored project assets','author':'Director 4.0 graphics studio'},indent=2))
