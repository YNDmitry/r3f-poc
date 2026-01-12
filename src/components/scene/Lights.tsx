import { motion } from 'framer-motion-3d'
import type { SceneMode } from '../../config/scene-config'

interface LightsProps {
  mode: SceneMode
}

export function Lights({ mode }: LightsProps) {
  const keyLightVariants = {
    grid: { x: 3.5, y: 5.5, z: 6.5 },
    'focus-a': { x: -3.5, y: 5.5, z: 6.5 },
    'focus-b': { x: 3.5, y: 5.5, z: 6.5 }
  }

  const fillLightVariants = {
    grid: { x: -6.5, y: 2.5, z: 4.0 },
    'focus-a': { x: 6.5, y: 2.5, z: 4.0 },
    'focus-b': { x: -6.5, y: 2.5, z: 4.0 }
  }

  const transition = { duration: 0.8, ease: "easeInOut" }

  return (
    <>
      {/* Brighter Ambient to lift shadows */}
      <ambientLight intensity={0.9} />
      
      <motion.directionalLight
        animate={mode}
        variants={keyLightVariants}
        transition={transition}
        intensity={1.8} // Slightly boosted key
        castShadow
        shadow-bias={-0.0001}
      />
      <motion.directionalLight
        animate={mode}
        variants={fillLightVariants}
        transition={transition}
        intensity={1.0} // Boosted fill to see details in dark areas
        color="#bcd7ff"
      />
      <directionalLight
        position={[0.0, 4.0, -6.0]}
        intensity={1.5} // Stronger rim light
      />
    </>
  )
}
