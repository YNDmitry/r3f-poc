import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { type ThreeEvent } from '@react-three/fiber'
import { type TransformData } from '../../config/scene-config'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion-3d'
import { useMotionValue } from 'framer-motion'
import { Bvh } from '@react-three/drei'
import { useSceneConfig } from '../../config/SceneContext'
import type { SceneMode, ProductType } from '../../config/scene-config'
import { useWebflow } from '../../hooks/useWebflow'
import { ProductModel } from './ProductModel'
import { Hotspots } from './Hotspots'
import { useDevice } from '../../hooks/useDevice'

interface ProductProps {
  type: ProductType
  mode: SceneMode
  url: string
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  isRotating?: boolean
  onClick: (e: ThreeEvent<MouseEvent>) => void
  onPointerOver?: (e: ThreeEvent<MouseEvent>) => void
  onPointerOut?: (e: ThreeEvent<MouseEvent>) => void
}

export function Product({
  mode,
  type,
  onClick,
  onPointerOver,
  onPointerOut,
  url,
  controlsRef,
  isRotating = false,
}: ProductProps) {
  const config = useSceneConfig()
  const { trigger } = useWebflow()
  const device = useDevice() // 'desktop' | 'mobile'

  const isA = type === 'a'

  // Select config based on device
  // Note: grid[type][device] is correct as per updated type assumption
  const gridCfg = isA ? config.grid[type][device] : config.grid[type][device]

  const focusTarget = config.focus[device].target
  const focusBg = config.focus[device].background

  const getTransform = (cfg: TransformData) => ({
    x: cfg.pos[0],
    y: cfg.pos[1],
    z: cfg.pos[2],
    rotateX: cfg.rot[0],
    rotateY: cfg.rot[1],
    rotateZ: cfg.rot[2],
    scale: cfg.scale,
  })

  // MOVEMENT Transition (Slow & Luxurious)
  const moveTransition = { duration: 1.4, ease: [0.16, 1, 0.3, 1] }

  // OPACITY Transition (Fast & Snappy to hide artifacts)
  const fadeTransition = { delay: 1.0, duration: 0.15, ease: 'easeInOut' }

  // Combined transition object
  const combinedTransition = {
    ...moveTransition,
    opacity: fadeTransition,
  }

  const variants = {
    hidden: {
      scale: 0.8,
      y: -1.0,
      opacity: 0,
      transition: { duration: 0.0 },
    },
    grid: {
      ...getTransform(gridCfg),
      opacity: 1,
      transition: {
        ...moveTransition,
        duration: 1.6,
        // Add a small initial delay to let the first frame (shader compilation) pass
        // before starting the heavy transform animation.
        delay: 0.1,
        // Opacity fades in moderately fast on entry
        opacity: { duration: 0.1, delay: 0.1 }, // Adjusted delay to sync
      },
    },
    'focus-a': isA
      ? {
          ...getTransform(focusTarget),
          opacity: 1,
          transition: combinedTransition,
        }
      : {
          ...getTransform(focusBg),
          opacity: 0,
          transition: combinedTransition,
        },
    'focus-b': !isA
      ? {
          ...getTransform(focusTarget),
          opacity: 1,
          transition: combinedTransition,
        }
      : {
          ...getTransform(focusBg),
          opacity: 0,
          transition: combinedTransition,
        },
  }

  const opacity = useMotionValue(1)
  const [hovered, setHovered] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePointerOver = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (mode !== 'grid') return
    // Prevent pointer cursor if we are currently rotating (grabbing)
    if (document.body.classList.contains('grabbing')) return
    
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current)
      hoverTimeout.current = null
    }
    setHovered(true)
    if (onPointerOver) onPointerOver(e)
  }

  const handlePointerOut = (e: ThreeEvent<MouseEvent>) => {
    hoverTimeout.current = setTimeout(() => {
      setHovered(false)
      if (onPointerOut) onPointerOut(e)
    }, 60)
  }

  const isInteractingWithBackground = (mode === 'focus-a' && !isA) || (mode === 'focus-b' && isA)
  const isFocused = (mode === 'focus-a' && isA) || (mode === 'focus-b' && !isA)

  const clickStart = useRef({ x: 0, y: 0 })

  return (
    <motion.group
      initial="hidden"
      animate={mode}
      variants={variants}
      onPointerDown={(e: ThreeEvent<MouseEvent>) => {
        if (isInteractingWithBackground) return
        e.stopPropagation()
        clickStart.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
      }}
      onPointerUp={(e: ThreeEvent<MouseEvent>) => {
        if (isInteractingWithBackground) return
        e.stopPropagation()
        const dx = e.nativeEvent.clientX - clickStart.current.x
        const dy = e.nativeEvent.clientY - clickStart.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 10) {
          onClick(e)
          trigger('From canvas')
        }
      }}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onUpdate={(latest: { opacity?: number | string }) => {
        if (typeof latest.opacity === 'number') {
          opacity.set(latest.opacity)
        }
      }}
    >
      <motion.group
        animate={{ scale: mode === 'grid' && hovered ? 1.05 : 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Bvh firstHitOnly>
          <ProductModel url={url} opacityValue={opacity} />
          <Hotspots
            type={type}
            active={isFocused}
            controlsRef={controlsRef}
            visible={!isRotating}
          />
        </Bvh>
      </motion.group>
    </motion.group>
  )
}
