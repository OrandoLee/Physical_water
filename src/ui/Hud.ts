export class Hud {
  public readonly element: HTMLElement

  constructor(root: HTMLElement, isEmbed: boolean) {
    this.element = document.createElement('section')
    this.element.className = 'hud'
    this.element.innerHTML = `
      <div class="hud-title">Physical Water Sandbox</div>
      <div class="hud-grid">
        <span>WASD</span><b>Move</b>
        <span>Mouse</span><b>Look / ripple</b>
        <span>Shift</span><b>Stronger water impulse</b>
        <span>Drag</span><b>Drop objects</b>
        <span>ESC</span><b>Release</b>
      </div>
    `
    this.element.classList.toggle('is-embed', isEmbed)
    root.appendChild(this.element)
  }
}
