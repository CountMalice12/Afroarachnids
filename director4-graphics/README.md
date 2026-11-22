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
