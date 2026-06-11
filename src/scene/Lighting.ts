import * as THREE from 'three'

export function addLighting(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xbfefff, 0x121923, 1.35))

  const key = new THREE.DirectionalLight(0xffffff, 2.8)
  key.position.set(4.5, 7, 5)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.near = 1
  key.shadow.camera.far = 18
  key.shadow.camera.left = -8
  key.shadow.camera.right = 8
  key.shadow.camera.top = 8
  key.shadow.camera.bottom = -8
  scene.add(key)

  const rim = new THREE.SpotLight(0x65f0ff, 5, 18, Math.PI * 0.18, 0.65, 1.2)
  rim.position.set(-5.5, 4.2, -4.8)
  rim.target.position.set(0, 1.3, 0)
  scene.add(rim.target, rim)

  const top = new THREE.PointLight(0xd9ffff, 1.8, 7)
  top.position.set(0, 4.8, 0)
  scene.add(top)
}
