import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion-3d'
import { useSpring, useTransform } from 'framer-motion'
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
  const [isAnimating, setIsAnimating] = useState(false)
  const parallaxGroup = useRef<THREE.Group>(null!)

  const mouse = useRef({ x: 0, y: 0 })
  const frontCfg = states.front[device] || states.front.desktop
  const backCfg = states.back[device] || states.back.desktop

  const isFront = state === 'front'

  const progress = useSpring(isFront ? 1 : 0, {
    stiffness: 65,
    damping: 26,
    mass: 1.2
  })

  // IMPORTANT: Wake up the engine and start the spring animation
  useEffect(() => {
    progress.set(isFront ? 1 : 0)
    invalidate() // Force first frame to start useFrame loop
  }, [isFront, progress, invalidate])

  const posX = useTransform(progress, [0, 0.5, 1], [backCfg.pos[0], -0.7, frontCfg.pos[0]])
  const posZ = useTransform(progress, [0, 0.5, 1], [backCfg.pos[2], 0.2, frontCfg.pos[2]])
  const altPosX = useTransform(progress, [0, 0.5, 1], [backCfg.pos[0], 0.7, frontCfg.pos[0]])
  const altPosZ = useTransform(progress, [0, 0.5, 1], [backCfg.pos[2], -0.6, frontCfg.pos[2]])

  const finalPosX = isFront ? posX : altPosX
  const finalPosZ = isFront ? posZ : altPosZ

  const posY = useTransform(progress, [0, 0.5, 1], [backCfg.pos[1], backCfg.pos[1] + 0.08, frontCfg.pos[1]])
  const rotX = useTransform(progress, [0, 1], [backCfg.rot[0], frontCfg.rot[0]])
  const rotY = useTransform(progress, [0, 1], [backCfg.rot[1], frontCfg.rot[1]])
  const rotZ = useTransform(progress, [0, 1], [backCfg.rot[2], frontCfg.rot[2]])
  const scaleValue = useTransform(progress, [0, 1], [backCfg.scale, frontCfg.scale])

  const tiltZ = useTransform(
    progress,
    [0, 0.2, 0.5, 0.8, 1],
    [0, isFront ? -0.06 : 0.06, isFront ? -0.08 : 0.08, isFront ? -0.06 : 0.06, 0]
  )

  useFrame((state) => {
    const targetX = state.pointer.x
    const targetY = state.pointer.y
    mouse.current.x += (targetX - mouse.current.x) * 0.1
    mouse.current.y += (targetY - mouse.current.y) * 0.1

    if (parallaxGroup.current) {
      parallaxGroup.current.rotation.x = -mouse.current.y * 0.05
      parallaxGroup.current.rotation.y = mouse.current.x * 0.05
    }

    const velocity = progress.getVelocity()
    const isMoving = Math.abs(velocity) > 0.001 // Lower threshold for better sensitivity
    
    if (isMoving !== isAnimating) {
        setIsAnimating(isMoving)
    }

    // Keep invalidating as long as the spring is moving or mouse is active
    if (isMoving || Math.abs(targetX - mouse.current.x) > 0.001) {
      invalidate()
    }
  })

  return (
    <motion.group
      position-x={finalPosX}
      position-y={posY}
      position-z={finalPosZ}
      rotation-x={rotX}
      rotation-y={rotY}
      rotation-z={rotZ}
      scale={scaleValue}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (isAnimating) return
        
        if (state === 'back') {
          onClick(e)
          trigger('From canvas')
        } else {
          trigger('From canvas')
        }
      }}
      onPointerOver={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (isAnimating) return
        setHovered(true)
        if (state === 'back' && device === 'desktop') document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onPointerMove={() => invalidate()}
    >
      <motion.group rotation-z={tiltZ}>
        <group ref={parallaxGroup}>
          <motion.group
            animate={{
              y: hovered && state === 'back' ? 0.08 : 0,
              scale: hovered && state === 'back' ? 1.025 : 1,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onUpdate={() => invalidate()}
          >
            <ProductModel
              url={url}
              withGlints={state === 'front'}
              glintsVisible={!isAnimating}
              glintPositions={glintPositions}
            />
          </motion.group>
        </group>
      </motion.group>
    </motion.group>
  )
}
