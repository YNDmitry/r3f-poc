import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from '../Scene'
import { ArcadeScene } from '../ArcadeScene'
import { PerformanceMonitor, Stats } from '@react-three/drei'
import { preloadSceneModels } from '../utils/preloadSceneModels'
import { useDevice } from '../hooks/useDevice'

export interface WebflowSceneConfig {
  scene: string
  modelA: string | null
  modelB: string | null
  poster: string | null
}

export function SceneMount({ config }: { config: WebflowSceneConfig }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const device = useDevice()
  const [inView, setInView] = useState(false)
  const [dpr, setDpr] = useState(2)
  const [debug, setDebug] = useState(false)
  const [mode, setMode] = useState<string>((window as any).jenkaLastMode || 'grid')

  // Listen for mode changes to handle pointer-events
  useEffect(() => {
    const handleSetMode = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode: string }>
      const newMode = customEvent.detail?.mode
      if (newMode) {
        setMode(newMode)
        ;(window as any).jenkaLastMode = newMode
      }
    }
    window.addEventListener('jenka-set-mode', handleSetMode)
    return () => window.removeEventListener('jenka-set-mode', handleSetMode)
  }, [])

  // Preload models immediately when config is available
  useEffect(() => {
    if (config.modelA && config.modelB) {
      preloadSceneModels(config.modelA, config.modelB)
    }
  }, [config.modelA, config.modelB])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('debug')) {
      setDebug(true)
    }
  }, [])

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
      {(import.meta.env.DEV || debug) && <Stats />}

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
            transition: 'opacity 0.8s ease-out',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}

      <Canvas
        style={{
          pointerEvents: device === 'mobile' && mode === 'grid' ? 'none' : 'auto',
        }}
        frameloop={inView ? 'always' : 'never'}
        dpr={dpr}
        gl={{
          powerPreference: 'high-performance',
          antialias: false,
          stencil: false,
          alpha: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
      >
        <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1.5)} />

        {isArcade ? (
          <ArcadeScene modelA={config.modelA ?? undefined} modelB={config.modelB ?? undefined} />
        ) : (
          <Scene modelA={config.modelA ?? undefined} modelB={config.modelB ?? undefined} />
        )}
      </Canvas>
    </div>
  )
}
