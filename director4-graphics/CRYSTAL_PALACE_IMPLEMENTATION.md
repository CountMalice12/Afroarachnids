# Crystal Palace: ten physically modeled sector prototypes

These ten scenes are original procedural 3D geometry, built by interpreting the **existing Ghosts: Operation Zero Director 4.0 tactical map set**, and especially its detailed cinematic casino and EVA gantry artwork. The reference JPEGs/PNGs are not baked into the renderer as fake scenery. They remain separate user-side source artwork (see the reference ZIP provided alongside the response).

## Launch

```sh
cd director4-graphics
npm install
npm run dev
```

Open `/palace.html`. The existing `/flight.html` still contains the three real-time space-combat environments. These are **not merged into the published Director 4.0 website**, which is not among the GitHub repositories available for writing here.

## Sector-to-scene conversion

| Sector | Modeled original 3D elements | Reference basis |
|---|---|---|
| CP-01 Docking | Landing platforms, shuttles, docking clamps, illuminated gantries, cargo crates | Existing Docking Core grid |
| CP-02 Immigration | Security doors, turnstiles, biometrics kiosks, holding partitions | Existing Immigration grid |
| CP-03 Casino | Raised fountain/crystals, brass gallery mezzanines, winding stairs, six gaming islands, floor marble texture, vegetation, glass walls | Existing casino master cinematic artwork + Casino grid |
| CP-04 Hotel | Reception desks, elevated steps, guest beds, window partitions, lobby planting | Hotel schematic |
| CP-05 Gardens | Botanical dome, dozens of plants, irrigation pool, glass ribs, walkways | Gardens schematic |
| CP-06 Habitation | Multi-district service counters, market booths, wall light panels and seating | Habitation schematic |
| CP-07 Industrial | Fabrication machines, rails, conveyors, robotic arms, maintenance layout | Industrial schematic |
| CP-08 Medtech | Cryopods, surgical apparatus, console arrays, sealed partitions | Medtech schematic |
| CP-09 Administration | Zero-G spindle, radial power connections, relay servers, command core | Administration schematic |
| CP-10 EVA Gantry | True 3D hull geometry, trusses, railings, catwalk, tethering supports, Earth and station in background | Detailed EVA reference artwork + exterior grid |

## Mechanics currently wired to scene geometry

- Orbit camera, mouse/touch panning and zooming.
- Walkable floor and physical obstructions, 3D overlap checks.
- Physical doors: open to remove collision and line-of-sight occlusion.
- Physical destructible cover: after cover is destroyed, sight and movement update.
- Simple battle test: 8m movement budget, attack/action budget, NPC counterfire and alarm states.
- Each floor has a designated gravity regime and room metadata.
- Automatic responsive viewport and device pixel-ratio profiles, with a low-resource recording mode.

## Crucial limitations

- Original artwork is a **visual reference**, not an automatically converted 3D reconstruction. Since it is a rendered photograph-like perspective without underlying geometry, it cannot directly turn into mesh/model files.
- The scenes are **fully 3D architectural prototypes, not photorealistic equivalents of the paintings**. Reaching those images' art standard requires bespoke high-quality GLBs, detailed PBR texture sets, baked lighting data, HDRI/IBL, character models and art direction.
- Door/cover raycasts and swept 2D collision proxies are implemented for the lab. They need proper navmesh generation, floor-height traversal, physics colliders, zero-G controls and accurate RED combat conversion before integration with the GM engine.
- Floor transitions here use a selector. Travel graph, security keys, elevators and saved player-state integration must be connected to the **actual current Director 4.0 source**.
- A graphics scene is not a campaign save. This lab does not modify players, saved character sheets or the live hosted site.
- Do not claim that a passed Vite compile alone proves hardware GPU rendering or performance.

## Acceptance checklist for bringing this into Director 4.0

1. The actual Director current source is available, with immutable backup of its campaign data.
2. At least one fully authored GLB per unique location is loaded via GLTFLoader, and textures compressed to KTX2 where practical.
3. One geometry/collision registry drives visible walls, movement, line of sight, destructible cover and pathfinding.
4. 10/10 sectors tested for camera rotation, cross-floor transitions, doors, LOS, combat, inventory and saved-state continuity.
5. Three ship battle maps and the Johnson transfer station verified using the same render scaling but their own combat scales.
6. Mobile and desktop GPU benchmark, graphical quality profiles, network loading and memory budgets measured.
