export const CONSTANTS = {
  layout: {
    baseFov: 35,
    cameraZ: {
      desktop: 4.4,
      tablet: 4.4,
      mobile: 8,
    },
    stagePos: {
      desktop: [0, -0.9, 0] as [number, number, number],
      tablet: [0, -0.8, 0] as [number, number, number],
      mobile: [0, -0.3, 0] as [number, number, number],
    },
  },
  grid: {
    a: {
      desktop: { pos: [-0.6, 0, 0], scale: 1.0, rot: [0, -0.6, 0] },
      tablet: { pos: [-0.5, 0, 0], scale: 0.9, rot: [0, -0.6, 0] },
      mobile: { pos: [-0.5, 0, 0], scale: 1.0, rot: [0, -0.6, 0] },
    },
    b: {
      desktop: { pos: [0.6, 0, 0], scale: 1.0, rot: [0, 0.6, 0] },
      tablet: { pos: [0.5, 0, 0], scale: 0.9, rot: [0, 0.6, 0] },
      mobile: { pos: [0.5, 0, 0], scale: 1.0, rot: [0, 0.6, 0] },
    },
  },
  focus: {
    desktop: {
      target: {
        pos: [0, 0, 0] as [number, number, number],
        scale: 1,
        rot: [0, 0, 0] as [number, number, number],
      },
      background: {
        pos: [0, 0, -1] as [number, number, number],
        scale: 0.8,
        rot: [0, 0, 0] as [number, number, number],
      },
    },
    tablet: {
      target: {
        pos: [0, -0, 0] as [number, number, number],
        scale: 1,
        rot: [0, 0, 0] as [number, number, number],
      },
      background: {
        pos: [0, 0, -1] as [number, number, number],
        scale: 0.7,
        rot: [0, 0, 0] as [number, number, number],
      },
    },
    mobile: {
      target: {
        pos: [0, -1, 0] as [number, number, number],
        scale: 1.5,
        rot: [0, 0, 0] as [number, number, number],
      },
      background: {
        pos: [0, 0, -1.5] as [number, number, number],
        scale: 0.6,
        rot: [0, 0, 0] as [number, number, number],
      },
    },
  },
  customHotspots: {
    a: [
      { id: 'a1', label: 'Right Speaker', position: [0.2, 1.68, -0.1] },
      { id: 'a2', label: 'Left Speaker', position: [-0.2, 1.68, -0.1] },
      { id: 'a3', label: 'FullHD touch display', position: [0, 1.4, -0.1] },
      { id: 'a4', label: 'Bill validator', position: [-0, 0.55, 0.2] },
      { id: 'a5', label: 'Scanner', position: [0.19, 0.72, 0.2] },
      { id: 'a6', label: 'LED push button', position: [0.22, 0.91, 0.16] },
      { id: 'a7', label: 'LED push button', position: [-0.22, 0.91, 0.16] },
      { id: 'a8', label: 'Joystick', position: [0.01, 0.94, 0.16] },
    ],
    b: [
      { id: 'b1', label: 'Joystick', position: [0, 0.94, 0.18] },
      { id: 'b2', label: 'LED push button', position: [0.15, 0.91, 0.18] },
      { id: 'b3', label: 'LED push button', position: [-0.15, 0.91, 0.18] },
      { id: 'b4', label: 'Bill validator', position: [0.1, 1.05, 0.1] },
      { id: 'b5', label: 'Scanner', position: [0.2, 1.05, 0.1] },
      { id: 'b6', label: 'FullHD touch display', position: [0, 1.5, 0.15] },
      { id: 'b7', label: 'Right Speaker', position: [0.2, 1.78, 0.15] },
      { id: 'b8', label: 'Left Speaker', position: [-0.2, 1.78, 0.15] },
    ],
  },
  glints: {
    a: [
      [0.2, 1.68, -0.1],
      [-0.2, 1.68, -0.1],
      [0.22, 0.91, 0.16],
      [0.01, 0.94, 0.16],
    ] as [number, number, number][],
    b: [
      [0, 0.94, 0.18],
      [0.15, 0.91, 0.18],
      [-0.15, 0.91, 0.18],
      [0, 1.5, 0.15],
    ] as [number, number, number][],
  },
} as const

export type SceneMode = 'grid' | 'focus-a' | 'focus-b'
export type ProductType = 'a' | 'b'

export interface TransformData {
  pos: readonly number[]
  scale: number
  rot: readonly number[]
}

export interface HotspotItem {
  readonly id: string
  readonly label: string
  readonly position: readonly [number, number, number]
}
