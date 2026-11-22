/**
 * Non-destructive integration boundary for the *existing* World Director 4.0.
 * Import this into its own module only after mapping actual state and save APIs.
 * Collision and LOS are read-only; committing actions remains the GM/game engine's job.
 */
export function directorBridge({scene, canMove, clearLineOfSight}) {
  return {
    previewMove(from, to) {
      return {allowed: canMove(from, to), distanceMeters: Math.hypot(to.x-from.x,to.z-from.z)};
    },
    previewShot(from, to) {
      return {clear: clearLineOfSight(from, to)};
    },
    // Provide scene identifier mapping instead of assuming map01/37 naming.
    rendererScene: scene
  };
}
