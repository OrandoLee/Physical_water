import { OBJECT_DEFINITIONS, ObjectKind } from '../objects/ObjectTypes'

export class InventoryBar {
  public readonly element: HTMLElement

  private preview: HTMLElement | null = null
  private dragging: ObjectKind | null = null

  constructor(
    root: HTMLElement,
    private readonly onDrop: (kind: ObjectKind, clientX: number, clientY: number) => void,
  ) {
    this.element = document.createElement('section')
    this.element.className = 'inventory'

    for (const definition of OBJECT_DEFINITIONS) {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = `inventory-item inventory-${definition.kind}`
      item.innerHTML = `
        <span class="inventory-icon">${definition.icon}</span>
        <span class="inventory-label">${definition.label}</span>
      `
      item.addEventListener('pointerdown', (event) => this.startDrag(event, definition.kind))
      this.element.appendChild(item)
    }

    window.addEventListener('pointermove', (event) => this.moveDrag(event))
    window.addEventListener('pointerup', (event) => this.endDrag(event))
    root.appendChild(this.element)
  }

  get isDragging(): boolean {
    return this.dragging !== null
  }

  private startDrag(event: PointerEvent, kind: ObjectKind): void {
    event.preventDefault()
    event.stopPropagation()
    this.dragging = kind
    this.preview = document.createElement('div')
    this.preview.className = `drag-preview inventory-${kind}`
    this.preview.textContent = OBJECT_DEFINITIONS.find((item) => item.kind === kind)?.icon ?? ''
    document.body.appendChild(this.preview)
    this.movePreview(event.clientX, event.clientY)
  }

  private moveDrag(event: PointerEvent): void {
    if (!this.dragging) {
      return
    }
    event.preventDefault()
    this.movePreview(event.clientX, event.clientY)
  }

  private endDrag(event: PointerEvent): void {
    if (!this.dragging) {
      return
    }
    const kind = this.dragging
    this.dragging = null
    this.preview?.remove()
    this.preview = null
    this.onDrop(kind, event.clientX, event.clientY)
  }

  private movePreview(clientX: number, clientY: number): void {
    if (!this.preview) {
      return
    }
    this.preview.style.transform = `translate(${clientX - 28}px, ${clientY - 28}px)`
  }
}
