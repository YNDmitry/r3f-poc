import { motion } from 'framer-motion-3d'
import type { SceneMode } from '../../config/scene-config'

interface LightsProps {
  mode: SceneMode
}

export function Lights({ mode }: LightsProps) {
  const keyLightVariants = {
    grid: { x: 3.5, y: 5.5, z: 6.5 },
    'focus-a': { x: -3.5, y: 5.5, z: 6.5 },
    'focus-b': { x: 3.5, y: 5.5, z: 6.5 },
  }

  const fillLightVariants = {
    grid: { x: -6.5, y: 2.5, z: 4.0 },
    'focus-a': { x: 6.5, y: 2.5, z: 4.0 },
    'focus-b': { x: -6.5, y: 2.5, z: 4.0 },
  }

  const transition = { duration: 0.8, ease: 'easeInOut' }

  return (
    <>
      {/*
        Fake-AO strategy:
        1. Low ambient light -> Darker shadows in crevices
        2. Strong Rim light -> Separates object from background (Premium feel)
        3. Colored Fill -> Adds richness to shadows
      */}
      <ambientLight intensity={0.4} />

      {/* Key Light (Warm/Neutral) */}
      <motion.directionalLight
        animate={mode}
        variants={keyLightVariants}
        transition={transition}
        intensity={1}
        shadow-bias={-0.0001}
      />

      {/* Fill Light (Cool blueish to contrast warm key) */}
      <motion.directionalLight
        animate={mode}
        variants={fillLightVariants}
        transition={transition}
        intensity={0.3}
        color="#b0c7ff"
      />

      {/* Rim Light (Strong back-light for silhouette) */}
      {/*<directionalLight position={[0.0, 5.0, -5.0]} intensity={3.0} color="#ffffff" />*/}

      {/* Bottom Uplight (Bounce simulation) */}
      <directionalLight position={[0.0, -5.0, 2.0]} intensity={0.5} color="#e0e0ff" />
    </>
  )
}
