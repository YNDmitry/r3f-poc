import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { animate, useMotionValue } from 'framer-motion'
import * as THREE from 'three'
import type { HotspotItem } from '../config/scene-config'
import { useSceneConfig } from '../config/SceneContext'
import { useDevice } from './useDevice'

export function useCinematicCamera(
  active: boolean,
  controlsRef: React.RefObject<OrbitControlsImpl | null>,
  hoveredId: string | null,
  items: ReadonlyArray<HotspotItem>
) {
  const { camera, invalidate } = useThree()
  const { layout } = useSceneConfig()
  const device = useDevice()

  const transition = useMotionValue(0)

  const stateRef = useRef({
    startPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    startFov: 0,

    endPos: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    endFov: 22,

    basePos: new THREE.Vector3(),
    baseTarget: new THREE.Vector3(),
    baseFov: 0,
    hasBaseState: false,
  })

  // Resolve responsive stage position
  const stagePos = layout.stagePos[device] || layout.stagePos.desktop

  // 1. Handle Trigger Logic
  useEffect(() => {
    if (!active || !controlsRef.current) return

    const controls = controlsRef.current
    const perspCamera = camera as THREE.PerspectiveCamera

    if (!stateRef.current.hasBaseState) {
      stateRef.current.basePos.copy(camera.position)
      stateRef.current.baseTarget.copy(controls.target)
      stateRef.current.baseFov = perspCamera.fov
      stateRef.current.hasBaseState = true
    }

    stateRef.current.startPos.copy(camera.position)
    stateRef.current.startTarget.copy(controls.target)
    stateRef.current.startFov = perspCamera.fov

    if (hoveredId) {
      const item = items.find((i) => i.id === hoveredId)
      if (item) {
        controls.enabled = false

        // Use resolved stagePos
        const stageOffsetX = stagePos[0]
        const stageOffsetY = stagePos[1]
        const stageOffsetZ = stagePos[2]

        const hotspotWorldPos = new THREE.Vector3(
          item.position[0] + stageOffsetX,
          item.position[1] + stageOffsetY,
          item.position[2] + stageOffsetZ
        )

        const machineCenterY = 1.0 + stageOffsetY
        const verticalDelta = hotspotWorldPos.y - machineCenterY

        const headroomOffset = verticalDelta > 0 ? verticalDelta * 0.3 : 0
        const lookAtOffset = verticalDelta * 0.5

        stateRef.current.endTarget.set(
          stageOffsetX,
          hotspotWorldPos.y - lookAtOffset,
          hotspotWorldPos.z
        )

        stateRef.current.endPos.set(
          stageOffsetX,
          hotspotWorldPos.y + headroomOffset,
          hotspotWorldPos.z + 2.4
        )

        stateRef.current.endFov = 22

        transition.set(0)

        animate(transition, 1, {
          duration: 1.5,
          ease: [0.22, 1, 0.36, 1],
          onUpdate: () => invalidate(),
        })
      }
    } else {
      // Re-enable controls immediately when leaving hotspot
      controls.enabled = true

      if (stateRef.current.hasBaseState) {
        stateRef.current.endPos.copy(stateRef.current.basePos)
        stateRef.current.endTarget.copy(stateRef.current.baseTarget)
        stateRef.current.endFov = stateRef.current.baseFov

        transition.set(0)
        animate(transition, 1, {
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
          onUpdate: () => invalidate(),
          onComplete: () => {
            stateRef.current.hasBaseState = false
          },
        })
      }
    }
  }, [hoveredId, active, camera, controlsRef, items, stagePos, transition, invalidate])

  useFrame((state) => {
    if (!active || !controlsRef.current) return

    const t = transition.get()

    const isAnimating = t < 1 && t > 0
    const isHolding = hoveredId !== null

    if (isAnimating || isHolding) {
      const controls = controlsRef.current
      const perspCamera = camera as THREE.PerspectiveCamera

      const swayAmount = isHolding ? 1 : 1 - t
      const swayX = state.pointer.x * 0.3 * swayAmount
      const swayY = state.pointer.y * 0.3 * swayAmount

      const currentEndPosX = stateRef.current.endPos.x + swayX
      const currentEndPosY = stateRef.current.endPos.y + swayY
      const currentEndPosZ = stateRef.current.endPos.z

      camera.position.set(
        THREE.MathUtils.lerp(stateRef.current.startPos.x, currentEndPosX, t),
        THREE.MathUtils.lerp(stateRef.current.startPos.y, currentEndPosY, t),
        THREE.MathUtils.lerp(stateRef.current.startPos.z, currentEndPosZ, t)
      )

      const swayTargetX = swayX * 0.5
      const swayTargetY = swayY * 0.5

      controls.target.set(
        THREE.MathUtils.lerp(
          stateRef.current.startTarget.x,
          stateRef.current.endTarget.x + swayTargetX,
          t
        ),
        THREE.MathUtils.lerp(
          stateRef.current.startTarget.y,
          stateRef.current.endTarget.y + swayTargetY,
          t
        ),
        THREE.MathUtils.lerp(stateRef.current.startTarget.z, stateRef.current.endTarget.z, t)
      )

      // eslint-disable-next-line react-hooks/immutability
      perspCamera.fov = THREE.MathUtils.lerp(stateRef.current.startFov, stateRef.current.endFov, t)
      perspCamera.updateProjectionMatrix()

      controls.update()
    }
  })
}
