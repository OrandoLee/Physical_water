export type ObjectKind = 'wood' | 'metal' | 'glass' | 'buoy' | 'rock'

export interface ObjectDefinition {
  kind: ObjectKind
  label: string
  icon: string
  mass: number
  density: number
  buoyancy: number
  drag: number
  radius: number
  disturbanceStrength: number
  surfaceDamping: number
  sinkRate: number
}

export const OBJECT_DEFINITIONS: ObjectDefinition[] = [
  {
    kind: 'wood',
    label: 'Wood Ball',
    icon: 'WB',
    mass: 0.7,
    density: 0.55,
    buoyancy: 17,
    drag: 0.92,
    radius: 0.31,
    disturbanceStrength: 0.08,
    surfaceDamping: 5.8,
    sinkRate: 0,
  },
  {
    kind: 'metal',
    label: 'Metal Ball',
    icon: 'MB',
    mass: 3.4,
    density: 4.8,
    buoyancy: 4.3,
    drag: 0.82,
    radius: 0.3,
    disturbanceStrength: 0.32,
    surfaceDamping: 2.4,
    sinkRate: 2.8,
  },
  {
    kind: 'glass',
    label: 'Glass Block',
    icon: 'GB',
    mass: 1.4,
    density: 1.35,
    buoyancy: 8.2,
    drag: 0.86,
    radius: 0.34,
    disturbanceStrength: 0.16,
    surfaceDamping: 4.2,
    sinkRate: 0.35,
  },
  {
    kind: 'buoy',
    label: 'Yellow Buoy',
    icon: 'YB',
    mass: 0.45,
    density: 0.58,
    buoyancy: 9,
    drag: 0.9,
    radius: 0.34,
    disturbanceStrength: 0.035,
    surfaceDamping: 10.5,
    sinkRate: 0,
  },
  {
    kind: 'rock',
    label: 'Heavy Rock',
    icon: 'RK',
    mass: 4.1,
    density: 5.8,
    buoyancy: 3.2,
    drag: 0.78,
    radius: 0.36,
    disturbanceStrength: 0.42,
    surfaceDamping: 2.2,
    sinkRate: 3.6,
  },
]

export function getObjectDefinition(kind: ObjectKind): ObjectDefinition {
  const definition = OBJECT_DEFINITIONS.find((item) => item.kind === kind)
  if (!definition) {
    throw new Error(`Unknown object kind: ${kind}`)
  }
  return definition
}
