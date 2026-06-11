import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { FloatingObject } from '../objects/FloatingObject'
import { createFloatingObject } from '../objects/ObjectFactory'
import { ObjectKind } from '../objects/ObjectTypes'
import { ActivationOverlay } from '../ui/ActivationOverlay'
import { Hud } from '../ui/Hud'
import { InventoryBar } from '../ui/InventoryBar'
import { TANK, WATER } from '../utils/constants'
import { screenToNdc } from '../utils/math'
import { WaterSurface } from '../water/WaterSurface'
import { CameraController } from './CameraController'
import { addLighting } from './Lighting'
import { createPostProcessing } from './PostProcessing'

export class SceneApp {
  private readonly isEmbed = new URLSearchParams(window.location.search).get('embed') === '1'
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  private readonly clock = new THREE.Clock()
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly dropPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TANK.waterLevel)
  private readonly dropPoint = new THREE.Vector3()
  private readonly collisionNormal = new THREE.Vector3()
  private readonly relativeVelocity = new THREE.Vector3()
  private readonly tangentVelocity = new THREE.Vector3()
  private readonly water: WaterSurface
  private readonly cameraController: CameraController
  private readonly composer: EffectComposer
  private readonly overlay: ActivationOverlay
  private readonly inventory: InventoryBar
  private readonly objects: FloatingObject[] = []
  private waterVolume?: THREE.Mesh
  private overflowGroup?: THREE.Group
  private overflowPuddle?: THREE.Mesh
  private readonly overflowSheets: THREE.Mesh[] = []
  private overflowDepth = 0

  private waterDragging = false
  private paused = false
  private inViewport = true
  private frame = 0

  constructor(private readonly root: HTMLElement) {
    this.root.classList.toggle('embed-mode', this.isEmbed)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(root.clientWidth, root.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.08
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.domElement.className = 'water-canvas'
    this.renderer.domElement.tabIndex = 0
    root.appendChild(this.renderer.domElement)

    this.scene.background = new THREE.Color(0x071018)
    this.scene.fog = new THREE.Fog(0x071018, 11, 24)
    addLighting(this.scene)
    this.addEnvironment()

    this.water = new WaterSurface()
    this.scene.add(this.water.mesh)
    this.addTank()

    this.cameraController = new CameraController(this.camera, this.renderer.domElement)
    this.composer = createPostProcessing(this.renderer, this.scene, this.camera)
    this.overlay = new ActivationOverlay(root, () => this.activate())
    this.overlay.setEmbedMode(this.isEmbed)
    new Hud(root, this.isEmbed)
    this.inventory = new InventoryBar(root, (kind, x, y) => this.dropObject(kind, x, y))

    this.bindEvents()
    this.resize()
    this.postReady()
  }

  start(): void {
    this.renderer.setAnimationLoop(() => this.tick())
  }

  private activate(): void {
    this.cameraController.setActive(true)
    this.renderer.domElement.focus()
  }

  private tick(): void {
    const deltaTime = Math.min(this.clock.getDelta(), 0.033)
    if (this.paused || !this.inViewport) {
      if (this.frame++ % 30 === 0) {
        this.composer.render()
      }
      return
    }

    this.cameraController.update(deltaTime)
    for (const object of this.objects) {
      object.update(deltaTime, this.water)
    }
    this.resolveObjectCollisions()
    this.updateDisplacedWaterLevel(deltaTime)
    this.water.update(deltaTime)
    this.composer.render()
  }

  private addEnvironment(): void {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 22),
      new THREE.MeshStandardMaterial({
        color: 0x111922,
        roughness: 0.82,
        metalness: 0.06,
      }),
    )
    floor.rotation.x = -Math.PI * 0.5
    floor.position.y = -0.035
    floor.receiveShadow = true
    this.scene.add(floor)

    const grid = new THREE.GridHelper(18, 36, 0x1f9bab, 0x183744)
    grid.position.y = 0.005
    const gridMaterial = grid.material as THREE.Material
    gridMaterial.transparent = true
    gridMaterial.opacity = 0.24
    this.scene.add(grid)

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 9),
      new THREE.MeshStandardMaterial({
        color: 0x09131c,
        roughness: 0.9,
        metalness: 0,
      }),
    )
    backWall.position.set(0, 4.2, -7.8)
    backWall.receiveShadow = true
    this.scene.add(backWall)
  }

  private addTank(): void {
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xa9f5ff,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.72,
      transparent: true,
      opacity: 0.25,
      thickness: 0.35,
      side: THREE.DoubleSide,
    })

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(TANK.width, 0.08, TANK.depth),
      new THREE.MeshStandardMaterial({ color: 0x10242c, roughness: 0.5, metalness: 0.2 }),
    )
    base.position.y = TANK.bottomY + 0.02
    base.receiveShadow = true
    this.scene.add(base)

    const wallGroup = new THREE.Group()
    const wallData: Array<[number, number, number, number, number, number]> = [
      [TANK.width, TANK.height, TANK.wallThickness, 0, TANK.height / 2, TANK.depth / 2],
      [TANK.width, TANK.height, TANK.wallThickness, 0, TANK.height / 2, -TANK.depth / 2],
      [TANK.wallThickness, TANK.height, TANK.depth, TANK.width / 2, TANK.height / 2, 0],
      [TANK.wallThickness, TANK.height, TANK.depth, -TANK.width / 2, TANK.height / 2, 0],
    ]

    for (const [w, h, d, x, y, z] of wallData) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glass)
      wall.position.set(x, y, z)
      wall.castShadow = true
      wall.receiveShadow = true
      wallGroup.add(wall)
    }

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(TANK.width, TANK.height, TANK.depth)),
      new THREE.LineBasicMaterial({ color: 0x7af7ff, transparent: true, opacity: 0.72 }),
    )
    outline.position.y = TANK.height / 2
    wallGroup.add(outline)
    this.scene.add(wallGroup)

    this.waterVolume = new THREE.Mesh(
      new THREE.BoxGeometry(TANK.width - 0.1, TANK.waterLevel - 0.03, TANK.depth - 0.1),
      new THREE.MeshPhysicalMaterial({
        color: 0x0b8daf,
        transparent: true,
        opacity: 0.16,
        roughness: 0.08,
        transmission: 0.25,
        depthWrite: false,
      }),
    )
    this.waterVolume.position.y = TANK.waterLevel * 0.5
    this.scene.add(this.waterVolume)

    this.addOverflowVisuals()
  }

  private addOverflowVisuals(): void {
    this.overflowGroup = new THREE.Group()
    this.overflowGroup.visible = false

    const sheetMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x74ecff,
      transparent: true,
      opacity: 0,
      roughness: 0.06,
      transmission: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    const sheetData: Array<{ width: number; x: number; z: number; rotationY: number }> = [
      { width: TANK.width, x: 0, z: TANK.depth * 0.5 + 0.04, rotationY: 0 },
      { width: TANK.width, x: 0, z: -TANK.depth * 0.5 - 0.04, rotationY: 0 },
      { width: TANK.depth, x: TANK.width * 0.5 + 0.04, z: 0, rotationY: Math.PI * 0.5 },
      { width: TANK.depth, x: -TANK.width * 0.5 - 0.04, z: 0, rotationY: Math.PI * 0.5 },
    ]

    for (const data of sheetData) {
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 18, 6), sheetMaterial.clone())
      sheet.position.set(data.x, TANK.height - WATER.overflowMargin, data.z)
      sheet.rotation.y = data.rotationY
      sheet.scale.set(data.width, 0.001, 1)
      this.overflowSheets.push(sheet)
      this.overflowGroup.add(sheet)
    }

    this.overflowPuddle = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 4.8, 72),
      new THREE.MeshBasicMaterial({
        color: 0x3fdcff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    this.overflowPuddle.rotation.x = -Math.PI * 0.5
    this.overflowPuddle.position.y = 0.012
    this.overflowGroup.add(this.overflowPuddle)
    this.scene.add(this.overflowGroup)
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.resize())
    document.addEventListener('visibilitychange', () => {
      this.paused = document.hidden
      if (document.hidden) {
        this.cameraController.clearInput()
      }
    })

    const observer = new IntersectionObserver((entries) => {
      this.inViewport = entries[0]?.isIntersecting ?? true
    }, { threshold: 0.05 })
    observer.observe(this.root)

    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        this.cameraController.setActive(false)
        this.cameraController.endRotation()
        this.cameraController.clearInput()
        this.waterDragging = false
        this.overlay.show()
      }
    })

    this.renderer.domElement.addEventListener('pointerdown', (event) => this.handlePointerDown(event))
    this.renderer.domElement.addEventListener('pointermove', (event) => this.handlePointerMove(event))
    this.renderer.domElement.addEventListener('pointerup', (event) => this.handlePointerUp(event))
    this.renderer.domElement.addEventListener('pointercancel', (event) => this.handlePointerUp(event))
    this.renderer.domElement.addEventListener('lostpointercapture', () => this.handlePointerCaptureLost())
    this.renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault())

    window.addEventListener('message', (event) => {
      const type = event.data?.type
      if (type === 'WATER_SANDBOX_PAUSE') {
        this.paused = true
      } else if (type === 'WATER_SANDBOX_RESUME') {
        this.paused = false
      } else if (type === 'WATER_SANDBOX_RESET') {
        this.reset()
      }
    })
  }

  private handlePointerDown(event: PointerEvent): void {
    if (this.inventory.isDragging || !this.cameraController.isActive) {
      return
    }
    event.preventDefault()
    this.renderer.domElement.focus()

    const waterHit = event.button === 0 ? this.getWaterHit(event) : null
    if (waterHit) {
      this.waterDragging = true
      const strength = event.shiftKey ? -0.7 : -0.32
      const radius = event.shiftKey ? 0.58 : 0.34
      this.water.disturb(waterHit.x, waterHit.z, strength, radius)
      this.renderer.domElement.setPointerCapture?.(event.pointerId)
      return
    }

    this.cameraController.beginRotation(event)
  }

  private handlePointerMove(event: PointerEvent): void {
    if (this.waterDragging) {
      event.preventDefault()
      const waterHit = this.getWaterHit(event)
      if (waterHit) {
        this.water.disturb(waterHit.x, waterHit.z, event.shiftKey ? -0.34 : -0.16, event.shiftKey ? 0.42 : 0.25)
      }
      return
    }

    this.cameraController.handlePointerMove(event)
  }

  private handlePointerUp(event: PointerEvent): void {
    event.preventDefault()
    this.waterDragging = false
    this.cameraController.endRotation(event)
  }

  private handlePointerCaptureLost(): void {
    this.waterDragging = false
    this.cameraController.endRotation()
  }

  private getWaterHit(event: PointerEvent): THREE.Vector3 | null {
    screenToNdc(event, this.renderer.domElement, this.pointer)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersections = this.raycaster.intersectObject(this.water.mesh, false)
    return intersections[0]?.point ?? null
  }

  private dropObject(kind: ObjectKind, clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const synthetic = { clientX, clientY } as MouseEvent
    screenToNdc(synthetic, this.renderer.domElement, this.pointer)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    this.dropPlane.constant = -this.water.level
    const validScreenPoint =
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom

    const hasIntersection = validScreenPoint && this.raycaster.ray.intersectPlane(this.dropPlane, this.dropPoint)
    const x = hasIntersection ? this.dropPoint.x : 0
    const z = hasIntersection ? this.dropPoint.z : 0
    const object = createFloatingObject(kind)
    const topLimit = TANK.height - object.definition.radius - TANK.wallThickness
    object.mesh.position.set(
      THREE.MathUtils.clamp(x, -TANK.width * 0.38, TANK.width * 0.38),
      THREE.MathUtils.clamp(this.water.level + 1.05, TANK.bottomY + object.definition.radius, topLimit),
      THREE.MathUtils.clamp(z, -TANK.depth * 0.36, TANK.depth * 0.36),
    )
    this.objects.push(object)
    this.scene.add(object.mesh)
  }

  private reset(): void {
    this.water.reset()
    this.updateWaterVolumeMesh(TANK.waterLevel)
    this.updateOverflowVisuals(0, 1)
    for (const object of this.objects) {
      this.scene.remove(object.mesh)
      object.dispose()
    }
    this.objects.length = 0
  }

  private resolveObjectCollisions(): void {
    if (this.objects.length < 2) {
      return
    }

    const iterations = this.objects.length > 8 ? 5 : 4
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      for (let i = 0; i < this.objects.length - 1; i += 1) {
        for (let j = i + 1; j < this.objects.length; j += 1) {
          this.resolveObjectPair(this.objects[i], this.objects[j], i, j)
        }
      }

      for (const object of this.objects) {
        object.constrainToTank(0.22)
      }
    }
  }

  private resolveObjectPair(a: FloatingObject, b: FloatingObject, indexA: number, indexB: number): void {
    const positionA = a.mesh.position
    const positionB = b.mesh.position
    const radiusA = a.definition.radius
    const radiusB = b.definition.radius
    const minDistance = radiusA + radiusB

    this.collisionNormal.subVectors(positionB, positionA)
    const distanceSq = this.collisionNormal.lengthSq()
    if (distanceSq >= minDistance * minDistance) {
      return
    }

    let distance = Math.sqrt(distanceSq)
    if (distance < 0.0001) {
      const angle = (indexA * 12.9898 + indexB * 78.233) % (Math.PI * 2)
      this.collisionNormal.set(Math.cos(angle), 0.25, Math.sin(angle)).normalize()
      distance = 0.0001
    } else {
      this.collisionNormal.multiplyScalar(1 / distance)
    }

    const inverseMassA = 1 / Math.max(a.definition.mass, 0.001)
    const inverseMassB = 1 / Math.max(b.definition.mass, 0.001)
    const inverseMassTotal = inverseMassA + inverseMassB
    const penetration = minDistance - distance
    const correction = Math.max(penetration - 0.004, 0) * 0.82 / inverseMassTotal

    positionA.addScaledVector(this.collisionNormal, -correction * inverseMassA)
    positionB.addScaledVector(this.collisionNormal, correction * inverseMassB)

    this.relativeVelocity.subVectors(b.velocity, a.velocity)
    const separatingVelocity = this.relativeVelocity.dot(this.collisionNormal)
    if (separatingVelocity >= 0) {
      return
    }

    const restitution = this.getPairRestitution(a, b)
    const impulseMagnitude = (-(1 + restitution) * separatingVelocity) / inverseMassTotal
    a.velocity.addScaledVector(this.collisionNormal, -impulseMagnitude * inverseMassA)
    b.velocity.addScaledVector(this.collisionNormal, impulseMagnitude * inverseMassB)

    this.tangentVelocity
      .copy(this.relativeVelocity)
      .addScaledVector(this.collisionNormal, -separatingVelocity)
    const tangentSpeed = this.tangentVelocity.length()
    if (tangentSpeed > 0.0001) {
      this.tangentVelocity.multiplyScalar(1 / tangentSpeed)
      const frictionMagnitude = Math.min(tangentSpeed / inverseMassTotal, impulseMagnitude * 0.38)
      a.velocity.addScaledVector(this.tangentVelocity, frictionMagnitude * inverseMassA)
      b.velocity.addScaledVector(this.tangentVelocity, -frictionMagnitude * inverseMassB)
    }

    a.angularVelocity.multiplyScalar(0.92)
    b.angularVelocity.multiplyScalar(0.92)
  }

  private getPairRestitution(a: FloatingObject, b: FloatingObject): number {
    const midpointY = (a.mesh.position.y + b.mesh.position.y) * 0.5
    if (midpointY < this.water.level + Math.max(a.definition.radius, b.definition.radius) * 0.45) {
      return 0.06
    }

    const heaviestDensity = Math.max(a.definition.density, b.definition.density)
    return heaviestDensity > 3 ? 0.18 : 0.12
  }

  private updateDisplacedWaterLevel(deltaTime: number): void {
    let displacedVolume = 0
    for (const object of this.objects) {
      displacedVolume += object.getDisplacedVolume(this.water.level)
    }

    const waterArea = TANK.width * TANK.depth
    const targetLevelRaw = TANK.waterLevel + (displacedVolume / waterArea) * WATER.displacementScale
    const overflowLevel = TANK.height - WATER.overflowMargin
    const targetLevel = Math.min(targetLevelRaw, overflowLevel)
    const targetOverflowDepth = Math.max(0, targetLevelRaw - overflowLevel)
    const smoothing = 1 - Math.exp(-deltaTime * 2.8)
    const nextLevel = THREE.MathUtils.lerp(this.water.level, targetLevel, smoothing)
    this.water.setLevel(nextLevel)
    this.updateWaterVolumeMesh(nextLevel)
    this.updateOverflowVisuals(targetOverflowDepth, deltaTime)
  }

  private updateWaterVolumeMesh(level: number): void {
    if (!this.waterVolume) {
      return
    }

    const baseHeight = TANK.waterLevel - 0.03
    const height = Math.max(0.05, level - 0.03)
    this.waterVolume.scale.y = height / baseHeight
    this.waterVolume.position.y = height * 0.5
  }

  private updateOverflowVisuals(targetOverflowDepth: number, deltaTime: number): void {
    if (!this.overflowGroup) {
      return
    }

    const smoothing = deltaTime >= 1 ? 1 : 1 - Math.exp(-deltaTime * 5.5)
    this.overflowDepth = THREE.MathUtils.lerp(this.overflowDepth, targetOverflowDepth, smoothing)
    const intensity = THREE.MathUtils.clamp(this.overflowDepth / WATER.overflowVisualDepth, 0, 1)
    this.overflowGroup.visible = intensity > 0.01

    const fallLength = THREE.MathUtils.lerp(0.08, WATER.overflowVisualDepth, intensity)
    const sheetOpacity = 0.05 + intensity * 0.28
    const sheetY = TANK.height - WATER.overflowMargin - fallLength * 0.5
    for (const sheet of this.overflowSheets) {
      sheet.position.y = sheetY
      sheet.scale.y = fallLength
      const material = sheet.material as THREE.Material & { opacity: number }
      material.opacity = sheetOpacity
    }

    if (this.overflowPuddle) {
      this.overflowPuddle.scale.setScalar(0.8 + intensity * 0.75)
      const material = this.overflowPuddle.material as THREE.Material & { opacity: number }
      material.opacity = intensity * 0.18
    }
  }

  private resize(): void {
    const width = Math.max(1, this.root.clientWidth)
    const height = Math.max(1, this.root.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(width, height, false)
    this.composer.setSize(width, height)
    this.cameraController.resize(width / height)
  }

  private postReady(): void {
    window.parent?.postMessage({ type: 'WATER_SANDBOX_READY' }, '*')
  }
}
