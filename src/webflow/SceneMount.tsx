import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from '../Scene'
import { ArcadeScene } from '../ArcadeScene'
import { useProgress } from '@react-three/drei'

export interface WebflowSceneConfig {
  scene: string
  modelA: string | null
  modelB: string | null
  hdr: string | null
  poster: string | null // <-- New: Placeholder Image URL
  hideSpinner: boolean
  exposure?: number
  bloom?: number
  envIntensity?: number
}

// Helper to track loading state
function Loader({ onLoaded }: { onLoaded: () => void }) {
  const { active, progress } = useProgress()
  
  // When progress hits 100% and not active, we are done
  // Or simply use a useEffect on mount if inside Suspense
  useEffect(() => {
    if (progress === 100) {
       // Small delay to ensure first frame is actually painted
       const t = setTimeout(onLoaded, 100)
       return () => clearTimeout(t)
    }
  }, [progress, onLoaded])
  
  return null
}

export function SceneMount({ config }: { config: WebflowSceneConfig }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      { rootMargin: '200px' }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const isArcade = config.scene === 'arcade' || config.scene === 'hero-duo'

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      
      {/* 1. Placeholder Image (Visible initially) */}
      {config.poster && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${config.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isLoaded ? 0 : 1, // Fade out when loaded
            transition: 'opacity 0.8s ease-out',
            pointerEvents: 'none',
            zIndex: 10
          }} 
        />
      )}

      {/* 2. 3D Canvas (Loads when in view) */}
      {inView && (
        <Canvas
          shadows
          dpr={[1, 1.5]} 
          performance={{ min: 0.5 }}
          gl={{ 
            antialias: false, 
            powerPreference: "high-performance",
            toneMappingExposure: config.exposure ?? 1.0,
            stencil: false, 
            depth: true,
            alpha: true 
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
          }}
        >
          {/* Notify when loaded */}
          <Loader onLoaded={() => setIsLoaded(true)} />

          {isArcade ? (
            <ArcadeScene 
              modelA={config.modelA ?? undefined} 
              modelB={config.modelB ?? undefined}
            />
          ) : (
            <Scene 
              modelA={config.modelA ?? undefined} 
              modelB={config.modelB ?? undefined} 
            />
          )}
        </Canvas>
      )}
    </div>
  )
}
