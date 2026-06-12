import { CustomMaterialOptions } from '../objects/ObjectTypes'
import { WATER_PRESETS, WaterPresetId } from '../water/WaterPresets'

export interface DebugPanelHandlers {
  onPresetChange: (id: WaterPresetId) => void
  onRippleScaleChange: (scale: number) => void
  onWireframeChange: (enabled: boolean) => void
  onCustomMaterialChange: (options: CustomMaterialOptions) => void
}

export class DebugPanel {
  public readonly element: HTMLElement

  private readonly customOptions: CustomMaterialOptions = {
    color: 0xff6f4a,
    density: 1.15,
    roughness: 0.42,
    metalness: 0.04,
    transmission: 0,
  }

  constructor(
    root: HTMLElement,
    isEmbed: boolean,
    private readonly handlers: DebugPanelHandlers,
  ) {
    this.element = document.createElement('section')
    this.element.className = 'debug-panel'
    this.element.innerHTML = `
      <button class="debug-toggle" type="button" aria-expanded="false">调试</button>
      <div class="debug-body" hidden>
        <label>
          <span>水体预设</span>
          <select data-control="preset">
            ${WATER_PRESETS.map((preset) => `<option value="${preset.id}">${preset.label}</option>`).join('')}
          </select>
        </label>
        <label>
          <span>波纹倍率</span>
          <input data-control="ripple" type="range" min="0.55" max="1.55" value="1" step="0.05" />
        </label>
        <label class="debug-check">
          <input data-control="wireframe" type="checkbox" />
          <span>水面线框</span>
        </label>
        <div class="debug-subtitle">自定义物体材质</div>
        <label>
          <span>颜色</span>
          <input data-control="custom-color" type="color" value="#ff6f4a" />
        </label>
        <label>
          <span>密度</span>
          <input data-control="custom-density" type="range" min="0.35" max="5.5" value="1.15" step="0.05" />
        </label>
        <label>
          <span>材质</span>
          <select data-control="custom-material">
            <option value="matte">哑光复合</option>
            <option value="metal">金属镜面</option>
            <option value="glass">透明晶体</option>
          </select>
        </label>
      </div>
    `
    this.element.classList.toggle('is-embed', isEmbed)
    root.appendChild(this.element)
    this.bind()
  }

  getCustomMaterialOptions(): CustomMaterialOptions {
    return { ...this.customOptions }
  }

  private bind(): void {
    const toggle = this.element.querySelector<HTMLButtonElement>('.debug-toggle')
    const body = this.element.querySelector<HTMLElement>('.debug-body')
    toggle?.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true'
      toggle.setAttribute('aria-expanded', String(!expanded))
      if (body) {
        body.hidden = expanded
      }
    })

    this.element.querySelector<HTMLSelectElement>('[data-control="preset"]')?.addEventListener('change', (event) => {
      this.handlers.onPresetChange((event.currentTarget as HTMLSelectElement).value as WaterPresetId)
    })

    this.element.querySelector<HTMLInputElement>('[data-control="ripple"]')?.addEventListener('input', (event) => {
      this.handlers.onRippleScaleChange(Number((event.currentTarget as HTMLInputElement).value))
    })

    this.element.querySelector<HTMLInputElement>('[data-control="wireframe"]')?.addEventListener('change', (event) => {
      this.handlers.onWireframeChange((event.currentTarget as HTMLInputElement).checked)
    })

    this.element.querySelector<HTMLInputElement>('[data-control="custom-color"]')?.addEventListener('input', (event) => {
      this.customOptions.color = Number.parseInt((event.currentTarget as HTMLInputElement).value.slice(1), 16)
      this.handlers.onCustomMaterialChange(this.getCustomMaterialOptions())
    })

    this.element.querySelector<HTMLInputElement>('[data-control="custom-density"]')?.addEventListener('input', (event) => {
      this.customOptions.density = Number((event.currentTarget as HTMLInputElement).value)
      this.handlers.onCustomMaterialChange(this.getCustomMaterialOptions())
    })

    this.element.querySelector<HTMLSelectElement>('[data-control="custom-material"]')?.addEventListener('change', (event) => {
      const value = (event.currentTarget as HTMLSelectElement).value
      if (value === 'metal') {
        this.customOptions.metalness = 0.86
        this.customOptions.roughness = 0.18
        this.customOptions.transmission = 0
      } else if (value === 'glass') {
        this.customOptions.metalness = 0
        this.customOptions.roughness = 0.035
        this.customOptions.transmission = 0.72
      } else {
        this.customOptions.metalness = 0.04
        this.customOptions.roughness = 0.42
        this.customOptions.transmission = 0
      }
      this.handlers.onCustomMaterialChange(this.getCustomMaterialOptions())
    })
  }
}
