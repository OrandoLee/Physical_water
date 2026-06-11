export class Hud {
  public readonly element: HTMLElement

  constructor(root: HTMLElement, isEmbed: boolean) {
    this.element = document.createElement('section')
    this.element.className = 'hud'
    this.element.innerHTML = `
      <div class="hud-title">3D 水体沙盒</div>
      <div class="hud-grid">
        <span>WASD</span><b>移动视角</b>
        <span>鼠标</span><b>观察 / 扰动水面</b>
        <span>Shift</span><b>增强水面扰动</b>
        <span>拖拽</span><b>投放物体</b>
        <span>ESC</span><b>释放控制</b>
      </div>
    `
    this.element.classList.toggle('is-embed', isEmbed)
    root.appendChild(this.element)
  }
}
