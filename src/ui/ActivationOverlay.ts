export class ActivationOverlay {
  public readonly element: HTMLElement

  private active = false
  private readyTimer = 0
  private hasPlayedIntro = false

  constructor(
    private readonly root: HTMLElement,
    private readonly onActivate: () => void,
    private readonly onReset: () => void,
  ) {
    this.element = document.createElement('section')
    this.element.className = 'activation-overlay'
    this.element.setAttribute('aria-label', '物理水实验开始界面')
    this.element.innerHTML = `
      <div class="intro-splash" aria-hidden="true">
        <img class="intro-logo" src="./lab.svg" alt="" />
        <div class="intro-scanline"></div>
      </div>
      <div class="start-grid" aria-hidden="true">
        ${this.createGridCells()}
      </div>
      <div class="start-panel">
        <p class="start-index">实验编号 / 002</p>
        <p class="start-kicker">DELEE LAB 呈现</p>
        <h1 class="start-title">
          <span>PHYSICAL</span>
          <span>WATER</span>
        </h1>
        <p class="start-ghost">LAB-02</p>
        <div class="start-rule"></div>
        <div class="start-brief">
          <span>行动指令</span>
          <strong>进入三维水体沙盒，投放物体，观察浮力、扰动与溢流。</strong>
        </div>
        <div class="start-actions">
          <button class="start-action is-primary" type="button" data-action="start">
            <span>开始实验</span>
            <b aria-hidden="true">-&gt;</b>
          </button>
          <button class="start-action" type="button" data-action="reset">
            <span>重置水槽</span>
            <b aria-hidden="true">-&gt;</b>
          </button>
        </div>
      </div>
    `

    this.element.querySelector<HTMLButtonElement>('[data-action="start"]')?.addEventListener('click', () => this.activate())
    this.element.querySelector<HTMLButtonElement>('[data-action="reset"]')?.addEventListener('click', () => this.onReset())
    root.appendChild(this.element)
    this.playIntro()
  }

  activate(): void {
    if (this.active) {
      return
    }

    this.active = true
    window.clearTimeout(this.readyTimer)
    this.element.classList.add('is-leaving')
    window.setTimeout(() => {
      this.element.classList.add('is-hidden')
      this.element.classList.remove('is-leaving')
      this.onActivate()
    }, 520)
  }

  show(): void {
    this.active = false
    window.clearTimeout(this.readyTimer)
    this.element.classList.remove('is-hidden')
    this.element.classList.remove('is-leaving')
    this.element.classList.add('is-ready')
    this.element.classList.add('has-played-intro')
  }

  setEmbedMode(isEmbed: boolean): void {
    this.root.classList.toggle('is-embed', isEmbed)
  }

  private playIntro(): void {
    if (this.hasPlayedIntro) {
      this.element.classList.add('is-ready')
      return
    }

    this.hasPlayedIntro = true
    this.readyTimer = window.setTimeout(() => {
      this.element.classList.add('is-ready')
      this.element.classList.add('has-played-intro')
    }, 2300)
  }

  private createGridCells(): string {
    return Array.from({ length: 15 }, (_, index) => `<span style="--cell-index:${index}"></span>`).join('')
  }
}
