import * as THREE from 'three'
import { TANK } from '../utils/constants'
import { clamp } from '../utils/math'
import { WaterSurface } from '../water/WaterSurface'
import { ObjectDefinition } from './ObjectTypes'

export class FloatingObject {
  public readonly velocity = new THREE.Vector3()
  public readonly angularVelocity = new THREE.Vector3(
    (Math.random() - 0.5) * 1.4,
    (Math.random() - 0.5) * 1.4,
    (Math.random() - 0.5) * 1.4,
  )

  private wasAboveWater = true
  private disturbanceClock = 0

  constructor(
    public readonly mesh: THREE.Object3D,
    public readonly definition: ObjectDefinition,
  ) {
    this.velocity.set(
      (Math.random() - 0.5) * 0.45,
      -0.4 - Math.random() * 0.45,
      (Math.random() - 0.5) * 0.45,
    )
  }

  update(deltaTime: number, water: WaterSurface): void {
    const position = this.mesh.position
    const radius = this.definition.radius
    const waterHeight = water.getHeightAt(position.x, position.z)
    const submergedDepth = waterHeight - (position.y - radius)
    const submergedRatio = clamp(submergedDepth / (radius * 2), 0, 1)
    const inWater = submergedRatio > 0.02

    let accelerationY = -9.8
    if (inWater) {
      const waveVelocity = water.getVelocityAt(position.x, position.z) * 45
      accelerationY += this.definition.buoyancy * submergedRatio / this.definition.density
      accelerationY += waveVelocity * 0.08
      this.velocity.multiplyScalar(this.definition.drag)
    }

    this.velocity.y += accelerationY * deltaTime
    position.addScaledVector(this.velocity, deltaTime)

    this.mesh.rotation.x += this.angularVelocity.x * deltaTime
    this.mesh.rotation.y += this.angularVelocity.y * deltaTime
    this.mesh.rotation.z += this.angularVelocity.z * deltaTime

    const halfWidth = TANK.width * 0.5 - radius - TANK.wallThickness
    const halfDepth = TANK.depth * 0.5 - radius - TANK.wallThickness
    if (position.x < -halfWidth || position.x > halfWidth) {
      position.x = clamp(position.x, -halfWidth, halfWidth)
      this.velocity.x *= -0.42
    }
    if (position.z < -halfDepth || position.z > halfDepth) {
      position.z = clamp(position.z, -halfDepth, halfDepth)
      this.velocity.z *= -0.42
    }

    const bottomLimit = TANK.bottomY + radius + 0.06
    if (position.y < bottomLimit) {
      position.y = bottomLimit
      this.velocity.y = Math.max(0, -this.velocity.y * 0.16)
      this.velocity.x *= 0.8
      this.velocity.z *= 0.8
      this.angularVelocity.multiplyScalar(0.9)
    }

    if (this.wasAboveWater && inWater) {
      water.disturb(
        position.x,
        position.z,
        -this.definition.disturbanceStrength,
        radius * (2.2 + this.definition.mass * 0.12),
      )
    }

    this.disturbanceClock += deltaTime
    if (inWater && this.disturbanceClock > 0.18 && this.velocity.lengthSq() > 0.08) {
      this.disturbanceClock = 0
      water.disturb(
        position.x,
        position.z,
        Math.sign(this.velocity.y || -1) * this.definition.disturbanceStrength * 0.2,
        radius * 1.65,
      )
    }

    this.wasAboveWater = !inWater
  }

  dispose(): void {
    this.mesh.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.geometry) {
        mesh.geometry.dispose()
      }
      const material = mesh.material
      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose())
      } else if (material) {
        material.dispose()
      }
    })
  }
}
