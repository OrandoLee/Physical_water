export const TANK = {
  width: 7.2,
  depth: 4.2,
  height: 3.6,
  bottomY: 0,
  waterLevel: 1.75,
  wallThickness: 0.055,
}

export const WATER = {
  columns: 112,
  rows: 72,
  damping: 0.955,
  propagation: 0.43,
  idleWave: 0.007,
  maxHeight: 0.22,
  displacementScale: 2.4,
  overflowMargin: 0.08,
  overflowVisualDepth: 0.72,
}

export const CAMERA = {
  minDistance: 5,
  maxDistance: 11,
  minPitch: -0.55,
  maxPitch: 0.45,
  moveSpeed: 3.2,
}
