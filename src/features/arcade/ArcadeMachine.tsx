import { useState, useRef } from 'react'
import { motion } from 'framer-motion-3d'
import { ARCADE_CONSTANTS } from '../../config/arcade-config'
import { ProductModel } from '../product/ProductModel'
import { useWebflow } from '../../hooks/useWebflow'
import { useDevice } from '../../hooks/useDevice'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

interface ArcadeMachineProps {
  state: 'front' | 'back'
  url: string
  glintPositions?: [number, number, number][]
  onClick: (e: ThreeEvent<MouseEvent>) => void
}

export function ArcadeMachine({ state, url, glintPositions = [], onClick }: ArcadeMachineProps) {
  const { invalidate } = useThree()
  const { states } = ARCADE_CONSTANTS
  const { trigger } = useWebflow()
  const device = useDevice()

  const [hovered, setHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false) // Track animation state
  const parallaxGroup = useRef<THREE.Group>(null!)

  const mouse = useRef({ x: 0, y: 0 })

  const frontCfg = states.front[device] || states.front.desktop
  const backCfg = states.back[device] || states.back.desktop

  useFrame((state) => {
    const targetX = state.pointer.x
    const targetY = state.pointer.y
    mouse.current.x += (targetX - mouse.current.x) * 0.1
    mouse.current.y += (targetY - mouse.current.y) * 0.1

    if (parallaxGroup.current) {
      parallaxGroup.current.rotation.x = -mouse.current.y * 0.05
      parallaxGroup.current.rotation.y = mouse.current.x * 0.05
    }

    if (
      Math.abs(targetX - mouse.current.x) > 0.0001 ||
      Math.abs(targetY - mouse.current.y) > 0.0001
    ) {
      invalidate()
    }
  })

  return (
    <motion.group
      animate={state}
      // Listen to animation lifecycle
      onAnimationStart={() => setIsAnimating(true)}
      onAnimationComplete={() => setIsAnimating(false)}
      variants={{
        front: {
          x: frontCfg.pos[0],
          y: frontCfg.pos[1],
          z: frontCfg.pos[2],
          rotateX: frontCfg.rot[0],
          rotateY: frontCfg.rot[1],
          rotateZ: frontCfg.rot[2],
          scale: frontCfg.scale,
        },
        back: {
          x: backCfg.pos[0],
          y: backCfg.pos[1],
          z: backCfg.pos[2],
          rotateX: backCfg.rot[0],
          rotateY: backCfg.rot[1],
          rotateZ: backCfg.rot[2],
          scale: backCfg.scale,
        },
      }}
      transition={{
        duration: ARCADE_CONSTANTS.animation.swapDuration,
        type: 'spring',
        stiffness: 60,
        damping: 12,
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (state === 'back') {
          onClick(e)
          trigger('From canvas')
        } else {
          trigger('From canvas')
        }
      }}
      onPointerOver={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        setHovered(true)
        if (state === 'back' && device === 'desktop') document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onPointerMove={() => invalidate()}
      onUpdate={() => invalidate()}
    >
      <group ref={parallaxGroup}>
        <motion.group
          animate={{
            y: hovered && state === 'back' ? 0.08 : 0,
            scale: hovered && state === 'back' ? 1.025 : 1,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onUpdate={() => invalidate()}
        >
          {/* Hide glints while animating (swapping) */}
          <ProductModel
            url={url}
            withGlints={state === 'front'}
            glintsVisible={!isAnimating}
            glintPositions={glintPositions}
          />
        </motion.group>
      </group>
    </motion.group>
  )
}
