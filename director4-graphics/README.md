# Director 4.0 graphics toolkit (isolated prototype)

A **separate, working browser 3D lab** for the proposed Crystal Palace upgrade. This folder does not modify the existing `Arachanid website.html` or any live Director deployment.

## Start

```bash
cd director4-graphics
npm install
npm run dev
```

Open the printed Vite address. On first installation, commit `package-lock.json` in the actual Director project to lock compatible dependencies; prototype dependencies currently track latest releases.

The demo is procedural and **not photorealistic**. It demonstrates real geometry, PBR-oriented materials, dynamic lights, physically registered cover, raycast line-of-sight, interactive movement previews, and flight/tactical viewport resizing. Detailed authored GLB models, high-resolution texture sets, shadow tuning and mobile profiling are still required.

## Intended toolchain

- [Three.js](https://github.com/mrdoob/three.js) for scene, camera, materials and model loading.
- [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) for faster mesh-accurate visibility checks.
- [postprocessing](https://github.com/pmndrs/postprocessing) for careful cinematic effects.
- [Rapier](https://github.com/dimforge/rapier) for physical colliders and eventual ship/character interactions.
- [recast-navigation-js](https://github.com/isaac-mason/recast-navigation-js) for production navmesh generation and NPC route planning.
- [glTF Transform](https://github.com/donmccurdy/glTF-Transform) to optimize authored assets; [meshoptimizer](https://github.com/zeux/meshoptimizer) and [KTX-Software](https://github.com/KhronosGroup/KTX-Software) are recommended **offline** asset pipeline tools, not libraries to paste into the HTML.
- [Blender](https://github.com/blender/blender) to author the actual Crystal Palace mesh and UVs.

Third-party packages are consumed as dependencies, **not vendored** into this repository. Inspect each package and model's license. Shader code, geometry and placeholder assets here are original starter code.

## Controls

WASD or onscreen buttons: move the blue token; click "Fire LOS test" to test a shot against the solid cover. Rotate the orbit camera using a pointer drag. Zoom with wheel/pinch. Toggle tactical/flight mode to verify consistent pixel resolution. Space is a mode preview, not a fully integrated flight simulator yet.

## Director 4.0 integration plan

1. Import the renderer into the **actual** current Director source, mount it under the existing map viewport without replacing campaign state or saves.
2. Map each Director scene ID to authored scene GLBs. Generate simplified collider proxies and navigation geometry from those same assets.
3. Retain one authoritative move/action budget and native combat resolution. Renderer exposes `previewMove` and `previewShot`; the Director engine validates and commits the actual turns.
4. Use the 3D geometry/collider registry as the source for cover health, line of sight, and movement; invalidate spatial indexes when cover breaks.
5. Switch three space maps to this same canvas sizing/resolution, but use separate sector-scale physics and LOD rules for ships.
6. Benchmark 30/60 FPS and memory at multiple device classes; adaptive resolution and LOD are mandatory.

**Important:** The only GitHub repository currently connected is Afroarachnids, which does not contain the Director game. This is therefore a self-contained toolkit on a feature branch, **not** a live-site installation.

## High-fidelity orbital combat lab

**Open [flight.html](./flight.html)** after running `npm install && npm run dev`.
This adds three REAL 3D environments and ships as a sibling game screen:
Earth-Limb Pursuit, Debris Field Ambush, and Crystal Palace Cordon.

Features: 80-segment curved spacecraft fuselages, beveled swept wings,
cockpit glazing, PBR surface maps (basecolor, normal, roughness),
layered nozzle geometry, greebles, detailed five-ring station,
instance-lit windows, atmospheric Earth, modeled debris, GPU lighting,
bloom, directional shadow support, Newtonian X/Y/Z flight, pitch/yaw/roll,
enemy AI, targeting, railguns, homing missiles, shields, hull and obstacles,
mission-specific collider groups, and mobile touch controls.

**Graphics quality:** three profiles (Low/Mobile, Balanced, Ultra/Desktop)
with responsive renderer and DPR caps, in both flight and tactical lab.
No source assets from Cyberpunk 2077 have been used or redistributed.
This is modeled **real-time 3D** with procedural PBR materials, but
not yet cinematic photorealism. The exact visual fidelity, frame rate,
postprocessing compatibility and mobile memory performance must be checked
in a GPU-enabled browser. True production quality would require
professionally authored high-resolution GLBs, baked AO and quality HDRIs.

This GitHub branch is only a staging toolkit; not a live Director 4.0 deployment.

## Photorealism-oriented art pass: photobased surfaces and authored composition

Open **`fidelity.html`** (Exterior Gantry CP-10, Starburst Casino CP-03, Docking Core CP-01).

This pass includes:
- Nine separately exported original, physical GLB architectural model families with usable 3D geometry.
- Three **real photo-scanned** CC0 2K PBR material sets from Poly Haven: worn industrial metal (`metal_plate`), casino marble (`marble_tiles`), and corroded structural plating (`metal_plate_02`). Use `scripts/acquire_scanned_materials.py` to reproduce their downloads; licensing information lives in `public/materials/LICENSES.md`.
- Two 1K CC0 HDRI reflection probes: `studio_small_09` and `industrial_workshop_foundry`, sourced by `scripts/acquire_hdri.py`. These do not replace the orbital background.
- Original custom art dressing: engineered canopy frames and handrails, bolted panels, readable station signage, floor hazard decals, cargo clutter, casino table details, decorative volumetric lighting and contact shading. These are 3D objects, not pre-rendered 2D tactical-map pictures.
- Actual GLB geometries for bulkheads, gantry railings, supplies and doors connected to the demonstrator's physical cover, line-of-sight and movement checks.

**Quality claims:** The project is a **photorealism-oriented art prototype**, not an independently verified photorealistic game. It has photo-scanned materials and HDRI lighting, but the film-like reference image still exceeds the scene's mesh complexity, raytraced illumination, natural surface aging and character artistry. Hardware GPU benchmarking and full-rate reflective rendering remain to be validated. Software WebGL recordings use a lightweight capture mode that disables bloom and advanced shadows and therefore do not demonstrate the hardware-quality result.

**Deployment:** Only the connected GitHub graphics-toolkit branch is modified, not the existing published Director 4.0 website. The ten-floor map atlas and space flight modules remain separate until the real Director source repository is available.

