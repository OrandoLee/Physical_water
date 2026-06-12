import * as THREE from 'three'

interface SplashParticle {
  active: boolean
  life: number
  maxLife: number
  size: number
  position: THREE.Vector3
  velocity: THREE.Vector3
}

export interface SplashImpact {
  position: THREE.Vector3
  radius: number
  strength: number
  speed: number
}

export class SplashParticles {
  public readonly points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>

  private readonly maxParticles = 520
  private readonly particles: SplashParticle[] = []
  private readonly positions = new Float32Array(this.maxParticles * 3)
  private readonly sizes = new Float32Array(this.maxParticles)
  private readonly alphas = new Float32Array(this.maxParticles)
  private cursor = 0

  constructor() {
    for (let i = 0; i < this.maxParticles; i += 1) {
      this.particles.push({
        active: false,
        life: 0,
        maxLife: 1,
        size: 0,
        position: new THREE.Vector3(0, -40, 0),
        velocity: new THREE.Vector3(),
      })
      this.positions[i * 3 + 1] = -40
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1))

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        color: { value: new THREE.Color(0xcffaff) },
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;

        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (160.0 / max(-mvPosition.z, 0.35));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;

        void main() {
          vec2 centered = gl_PointCoord - vec2(0.5);
          float distanceToCenter = length(centered);
          float bead = smoothstep(0.5, 0.22, distanceToCenter);
          float sparkle = smoothstep(0.5, 0.0, distanceToCenter);
          gl_FragColor = vec4(color + sparkle * 0.35, bead * vAlpha);
        }
      `,
    })

    this.points = new THREE.Points(geometry, material)
    this.points.frustumCulled = false
    this.points.name = 'Splash particles'
    this.points.renderOrder = 8
  }

  spawn(impact: SplashImpact): void {
    const count = THREE.MathUtils.clamp(Math.floor(18 + impact.strength * 72), 16, 96)
    const baseSpeed = THREE.MathUtils.clamp(impact.speed, 0.4, 4.8)

    for (let i = 0; i < count; i += 1) {
      const particle = this.particles[this.cursor]
      const angle = Math.random() * Math.PI * 2
      const radial = Math.random() ** 0.55
      const launch = 0.34 + Math.random() * 0.8 + baseSpeed * 0.1
      const radius = impact.radius * (0.25 + radial * 1.15)

      particle.active = true
      particle.life = 0
      particle.maxLife = 0.42 + Math.random() * 0.46
      particle.size = 6 + Math.random() * 15 + impact.strength * 5
      particle.position.set(
        impact.position.x + Math.cos(angle) * radius * 0.35,
        impact.position.y + 0.03 + Math.random() * 0.06,
        impact.position.z + Math.sin(angle) * radius * 0.35,
      )
      particle.velocity.set(
        Math.cos(angle) * launch * radial,
        1.1 + Math.random() * 1.8 + baseSpeed * 0.22,
        Math.sin(angle) * launch * radial,
      )

      this.cursor = (this.cursor + 1) % this.maxParticles
    }
  }

  update(deltaTime: number): void {
    for (let i = 0; i < this.maxParticles; i += 1) {
      const particle = this.particles[i]
      const offset = i * 3

      if (!particle.active) {
        this.positions[offset] = 0
        this.positions[offset + 1] = -40
        this.positions[offset + 2] = 0
        this.sizes[i] = 0
        this.alphas[i] = 0
        continue
      }

      particle.life += deltaTime
      if (particle.life >= particle.maxLife) {
        particle.active = false
        this.positions[offset + 1] = -40
        this.sizes[i] = 0
        this.alphas[i] = 0
        continue
      }

      particle.velocity.y -= 5.8 * deltaTime
      particle.velocity.multiplyScalar(Math.pow(0.985, deltaTime * 60))
      particle.position.addScaledVector(particle.velocity, deltaTime)

      const age = particle.life / particle.maxLife
      const fade = Math.sin((1 - age) * Math.PI * 0.5)
      this.positions[offset] = particle.position.x
      this.positions[offset + 1] = particle.position.y
      this.positions[offset + 2] = particle.position.z
      this.sizes[i] = particle.size * (1 - age * 0.35)
      this.alphas[i] = fade * 0.88
    }

    const geometry = this.points.geometry
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.size.needsUpdate = true
    geometry.attributes.alpha.needsUpdate = true
  }

  clear(): void {
    for (const particle of this.particles) {
      particle.active = false
      particle.life = 0
      particle.position.set(0, -40, 0)
      particle.velocity.set(0, 0, 0)
    }
    this.update(0)
  }

  dispose(): void {
    this.points.geometry.dispose()
    this.points.material.dispose()
  }
}
