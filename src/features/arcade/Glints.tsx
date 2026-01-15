import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import './Glints.css'

interface GlintsProps {
  positions?: [number, number, number][]
  visible?: boolean
}

export function Glints({ positions = [], visible = true }: GlintsProps) {
  const glints = useMemo(() => {
    return positions.map((pos, i) => ({
      id: i,
      pos,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 1.5,
      scale: 0.5 + Math.random() * 0.5
    }))
  }, [positions])

  if (!visible) return null

  return (
    <group>
      {glints.map((glint) => (
        <Html
          key={glint.id}
          position={glint.pos}
          center
          distanceFactor={1.2}
          pointerEvents="none"
          // Removed occlusion for now to ensure visibility
          // We can add it back later if everything works
          zIndexRange={[0, 0]}
        >
          <div 
            className="glint-container"
            style={{
              '--glint-delay': `${glint.delay}s`,
              '--glint-duration': `${glint.duration}s`,
              '--glint-scale': glint.scale,
            } as any}
          >
            <svg viewBox="0 0 100 100" className="glint-svg">
              <path 
                d="M50 0 L55 45 L100 50 L55 55 L50 100 L45 55 L0 50 L45 45 Z" 
                fill="white"
              />
            </svg>
          </div>
        </Html>
      ))}
    </group>
  )
}
