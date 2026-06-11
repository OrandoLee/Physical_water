import * as THREE from 'three'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function screenToNdc(
  event: PointerEvent | MouseEvent,
  element: HTMLElement,
  target = new THREE.Vector2(),
): THREE.Vector2 {
  const rect = element.getBoundingClientRect()
  target.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  target.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
  return target
}
