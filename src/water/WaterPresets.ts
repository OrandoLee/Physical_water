export type WaterPresetId = 'clear' | 'lagoon' | 'deep' | 'murky' | 'dense'

export interface WaterPreset {
  id: WaterPresetId
  label: string
  shallowColor: number
  deepColor: number
  volumeColor: number
  fogColor: number
  density: number
  opacity: number
  damping: number
  propagation: number
  idleWave: number
  maxHeight: number
}

export const WATER_PRESETS: WaterPreset[] = [
  {
    id: 'clear',
    label: '清澈实验水',
    shallowColor: 0x72f6ff,
    deepColor: 0x087da1,
    volumeColor: 0x0c9dc4,
    fogColor: 0x071018,
    density: 1,
    opacity: 0.62,
    damping: 0.957,
    propagation: 0.43,
    idleWave: 0.006,
    maxHeight: 0.21,
  },
  {
    id: 'lagoon',
    label: '浅海蓝绿',
    shallowColor: 0x92ffe7,
    deepColor: 0x0c7d73,
    volumeColor: 0x12b0a3,
    fogColor: 0x071816,
    density: 1.03,
    opacity: 0.68,
    damping: 0.948,
    propagation: 0.46,
    idleWave: 0.009,
    maxHeight: 0.24,
  },
  {
    id: 'deep',
    label: '深水高折射',
    shallowColor: 0x51d9ff,
    deepColor: 0x07355f,
    volumeColor: 0x074b77,
    fogColor: 0x050b12,
    density: 1.08,
    opacity: 0.76,
    damping: 0.963,
    propagation: 0.4,
    idleWave: 0.005,
    maxHeight: 0.18,
  },
  {
    id: 'murky',
    label: '浑浊高密度',
    shallowColor: 0x9dd3bd,
    deepColor: 0x385c54,
    volumeColor: 0x536f62,
    fogColor: 0x0b1210,
    density: 1.18,
    opacity: 0.82,
    damping: 0.938,
    propagation: 0.36,
    idleWave: 0.004,
    maxHeight: 0.16,
  },
  {
    id: 'dense',
    label: '盐水强浮力',
    shallowColor: 0xb8f8ff,
    deepColor: 0x397eb0,
    volumeColor: 0x5baacc,
    fogColor: 0x08121a,
    density: 1.28,
    opacity: 0.72,
    damping: 0.966,
    propagation: 0.38,
    idleWave: 0.0035,
    maxHeight: 0.15,
  },
]

export function getWaterPreset(id: WaterPresetId): WaterPreset {
  return WATER_PRESETS.find((preset) => preset.id === id) ?? WATER_PRESETS[0]
}
