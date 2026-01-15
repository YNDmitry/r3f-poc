import { useState, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Scene } from '../Scene'
import { ArcadeScene } from '../ArcadeScene'
import { PerformanceMonitor, Stats, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { preloadSceneModels } from '../utils/preloadSceneModels'
import { useDevice } from '../hooks/useDevice'

export interface WebflowSceneConfig {
  scene: string
  modelA: string | null
  modelB: string | null
  poster: string | null
}

function SceneInner({ config, setDpr, isArcade }: { 
  config: WebflowSceneConfig, 
  setDpr: (v: number) => void,
  isArcade: boolean
}) {
  const { invalidate } = useThree()
  
  return (
    <>
      <PerformanceMonitor 
        bounds={() => [60, 120]}
        onChange={({ factor }) => {
          const targetDpr = 1 + (Math.min(1.75, window.devicePixelRatio) - 1) * factor
          setDpr(targetDpr)
          invalidate()
        }} 
      />
      <AdaptiveDpr />
      <AdaptiveEvents />

      {isArcade ? (
        <ArcadeScene modelA={config.modelA ?? undefined} modelB={config.modelB ?? undefined} />
      ) : (
        <Scene modelA={config.modelA ?? undefined} modelB={config.modelB ?? undefined} />
      )}
    </>
  )
}

export function SceneMount({ config }: { config: WebflowSceneConfig }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const device = useDevice()
  const [inView, setInView] = useState(false)
  const [dpr, setDpr] = useState(typeof window !== 'undefined' ? window.devicePixelRatio : 1)
  const [debug, setDebug] = useState(false)
  const [mode, setMode] = useState<string>((window as any).jenkaLastMode || 'grid')
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])

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

  const containerClasses = [
    'r3f-canvas-container',
    `mode-${mode}`,
    `is-${device}`,
    isTouch ? 'is-touch' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
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
        className="r3f-canvas-element"
        frameloop={inView ? 'demand' : 'never'}
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
        <SceneInner 
          config={config} 
          setDpr={setDpr} 
          isArcade={isArcade} 
        />
      </Canvas>
      
      {(isTouch || device !== 'desktop') && mode === 'grid' && (
        <div 
          className="scroll-shield"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            touchAction: 'pan-y',
          }} 
        />
      )}
    </div>
  )
}
