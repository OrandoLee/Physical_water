import * as THREE from 'three'
import { TANK, WATER } from '../utils/constants'
import { clamp, lerp } from '../utils/math'
import { createWaterMaterial } from './WaterMaterial'

export class WaterSurface {
  public readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>

  private readonly columns = WATER.columns
  private readonly rows = WATER.rows
  private readonly current: Float32Array
  private readonly previous: Float32Array
  private readonly next: Float32Array
  private readonly positions: THREE.BufferAttribute
  private time = 0
  private baseLevel = TANK.waterLevel

  constructor() {
    const geometry = new THREE.PlaneGeometry(
      TANK.width,
      TANK.depth,
      this.columns - 1,
      this.rows - 1,
    )
    geometry.rotateX(-Math.PI / 2)

    const material = createWaterMaterial()
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = TANK.waterLevel
    this.mesh.receiveShadow = true
    this.mesh.name = 'Interactive water surface'

    this.positions = geometry.getAttribute('position') as THREE.BufferAttribute
    const size = this.columns * this.rows
    this.current = new Float32Array(size)
    this.previous = new Float32Array(size)
    this.next = new Float32Array(size)
  }

  update(deltaTime: number): void {
    this.time += deltaTime
    const steps = Math.max(1, Math.min(3, Math.ceil(deltaTime / (1 / 50))))

    for (let step = 0; step < steps; step += 1) {
      this.simulateStep()
    }

    this.writeGeometry()
    this.mesh.material.uniforms.time.value = this.time
  }

  get level(): number {
    return this.baseLevel
  }

  setLevel(level: number): void {
    this.baseLevel = clamp(level, TANK.waterLevel, TANK.waterLevel + WATER.maxLevelRise)
    this.mesh.position.y = this.baseLevel
  }

  disturb(worldX: number, worldZ: number, strength: number, radius: number): void {
    const clampedStrength = clamp(strength, -0.26, 0.26)
    const gridX = ((worldX / TANK.width) + 0.5) * (this.columns - 1)
    const gridZ = ((worldZ / TANK.depth) + 0.5) * (this.rows - 1)
    const radiusX = Math.max(1, (radius / TANK.width) * this.columns)
    const radiusZ = Math.max(1, (radius / TANK.depth) * this.rows)
    const minX = clamp(Math.floor(gridX - radiusX), 1, this.columns - 2)
    const maxX = clamp(Math.ceil(gridX + radiusX), 1, this.columns - 2)
    const minZ = clamp(Math.floor(gridZ - radiusZ), 1, this.rows - 2)
    const maxZ = clamp(Math.ceil(gridZ + radiusZ), 1, this.rows - 2)

    for (let z = minZ; z <= maxZ; z += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = (x - gridX) / radiusX
        const dz = (z - gridZ) / radiusZ
        const distance = Math.sqrt(dx * dx + dz * dz)
        if (distance <= 1) {
          const falloff = Math.cos(distance * Math.PI * 0.5) ** 2
          const i = this.index(x, z)
          this.current[i] = clamp(
            this.current[i] + clampedStrength * falloff,
            -WATER.maxHeight,
            WATER.maxHeight,
          )
        }
      }
    }
  }

  getHeightAt(worldX: number, worldZ: number): number {
    const gx = clamp(((worldX / TANK.width) + 0.5) * (this.columns - 1), 0, this.columns - 1)
    const gz = clamp(((worldZ / TANK.depth) + 0.5) * (this.rows - 1), 0, this.rows - 1)
    const x0 = Math.floor(gx)
    const z0 = Math.floor(gz)
    const x1 = Math.min(x0 + 1, this.columns - 1)
    const z1 = Math.min(z0 + 1, this.rows - 1)
    const tx = gx - x0
    const tz = gz - z0
    const h00 = this.current[this.index(x0, z0)]
    const h10 = this.current[this.index(x1, z0)]
    const h01 = this.current[this.index(x0, z1)]
    const h11 = this.current[this.index(x1, z1)]
    return this.baseLevel + lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), tz)
  }

  getVelocityAt(worldX: number, worldZ: number): number {
    const gx = clamp(Math.round(((worldX / TANK.width) + 0.5) * (this.columns - 1)), 0, this.columns - 1)
    const gz = clamp(Math.round(((worldZ / TANK.depth) + 0.5) * (this.rows - 1)), 0, this.rows - 1)
    const i = this.index(gx, gz)
    return this.current[i] - this.previous[i]
  }

  reset(): void {
    this.current.fill(0)
    this.previous.fill(0)
    this.next.fill(0)
    this.setLevel(TANK.waterLevel)
    this.writeGeometry()
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
  }

  private simulateStep(): void {
    for (let z = 1; z < this.rows - 1; z += 1) {
      for (let x = 1; x < this.columns - 1; x += 1) {
        const i = this.index(x, z)
        const neighbors =
          this.current[this.index(x - 1, z)] +
          this.current[this.index(x + 1, z)] +
          this.current[this.index(x, z - 1)] +
          this.current[this.index(x, z + 1)]
        const wave = neighbors * WATER.propagation - this.previous[i]
        const edgeFade =
          Math.min(x, z, this.columns - 1 - x, this.rows - 1 - z) < 3 ? 0.93 : 1
        this.next[i] = clamp(wave * WATER.damping * edgeFade, -WATER.maxHeight, WATER.maxHeight)
      }
    }

    this.previous.set(this.current)
    this.current.set(this.next)
    this.next.fill(0)
  }

  private writeGeometry(): void {
    for (let z = 0; z < this.rows; z += 1) {
      for (let x = 0; x < this.columns; x += 1) {
        const vertex = this.index(x, z)
        const positionIndex = vertex * 3 + 1
        const localX = (x / (this.columns - 1) - 0.5) * TANK.width
        const localZ = (z / (this.rows - 1) - 0.5) * TANK.depth
        const idle =
          Math.sin(localX * 2.2 + this.time * 1.1) *
          Math.cos(localZ * 2.9 - this.time * 0.8) *
          WATER.idleWave
        this.positions.array[positionIndex] = clamp(
          this.current[vertex] + idle,
          -WATER.maxHeight,
          WATER.maxHeight,
        )
      }
    }

    this.positions.needsUpdate = true
    this.mesh.geometry.computeVertexNormals()
  }

  private index(x: number, z: number): number {
    return z * this.columns + x
  }
}
