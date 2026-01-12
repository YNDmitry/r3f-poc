export const ARCADE_CONSTANTS = {
  layout: {
    camPos: [0, 0, 4.4] as [number, number, number],
    lookAt: [0, 0, 0] as [number, number, number],
    stagePos: {
      desktop: [0.3, -1.1, -0.5] as [number, number, number],
      tablet: [0, -1.1, -0.5] as [number, number, number],
      mobile: [0, -1.1, -0.5] as [number, number, number],
    },
    fov: 35,
  },
  states: {
    front: {
      desktop: {
        pos: [0.2, 0, 0.4] as [number, number, number],
        rot: [0.4, -0.5, -0.03] as [number, number, number],
        scale: 1,
      },
      tablet: { pos: [0.2, 0, 0.4] as [number, number, number], rot: [0.4, -0.5, 0] as [number, number, number], scale: 1 },
      mobile: { pos: [0.2, 0, 0.4] as [number, number, number], rot: [0.4, -0.5, 0] as [number, number, number], scale: 1 },
    },
    back: {
      desktop: {
        pos: [-0.15, 0.35, -0.8] as [number, number, number],
        rot: [0, 0.6, 0.3] as [number, number, number],
        scale: 0.9,
      },
      tablet: {
        pos: [0, 0.5, -1.0] as [number, number, number],
        rot: [0, 0.6, 0.3] as [number, number, number],
        scale: 0.9,
      },
      mobile: {
        pos: [-0.15, 0.5, -1.0] as [number, number, number],
        rot: [0, 0.6, 0.3] as [number, number, number],
        scale: 0.9,
      },
    },
  },
  animation: {
    rotRange: 0.8,
    swapDuration: 1.2, // Kept smoother duration as requested
  },
} as const

export type ArcadeState = 'front' | 'back'
