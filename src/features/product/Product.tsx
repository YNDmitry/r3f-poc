import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { type ThreeEvent, useThree } from '@react-three/fiber'
import { type TransformData } from '../../config/scene-config'
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion-3d'
import { useMotionValue } from 'framer-motion'
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
  const { invalidate } = useThree()
  const config = useSceneConfig()
  const { trigger } = useWebflow()
  const device = useDevice()

  const isA = type === 'a'
  const gridCfg = config.grid[type][device]
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

  const moveTransition = { duration: 1.4, ease: [0.16, 1, 0.3, 1] }
  const fadeTransition = { delay: 1.0, duration: 0.15, ease: 'easeInOut' }

  const variants = {
    hidden: {
      scale: 0.9,
      y: -0.2, // Subtle slide instead of big jump
      opacity: 0,
      transition: { duration: 0 },
    },
    grid: {
      ...getTransform(gridCfg),
      opacity: 1,
      transition: {
        ...moveTransition,
        duration: 1.8, // Slightly slower for initial entry
        delay: 0.2,
        opacity: { duration: 1.0, delay: 0.2 }, // Long smooth fade in
      },
    },
    'focus-a': isA
      ? {
          ...getTransform(focusTarget),
          opacity: 1,
          transition: { ...moveTransition, opacity: fadeTransition },
        }
      : {
          ...getTransform(focusBg),
          opacity: 0,
          transition: { ...moveTransition, opacity: fadeTransition },
        },
    'focus-b': !isA
      ? {
          ...getTransform(focusTarget),
          opacity: 1,
          transition: { ...moveTransition, opacity: fadeTransition },
        }
      : {
          ...getTransform(focusBg),
          opacity: 0,
          transition: { ...moveTransition, opacity: fadeTransition },
        },
  }

  const opacity = useMotionValue(0) // Start at 0 for seamless entry
  const [hovered, setHovered] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAnimating = useRef(false)

  useEffect(() => {
    invalidate()
  }, [mode, invalidate])

  const handlePointerOver = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (mode !== 'grid') return
    if (document.body.classList.contains('grabbing')) return
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current)
      hoverTimeout.current = null
    }
    setHovered(true)
    if (onPointerOver) onPointerOver(e)
    invalidate()
  }

  const handlePointerOut = (e: ThreeEvent<MouseEvent>) => {
    hoverTimeout.current = setTimeout(() => {
      setHovered(false)
      if (onPointerOut) onPointerOut(e)
      invalidate()
    }, 60)
  }

  const isFocused = (mode === 'focus-a' && isA) || (mode === 'focus-b' && !isA)
  const clickStart = useRef({ x: 0, y: 0 })

  return (
    <motion.group
      initial="hidden"
      animate={mode}
      variants={variants}
      onAnimationStart={() => {
        isAnimating.current = true
      }}
      onAnimationComplete={() => {
        isAnimating.current = false
      }}
      onPointerDown={(e: ThreeEvent<MouseEvent>) => {
        if ((mode === 'focus-a' && !isA) || (mode === 'focus-b' && isA)) return
        e.stopPropagation()
        clickStart.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
      }}
      onPointerUp={(e: ThreeEvent<MouseEvent>) => {
        if ((mode === 'focus-a' && !isA) || (mode === 'focus-b' && isA)) return
        e.stopPropagation()
        const dx = e.nativeEvent.clientX - clickStart.current.x
        const dy = e.nativeEvent.clientY - clickStart.current.y
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
          onClick(e)
          trigger('From canvas')
        }
      }}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onUpdate={(latest: any) => {
        if (typeof latest.opacity === 'number') {
          opacity.set(latest.opacity)
        }
        if (isAnimating.current) {
          invalidate()
        }
      }}
    >
      <motion.group
        animate={{ scale: mode === 'grid' && hovered ? 1.05 : 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        onUpdate={() => invalidate()}
      >
        <ProductModel url={url} opacityValue={opacity} />
        <Hotspots type={type} active={isFocused} controlsRef={controlsRef} visible={!isRotating} />
      </motion.group>
    </motion.group>
  )
}
