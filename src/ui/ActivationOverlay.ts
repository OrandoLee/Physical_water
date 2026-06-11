export class ActivationOverlay {
  public readonly element: HTMLButtonElement
  private active = false

  constructor(private readonly root: HTMLElement, private readonly onActivate: () => void) {
    this.element = document.createElement('button')
    this.element.className = 'activation-overlay'
    this.element.type = 'button'
    this.element.innerHTML = `
      <span class="activation-title">Click to activate sandbox</span>
      <span class="activation-subtitle">WASD move · drag water · drop objects</span>
    `
    this.element.addEventListener('click', () => this.activate())
    root.appendChild(this.element)
  }

  activate(): void {
    if (this.active) {
      return
    }
    this.active = true
    this.element.classList.add('is-hidden')
    this.onActivate()
  }

  show(): void {
    this.active = false
    this.element.classList.remove('is-hidden')
  }

  setEmbedMode(isEmbed: boolean): void {
    this.root.classList.toggle('is-embed', isEmbed)
  }
}
