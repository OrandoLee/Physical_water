import * as THREE from 'three'
import { FloatingObject } from './FloatingObject'
import { CustomMaterialOptions, getObjectDefinition, ObjectKind } from './ObjectTypes'

const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x9c642f,
  roughness: 0.78,
  metalness: 0.03,
})

const metalMaterial = new THREE.MeshStandardMaterial({
  color: 0xd8e5ee,
  metalness: 1,
  roughness: 0.18,
})

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xc9f8ff,
  transmission: 0.72,
  transparent: true,
  opacity: 0.46,
  roughness: 0.04,
  metalness: 0,
  thickness: 0.55,
})

const yellowMaterial = new THREE.MeshStandardMaterial({
  color: 0xffcf32,
  roughness: 0.38,
  metalness: 0.02,
})

const beakMaterial = new THREE.MeshStandardMaterial({
  color: 0xff7a1a,
  roughness: 0.44,
})

const rockMaterial = new THREE.MeshStandardMaterial({
  color: 0x2f3439,
  roughness: 0.92,
  metalness: 0,
})

const foamMaterial = new THREE.MeshStandardMaterial({
  color: 0xf7fbf2,
  roughness: 0.86,
  metalness: 0,
})

const rubberMaterial = new THREE.MeshStandardMaterial({
  color: 0x161a1d,
  roughness: 0.64,
  metalness: 0.02,
})

const ceramicMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xf1e7d7,
  roughness: 0.28,
  metalness: 0,
  clearcoat: 0.7,
  clearcoatRoughness: 0.2,
})

const oilMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x30415b,
  roughness: 0.08,
  metalness: 0,
  transmission: 0.18,
  transparent: true,
  opacity: 0.72,
  ior: 1.47,
  thickness: 0.35,
})

export function createFloatingObject(kind: ObjectKind, customMaterial?: CustomMaterialOptions): FloatingObject {
  const definition = { ...getObjectDefinition(kind) }
  if (kind === 'custom' && customMaterial) {
    definition.density = customMaterial.density
    definition.mass = Math.max(0.2, customMaterial.density * 1.12)
    definition.sinkRate = customMaterial.density > 1 ? (customMaterial.density - 1) * 1.4 : 0
    definition.disturbanceStrength = THREE.MathUtils.clamp(0.08 + customMaterial.density * 0.08, 0.08, 0.42)
  }

  const mesh = createMesh(kind, customMaterial)
  mesh.traverse((child) => {
    const subMesh = child as THREE.Mesh
    subMesh.castShadow = true
    subMesh.receiveShadow = true
  })

  return new FloatingObject(mesh, definition)
}

function createMesh(kind: ObjectKind, customMaterial?: CustomMaterialOptions): THREE.Object3D {
  switch (kind) {
    case 'wood':
      return createWoodBall()
    case 'metal':
      return new THREE.Mesh(new THREE.SphereGeometry(0.3, 36, 24), metalMaterial)
    case 'glass':
      return new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.56), glassMaterial)
    case 'buoy':
      return createDuckBuoy()
    case 'rock':
      return createRock()
    case 'foam':
      return createFoamBlock()
    case 'rubber':
      return createRubberRing()
    case 'ceramic':
      return createCeramicCapsule()
    case 'oil':
      return createOilDrop()
    case 'custom':
      return createCustomObject(customMaterial)
  }
}

function createWoodBall(): THREE.Object3D {
  const group = new THREE.Group()
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.31, 32, 18), woodMaterial)
  const rings = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.008, 8, 54),
    new THREE.MeshStandardMaterial({ color: 0x5e351a, roughness: 0.8 }),
  )
  rings.rotation.x = Math.PI * 0.5
  group.add(ball, rings)
  return group
}

function createDuckBuoy(): THREE.Object3D {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.31, 32, 18), yellowMaterial)
  body.scale.set(1.18, 0.72, 0.86)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), yellowMaterial)
  head.position.set(0.24, 0.18, 0.04)
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.18, 18), beakMaterial)
  beak.rotation.z = -Math.PI * 0.5
  beak.position.set(0.4, 0.18, 0.04)
  group.add(body, head, beak)
  return group
}

function createRock(): THREE.Object3D {
  const geometry = new THREE.IcosahedronGeometry(0.36, 1)
  const positions = geometry.getAttribute('position')
  for (let i = 0; i < positions.count; i += 1) {
    const scale = 0.86 + Math.random() * 0.28
    positions.setXYZ(
      i,
      positions.getX(i) * scale,
      positions.getY(i) * (0.7 + Math.random() * 0.2),
      positions.getZ(i) * scale,
    )
  }
  positions.needsUpdate = true
  geometry.computeVertexNormals()
  return new THREE.Mesh(geometry, rockMaterial)
}

function createFoamBlock(): THREE.Object3D {
  const group = new THREE.Group()
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.34, 0.44, 2, 1, 2), foamMaterial)
  block.rotation.set(0.12, 0.22, -0.08)
  const pores = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xd8e1d4, roughness: 1 }),
  )
  for (let i = 0; i < 18; i += 1) {
    const pore = pores.clone()
    pore.position.set((Math.random() - 0.5) * 0.48, 0.175, (Math.random() - 0.5) * 0.34)
    group.add(pore)
  }
  group.add(block)
  return group
}

function createRubberRing(): THREE.Object3D {
  const group = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.075, 18, 48), rubberMaterial)
  ring.rotation.x = Math.PI * 0.5
  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.078, 18, 48, Math.PI * 0.42),
    new THREE.MeshStandardMaterial({ color: 0xff4d45, roughness: 0.5 }),
  )
  stripe.rotation.x = Math.PI * 0.5
  group.add(ring, stripe)
  return group
}

function createCeramicCapsule(): THREE.Object3D {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.34, 10, 28), ceramicMaterial)
  body.rotation.z = Math.PI * 0.5
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.225, 0.012, 8, 36),
    new THREE.MeshStandardMaterial({ color: 0x315f8f, roughness: 0.32 }),
  )
  band.rotation.y = Math.PI * 0.5
  group.add(body, band)
  return group
}

function createOilDrop(): THREE.Object3D {
  const geometry = new THREE.SphereGeometry(0.34, 36, 22)
  const positions = geometry.getAttribute('position')
  for (let i = 0; i < positions.count; i += 1) {
    const y = positions.getY(i)
    const taper = y > 0 ? 1 - y * 0.18 : 1 + Math.abs(y) * 0.08
    positions.setXYZ(i, positions.getX(i) * taper, y * 1.08, positions.getZ(i) * taper)
  }
  positions.needsUpdate = true
  geometry.computeVertexNormals()
  return new THREE.Mesh(geometry, oilMaterial)
}

function createCustomObject(customMaterial?: CustomMaterialOptions): THREE.Object3D {
  const options = customMaterial ?? {
    color: 0xff6f4a,
    density: 1.15,
    roughness: 0.42,
    metalness: 0.04,
    transmission: 0,
  }
  const material = new THREE.MeshPhysicalMaterial({
    color: options.color,
    roughness: options.roughness,
    metalness: options.metalness,
    transmission: options.transmission,
    transparent: options.transmission > 0,
    opacity: options.transmission > 0 ? 0.55 : 1,
    ior: options.transmission > 0 ? 1.46 : 1.2,
    thickness: 0.5,
    clearcoat: options.metalness > 0.5 ? 0.25 : 0.55,
    clearcoatRoughness: options.roughness * 0.6,
  })
  const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 1), material)
  mesh.scale.set(1.06, 0.9, 1)
  return mesh
}
