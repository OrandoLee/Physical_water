export interface MetricsSnapshot {
  waterLevel: number
  waveEnergy: number
  maxWave: number
  objectCount: number
  overflowDepth: number
  presetLabel: string
  density: number
}

export class MetricsPanel {
  public readonly element: HTMLElement

  private readonly values = new Map<string, HTMLElement>()

  constructor(root: HTMLElement, isEmbed: boolean) {
    this.element = document.createElement('section')
    this.element.className = 'metrics-panel'
    this.element.innerHTML = `
      <div class="panel-title">实时水体指标</div>
      <div class="metrics-grid">
        ${this.metric('level', '水面高度')}
        ${this.metric('wave', '波动能量')}
        ${this.metric('crest', '最大浪高')}
        ${this.metric('density', '水体密度')}
        ${this.metric('objects', '物体数量')}
        ${this.metric('overflow', '溢流深度')}
      </div>
      <div class="metrics-preset" data-key="preset">清澈实验水</div>
    `
    this.element.classList.toggle('is-embed', isEmbed)
    root.appendChild(this.element)

    this.element.querySelectorAll<HTMLElement>('[data-key]').forEach((node) => {
      this.values.set(node.dataset.key ?? '', node)
    })
  }

  update(snapshot: MetricsSnapshot): void {
    this.set('level', `${snapshot.waterLevel.toFixed(2)} m`)
    this.set('wave', snapshot.waveEnergy.toFixed(3))
    this.set('crest', `${snapshot.maxWave.toFixed(2)} m`)
    this.set('density', `${snapshot.density.toFixed(2)}x`)
    this.set('objects', `${snapshot.objectCount}`)
    this.set('overflow', `${snapshot.overflowDepth.toFixed(2)} m`)
    this.set('preset', snapshot.presetLabel)
  }

  private metric(key: string, label: string): string {
    return `
      <span>${label}</span>
      <b data-key="${key}">--</b>
    `
  }

  private set(key: string, value: string): void {
    const node = this.values.get(key)
    if (node) {
      node.textContent = value
    }
  }
}
