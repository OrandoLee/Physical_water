import * as THREE from 'three'
import { FloatingObject } from './FloatingObject'
import { getObjectDefinition, ObjectKind } from './ObjectTypes'

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

export function createFloatingObject(kind: ObjectKind): FloatingObject {
  const definition = getObjectDefinition(kind)
  const mesh = createMesh(kind)
  mesh.traverse((child) => {
    const subMesh = child as THREE.Mesh
    subMesh.castShadow = true
    subMesh.receiveShadow = true
  })

  return new FloatingObject(mesh, definition)
}

function createMesh(kind: ObjectKind): THREE.Object3D {
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
