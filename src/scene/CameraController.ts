import * as THREE from 'three'
import { CAMERA, TANK } from '../utils/constants'
import { clamp } from '../utils/math'

export class CameraController {
  public readonly target = new THREE.Vector3(0, TANK.waterLevel * 0.72, 0)

  private yaw = -0.72
  private pitch = -0.18
  private distance = 8
  private active = false
  private rotating = false
  private readonly keys = new Set<string>()
  private readonly forward = new THREE.Vector3()
  private readonly right = new THREE.Vector3()

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly element: HTMLElement,
  ) {
    this.updateCamera()
    this.bindEvents()
  }

  setActive(active: boolean): void {
    this.active = active
    if (!active) {
      this.rotating = false
      this.keys.clear()
    }
  }

  get isActive(): boolean {
    return this.active
  }

  beginRotation(event: PointerEvent): void {
    if (!this.active) {
      return
    }
    event.preventDefault()
    this.rotating = true
    this.element.setPointerCapture?.(event.pointerId)
  }

  endRotation(event?: PointerEvent): void {
    this.rotating = false
    if (event) {
      this.element.releasePointerCapture?.(event.pointerId)
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (!this.active || !this.rotating) {
      return
    }
    this.yaw -= event.movementX * 0.006
    this.pitch = clamp(this.pitch - event.movementY * 0.0045, CAMERA.minPitch, CAMERA.maxPitch)
    this.updateCamera()
  }

  update(deltaTime: number): void {
    if (!this.active) {
      return
    }

    this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize()
    this.right.set(-this.forward.z, 0, this.forward.x).normalize()

    let moved = false
    const speed = CAMERA.moveSpeed * deltaTime
    if (this.keys.has('KeyW')) {
      this.target.addScaledVector(this.forward, speed)
      moved = true
    }
    if (this.keys.has('KeyS')) {
      this.target.addScaledVector(this.forward, -speed)
      moved = true
    }
    if (this.keys.has('KeyA')) {
      this.target.addScaledVector(this.right, -speed)
      moved = true
    }
    if (this.keys.has('KeyD')) {
      this.target.addScaledVector(this.right, speed)
      moved = true
    }

    if (moved) {
      this.target.x = clamp(this.target.x, -4.2, 4.2)
      this.target.z = clamp(this.target.z, -3.2, 3.2)
      this.updateCamera()
    }
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (event) => {
      if (!this.active) {
        return
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault()
        this.keys.add(event.code)
      }
    })

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code)
    })

    this.element.addEventListener('wheel', (event) => {
      if (!this.active) {
        return
      }
      event.preventDefault()
      this.distance = clamp(this.distance + event.deltaY * 0.006, CAMERA.minDistance, CAMERA.maxDistance)
      this.updateCamera()
    }, { passive: false })
  }

  private updateCamera(): void {
    const cosPitch = Math.cos(this.pitch)
    this.camera.position.set(
      this.target.x + Math.sin(this.yaw) * cosPitch * this.distance,
      this.target.y + Math.sin(-this.pitch) * this.distance + 2.1,
      this.target.z + Math.cos(this.yaw) * cosPitch * this.distance,
    )
    this.camera.position.y = clamp(this.camera.position.y, 1.1, 7)
    this.camera.lookAt(this.target)
  }
}
