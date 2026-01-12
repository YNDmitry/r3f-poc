import { useState, useRef } from 'react'
import { motion } from 'framer-motion-3d'
import { useMotionValue } from 'framer-motion'
import { Bvh } from '@react-three/drei'
import { useSceneConfig } from '../../config/SceneConfigContext'
import type { SceneMode, ProductType } from '../../config/scene-config'
import { useWebflow } from '../../hooks/useWebflow'
import { ProductModel } from './ProductModel'
import { Hotspots } from './Hotspots'
import { useDevice } from '../../hooks/useDevice'

interface ProductProps {
  type: ProductType
  mode: SceneMode
  url: string
  controlsRef: any
  onClick: (e: any) => void
  onPointerOver?: (e: any) => void
  onPointerOut?: (e: any) => void
}

export function Product({
  mode,
  type,
  onClick,
  onPointerOver,
  onPointerOut,
  url,
  controlsRef
}: ProductProps) {
  const config = useSceneConfig()
  const { grid, focus } = config
  const { trigger } = useWebflow()
  const device = useDevice() // 'desktop' | 'mobile'
  
  const isA = type === 'a'
  
  // Select config based on device
  // Note: grid[type][device] is correct as per updated type assumption
  const gridCfg = isA ? config.grid[type][device] : config.grid[type][device]
  
  const focusTarget = config.focus[device].target
  const focusBg = config.focus[device].background

  const getTransform = (cfg: any) => ({
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
  const fadeTransition = { duration: 0.4, ease: "easeInOut" }

  // Combined transition object
  const combinedTransition = {
    ...moveTransition,
    opacity: fadeTransition // Override opacity specifically
  }

  const variants = {
    hidden: { 
      scale: 0.8,
      y: -1.0, 
      opacity: 0,
      transition: { duration: 0.0 }
    },
    grid: {
      ...getTransform(gridCfg),
      opacity: 1,
      transition: { 
          ...moveTransition,
          duration: 1.6, 
          // Opacity fades in moderately fast on entry
          opacity: { duration: 0.8, delay: 0.2 } 
      } 
    },
    'focus-a': isA
      ? { 
          ...getTransform(focusTarget), 
          opacity: 1, 
          transition: combinedTransition 
        }
      : { 
          ...getTransform(focusBg), 
          opacity: 0, 
          transition: combinedTransition
        },
    'focus-b': !isA
      ? { 
          ...getTransform(focusTarget), 
          opacity: 1, 
          transition: combinedTransition 
        }
      : { 
          ...getTransform(focusBg), 
          opacity: 0, 
          transition: combinedTransition
        }
  }

  const opacity = useMotionValue(1)
  const [hovered, setHovered] = useState(false)
  const hoverTimeout = useRef<any>(null)

  const handlePointerOver = (e: any) => {
    e.stopPropagation()
    if (mode !== 'grid') return
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current)
      hoverTimeout.current = null
    }
    setHovered(true)
    onPointerOver && onPointerOver(e)
  }

  const handlePointerOut = (e: any) => {
    hoverTimeout.current = setTimeout(() => {
      setHovered(false)
      onPointerOut && onPointerOut(e)
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
      onPointerDown={(e: any) => {
        if (isInteractingWithBackground) return
        e.stopPropagation()
        clickStart.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
      }}
      onPointerUp={(e: any) => {
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
      onUpdate={(latest: any) => {
        if (typeof latest.opacity === 'number') {
          opacity.set(latest.opacity)
        }
      }}
    >
      <motion.group
        animate={{ scale: (mode === 'grid' && hovered) ? 1.05 : 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Bvh firstHitOnly>
           <ProductModel url={url} opacityValue={opacity} />
           <Hotspots type={type} active={isFocused} controlsRef={controlsRef} />
        </Bvh>
      </motion.group>
    </motion.group>
  )
}
