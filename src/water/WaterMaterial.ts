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

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying float vWave;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDir), 0.0), 2.35);
        float waveBand = smoothstep(0.035, 0.16, abs(vWave));
        vec3 color = mix(deepColor, shallowColor, 0.45 + vWave * 2.0);
        color += foamColor * waveBand * 0.22;
        color += vec3(0.65, 0.95, 1.0) * fresnel * 0.75;
        float shimmer = sin((vWorldPosition.x * 3.7 + vWorldPosition.z * 4.2) + time * 1.6) * 0.025;
        gl_FragColor = vec4(color + shimmer, opacity + fresnel * 0.18);
      }
    `,
  })
}
