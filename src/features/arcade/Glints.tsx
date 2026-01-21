import { useMemo, useEffect, useState } from 'react'
import { Html } from '@react-three/drei'
import './Glints.css'

interface GlintsProps {
  positions?: [number, number, number][]
  visible?: boolean
  uniformScale?: number
}

// Seeded randomness keeps glint timing stable across rerenders.
const hashString = (value: string) => {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const seededRandom = (seed: number) => {
  let t = seed + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function Glints({ positions = [], visible = true, uniformScale }: GlintsProps) {
  // Initialize state immediately to avoid first-render jump
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 991
    }
    return false
  })

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 991
      setIsMobile(mobile)
    }

    // Extra check after mount to handle some mobile browser delays
    checkMobile()

    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const glints = useMemo(() => {
    return positions.map((pos, i) => {
      const seed = hashString(`${pos[0]}:${pos[1]}:${pos[2]}:${i}`)
      return {
        id: `${i}-${seed}`,
        pos,
        delay: seededRandom(seed) * 2,
        duration: 1.5 + seededRandom(seed + 1) * 1.5,
        scale: uniformScale ?? 0.6 + seededRandom(seed + 2) * 0.4,
      }
    })
  }, [positions, uniformScale])

  const baseSize = isMobile ? '4rem' : '8rem'

  return (
    <group>
      {glints.map((glint) => (
        <Html
          key={glint.id}
          position={glint.pos}
          center
          distanceFactor={1.2}
          pointerEvents="none"
          zIndexRange={[0, 0]}
        >
          <div className={visible ? 'glint-wrapper' : 'glint-wrapper glint-wrapper--hidden'}>
            <div
              className="glint-container"
              style={
                {
                  '--glint-delay': `${glint.delay}s`,
                  '--glint-duration': `${glint.duration}s`,
                  '--glint-scale': glint.scale,
                  width: baseSize,
                  height: baseSize,
                } as any
              }
            >
              <svg viewBox="0 0 256 256" className="glint-svg">
                <defs>
                  <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="white" stopOpacity="1" />
                    <stop offset="20%" stopColor="white" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="beamGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="white" stopOpacity="1" />
                    <stop offset="10%" stopColor="white" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="128" cy="128" r="60" fill="url(#glowGradient)" />
                <ellipse cx="128" cy="128" rx="110" ry="3" fill="url(#beamGradient)" />
                <ellipse cx="128" cy="128" rx="3" ry="110" fill="url(#beamGradient)" />
                <circle cx="128" cy="128" r="4" fill="white" />
              </svg>
            </div>
          </div>
        </Html>
      ))}
    </group>
  )
}
