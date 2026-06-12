import * as THREE from 'three'
import { TANK } from '../utils/constants'
import { WaterPreset } from './WaterPresets'

export class UnderwaterVisuals {
  public readonly group = new THREE.Group()
  public readonly volume: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>

  private readonly causticMaterial: THREE.ShaderMaterial
  private readonly volumeBaseHeight = TANK.waterLevel - 0.03
  private time = 0

  constructor(preset: WaterPreset) {
    this.volume = new THREE.Mesh(
      new THREE.BoxGeometry(TANK.width - 0.1, this.volumeBaseHeight, TANK.depth - 0.1),
      new THREE.MeshPhysicalMaterial({
        color: preset.volumeColor,
        transparent: true,
        opacity: 0.16 + preset.opacity * 0.16,
        roughness: 0.03,
        metalness: 0,
        transmission: 0.38,
        thickness: 1.2,
        ior: 1.333,
        attenuationColor: new THREE.Color(preset.volumeColor),
        attenuationDistance: 2.4 / preset.density,
        depthWrite: false,
      }),
    )
    this.volume.position.y = this.volumeBaseHeight * 0.5
    this.volume.renderOrder = 2

    this.causticMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(preset.shallowColor) },
        intensity: { value: 0.22 },
        density: { value: preset.density },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float intensity;
        uniform float density;
        varying vec2 vUv;

        float band(vec2 p, float speed, float scale) {
          float a = sin((p.x + p.y * 0.65) * scale + time * speed);
          float b = sin((p.x * -0.7 + p.y) * (scale * 1.37) - time * speed * 0.82);
          float c = sin(length(p - 0.5) * scale * 1.9 + time * speed * 0.55);
          return smoothstep(0.74, 1.0, (a + b + c) / 3.0 * 0.5 + 0.5);
        }

        void main() {
          vec2 p = vUv * vec2(5.2, 3.0);
          float caustic = band(p, 1.35, 7.0) + band(p + vec2(0.31, -0.17), 0.9, 10.5) * 0.65;
          float edgeFade = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x)
            * smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.84, vUv.y);
          float alpha = caustic * edgeFade * intensity / max(density, 0.65);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    })

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(TANK.width - 0.22, TANK.depth - 0.22), this.causticMaterial)
    floor.rotation.x = -Math.PI * 0.5
    floor.position.y = TANK.bottomY + 0.085
    floor.renderOrder = 3

    const back = new THREE.Mesh(new THREE.PlaneGeometry(TANK.width - 0.2, TANK.height - 0.18), this.causticMaterial.clone())
    back.position.set(0, TANK.height * 0.5, -TANK.depth * 0.5 + 0.07)
    back.renderOrder = 3

    this.group.add(this.volume, floor, back)
    this.group.name = 'Underwater refraction volume'
  }

  update(deltaTime: number, level: number, rippleEnergy: number): void {
    this.time += deltaTime
    const height = Math.max(0.05, level - 0.03)
    this.volume.scale.y = height / this.volumeBaseHeight
    this.volume.position.y = height * 0.5

    const intensity = THREE.MathUtils.clamp(0.18 + rippleEnergy * 3.4, 0.16, 0.46)
    this.updateCausticUniforms(this.causticMaterial, intensity)
    for (const child of this.group.children) {
      const mesh = child as THREE.Mesh
      if (mesh.material instanceof THREE.ShaderMaterial && mesh.material !== this.causticMaterial) {
        this.updateCausticUniforms(mesh.material, intensity * 0.7)
      }
    }
  }

  setPreset(preset: WaterPreset): void {
    this.volume.material.color.setHex(preset.volumeColor)
    this.volume.material.opacity = 0.16 + preset.opacity * 0.16
    this.volume.material.attenuationColor?.setHex(preset.volumeColor)
    this.volume.material.attenuationDistance = 2.4 / preset.density
    this.volume.material.needsUpdate = true

    this.causticMaterial.uniforms.color.value.setHex(preset.shallowColor)
    this.causticMaterial.uniforms.density.value = preset.density
    for (const child of this.group.children) {
      const mesh = child as THREE.Mesh
      if (mesh.material instanceof THREE.ShaderMaterial && mesh.material !== this.causticMaterial) {
        mesh.material.uniforms.color.value.setHex(preset.shallowColor)
        mesh.material.uniforms.density.value = preset.density
      }
    }
  }

  dispose(): void {
    this.group.traverse((child) => {
      const mesh = child as THREE.Mesh
      mesh.geometry?.dispose()
      const material = mesh.material
      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose())
      } else {
        material?.dispose()
      }
    })
  }

  private updateCausticUniforms(material: THREE.ShaderMaterial, intensity: number): void {
    material.uniforms.time.value = this.time
    material.uniforms.intensity.value = intensity
  }
}
