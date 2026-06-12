import * as THREE from 'three'

export function createWaterMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      time: { value: 0 },
      shallowColor: { value: new THREE.Color(0x4fe7ff) },
      deepColor: { value: new THREE.Color(0x0b6f8f) },
      foamColor: { value: new THREE.Color(0xd9ffff) },
      opacity: { value: 0.66 },
      visualDensity: { value: 1 },
      rippleScale: { value: 1 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying float vWave;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vWave = position.y;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 shallowColor;
      uniform vec3 deepColor;
      uniform vec3 foamColor;
      uniform float opacity;
      uniform float visualDensity;
      uniform float rippleScale;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying float vWave;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDir), 0.0), 2.35);
        float waveBand = smoothstep(0.035, 0.16, abs(vWave));
        vec2 refractUv = vWorldPosition.xz * vec2(2.8, 3.6);
        float refractNoise =
          sin(refractUv.x + time * 1.4) *
          cos(refractUv.y - time * 1.1) +
          sin((refractUv.x + refractUv.y) * 1.7 + time * 0.65) * 0.55;
        float refract = refractNoise * 0.035 * rippleScale * visualDensity;
        float depthMix = clamp(0.45 + vWave * 2.0 - visualDensity * 0.08 + refract, 0.0, 1.0);
        vec3 color = mix(deepColor, shallowColor, depthMix);
        color.r += refract * 0.38;
        color.b -= refract * 0.22;
        color += foamColor * waveBand * 0.22;
        color += vec3(0.65, 0.95, 1.0) * fresnel * 0.75;
        float caustic =
          smoothstep(0.68, 1.0, sin(vWorldPosition.x * 8.0 + time * 1.9) * cos(vWorldPosition.z * 9.0 - time * 1.4) * 0.5 + 0.5) * 0.055;
        float shimmer = sin((vWorldPosition.x * 3.7 + vWorldPosition.z * 4.2) + time * 1.6) * 0.025;
        gl_FragColor = vec4(color + shimmer + caustic, opacity + fresnel * 0.18);
      }
    `,
  })
}
