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
  private readonly spinDamping = 0.985

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
      const density = this.definition.density / water.density
      const waveVelocity = water.getVelocityAt(position.x, position.z)
      const damping = Math.pow(this.definition.drag, deltaTime * 60)
      this.velocity.x *= damping
      this.velocity.z *= damping

      if (density < 1) {
        accelerationY += 9.8 * submergedRatio / density
        accelerationY -= this.velocity.y * this.definition.surfaceDamping
        accelerationY += waveVelocity * 1.8
      } else {
        accelerationY += 9.8 * submergedRatio / density
        accelerationY -= this.velocity.y * this.definition.surfaceDamping * 0.42
        accelerationY -= this.definition.sinkRate * submergedRatio
      }
    }

    const maxRiseSpeed = this.definition.kind === 'buoy' ? 0.72 : 1.35
    this.velocity.y = clamp(this.velocity.y + accelerationY * deltaTime, -4.2, maxRiseSpeed)
    position.addScaledVector(this.velocity, deltaTime)

    this.mesh.rotation.x += this.angularVelocity.x * deltaTime
    this.mesh.rotation.y += this.angularVelocity.y * deltaTime
    this.mesh.rotation.z += this.angularVelocity.z * deltaTime
    this.angularVelocity.multiplyScalar(Math.pow(this.spinDamping, deltaTime * 60))

    this.constrainToTank()

    if (this.wasAboveWater && inWater) {
      const impactStrength = this.definition.disturbanceStrength * clamp(Math.abs(this.velocity.y) * 0.6, 0.45, 1.25)
      water.disturb(
        position.x,
        position.z,
        -impactStrength,
        radius * (2.2 + this.definition.mass * 0.12),
      )
      this.wasAboveWater = !inWater
      return
    }

    this.disturbanceClock += deltaTime
    if (inWater && this.disturbanceClock > 0.28 && this.velocity.lengthSq() > 0.16) {
      this.disturbanceClock = 0
      water.disturb(
        position.x,
        position.z,
        Math.sign(this.velocity.y || -1) * this.definition.disturbanceStrength * 0.08,
        radius * 1.35,
      )
    }

    this.wasAboveWater = !inWater
  }

  constrainToTank(restitution = 0.34): void {
    const position = this.mesh.position
    const radius = this.definition.radius
    const halfWidth = TANK.width * 0.5 - radius - TANK.wallThickness
    const halfDepth = TANK.depth * 0.5 - radius - TANK.wallThickness
    if (position.x < -halfWidth || position.x > halfWidth) {
      position.x = clamp(position.x, -halfWidth, halfWidth)
      this.velocity.x *= -restitution
    }
    if (position.z < -halfDepth || position.z > halfDepth) {
      position.z = clamp(position.z, -halfDepth, halfDepth)
      this.velocity.z *= -restitution
    }

    const bottomLimit = TANK.bottomY + radius + 0.06
    if (position.y < bottomLimit) {
      position.y = bottomLimit
      this.velocity.y = Math.max(0, -this.velocity.y * 0.16)
      this.velocity.x *= 0.8
      this.velocity.z *= 0.8
      this.angularVelocity.multiplyScalar(0.9)
    }

    const topLimit = TANK.height - radius - TANK.wallThickness
    if (position.y > topLimit) {
      position.y = topLimit
      this.velocity.y = Math.min(0, -this.velocity.y * 0.18)
    }
  }

  getDisplacedVolume(waterLevel: number): number {
    const radius = this.definition.radius
    const submergedDepth = waterLevel - (this.mesh.position.y - radius)
    const submergedRatio = clamp(submergedDepth / (radius * 2), 0, 1)
    const approximateVolume = (4 / 3) * Math.PI * radius ** 3
    return approximateVolume * submergedRatio
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
