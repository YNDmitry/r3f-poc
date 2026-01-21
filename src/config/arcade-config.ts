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
      tablet: {
        pos: [0.2, 0, 0.4] as [number, number, number],
        rot: [0.4, -0.5, 0] as [number, number, number],
        scale: 1,
      },
      mobile: {
        pos: [0.2, 0, 0.4] as [number, number, number],
        rot: [0.4, -0.5, 0] as [number, number, number],
        scale: 1,
      },
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
  glints: {
    modelA: [
      [0.2, 1.68, -0.1], // Right Speaker
      [-0.2, 1.68, -0.1], // Left Speaker
      [0.22, 0.91, 0.16], // LED Button
      [0.01, 0.94, 0.16], // Joystick
      [0.19, 0.72, 0.2], // Scanner area
    ] as [number, number, number][],
    modelB: [
      [0.15, 0.91, 0.18], // LED Button
      [-0.15, 0.91, 0.18], // LED Button Left
      [0.1, 1.05, 0.1], // Bill Validator
      [0, 1.5, 0.15], // Screen Top
      [0.2, 1.78, 0.15], // Speaker
    ] as [number, number, number][],
  },
  posterGlints: {
    desktop: {
      offset: [0, 0, 0] as [number, number, number],
      scale: 1,
      pose: 'front',
      models: ['modelA', 'modelB'] as const,
      positions: [
        [0, 0.8, 0.18],
        [-0.15, 1.2, 0.18],
        [0.05, 1.22, 0.18],
        [0.25, 1.8, 0.18],
        [0.05, 2.05, 0.2],
        [0.4, 2.05, 0.2],
        [0.3, 1.2, 0.24],
      ] as [number, number, number][],
    },
    tablet: {
      offset: [0, 0, 0] as [number, number, number],
      scale: 1,
      pose: 'front',
      models: ['modelB'] as const,
      positions: [
        [0, 0.8, 0.18],
        [-0.15, 1.2, 0.18],
        [0.05, 1.22, 0.18],
        [0.25, 1.8, 0.18],
        [0.05, 2.05, 0.2],
        [0.4, 2.05, 0.2],
        [0.3, 1.2, 0.24],
      ] as [number, number, number][],
    },
    mobile: {
      offset: [0, 0, 0] as [number, number, number],
      scale: 1,
      pose: 'front',
      models: ['modelB'] as const,
      positions: [
        [0, 0.8, 0.18],
        [-0.15, 1.2, 0.18],
        [0.05, 1.22, 0.18],
        [0.25, 1.8, 0.18],
        [0.05, 2.05, 0.2],
        [0.4, 2.05, 0.2],
        [0.3, 1.2, 0.24],
      ] as [number, number, number][],
    },
  },
} as const

export type ArcadeState = 'front' | 'back'
