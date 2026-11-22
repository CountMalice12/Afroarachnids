# Crystal Palace asset production pipeline

This is not a bundle of copyrighted Cyberpunk screenshots or extracted game models. All shipped scene assets need creator permission and verified licenses.

## Authoring and preparation
1. Model each Palace sector, ship and prop in **Blender** and export GLB with PBR metal/roughness material definitions. Make collision proxies separately and annotate destroyable objects with a stable gameplay ID.
2. Build material texture sets (basecolor, normal, roughness, metalness, ambient occlusion and optional emissive). Good CC0 starting points: https://polyhaven.com and https://ambientcg.com. Check each asset's attribution and license before shipping.
3. Optimize using **glTF Transform CLI**: `npx gltf-transform optimize input.glb output.glb`. For larger scenes, use meshoptimizer/gltfpack and KTX2/Basis Universal texture compression where supported.
4. Use **Khronos glTF Sample Assets** to validate reflective metal, glass and transmission material behavior, not as unrestricted production props.
5. Build simplified **navmeshes** (recast-navigation-js), collider hulls and cover/LOS masks from the authored scene. Visible mesh and collisions must represent the same physical obstruction.
6. Stream one Palace sector at a time, with LOD, instancing, occlusion/frustum culling and adaptive device pixel ratio. Large ships and orbital habitats need their own LOD families.
7. Test the 10 Palace sectors and three orbital combat maps at comparable physical viewport sizes, not hardcoded texture dimensions.

## Feature acceptance tests
- Character may rotate orbit camera around the casino to see authentic, fully modeled table backs and wall surfaces, not a single projected 2D image.
- A solid door blocks walking and weapon LOS until it actually opens or breaks.
- Destructible crate updates renderer, physics, LOS and NPC pathfinding together.
- 3D ship battlefield has full X/Y/Z motion and camera zoom; the flight canvas matches tactical map resolution, including DPR scaling on mobile.
- Existing Director combat and save format remain authoritative. New graphics are a *view* of game state, never an independent simulation state.
- Publish hardware benchmarks for low/medium/high graphics profiles before promising a fixed FPS.

## Sources
- Three.js: https://github.com/mrdoob/three.js
- Blender: https://github.com/blender/blender
- Postprocessing: https://github.com/pmndrs/postprocessing
- three-mesh-bvh: https://github.com/gkjohnson/three-mesh-bvh
- Rapier: https://github.com/dimforge/rapier
- Recast Navigation: https://github.com/isaac-mason/recast-navigation-js
- glTF Transform: https://github.com/donmccurdy/glTF-Transform
- Meshoptimizer: https://github.com/zeux/meshoptimizer
- KTX Software: https://github.com/KhronosGroup/KTX-Software
- Khronos sample assets: https://github.com/KhronosGroup/glTF-Sample-Assets

These are upstream projects, not copied into the user's source tree. `npm install` resolves the selected dependency packages.
