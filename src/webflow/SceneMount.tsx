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
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])

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
      
      {/* 
        Scroll Overlay Shield:
        An absolute transparent div that covers the canvas in grid mode on touch devices.
        It captures no events itself (pointer-events: none is NOT set here, wait...)
        Actually, if we want SCROLL, we want this div to NOT capture pointer events?
        No, if we want native scroll, we want the events to pass through to the DOCUMENT.
        But if the Canvas eats them (even with pointer-events: none?), we are in trouble.
        
        Wait, if pointer-events: none is on Canvas, clicks go to what's behind it.
        Behind it is this container div. If this container div allows scroll, good.
        
        Let's try a different approach:
        If we put a div ON TOP that is `pointer-events: auto` but has `touch-action: pan-y`,
        browsers prioritize scrolling on it.
      */}
      {(isTouch || device !== 'desktop') && mode === 'grid' && (
        <div 
          className="scroll-shield"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            touchAction: 'pan-y', // Allow vertical scroll
            // We do NOT set pointer-events: none here. 
            // We want this div to be the target of the touch.
            // Since it's empty and transparent, and has pan-y, 
            // the browser will scroll.
            // Horizontal swipes might be dead though?
            // If we want horizontal rotation, we can't have a full shield.
            // But user asked to DISABLE events in grid mode.
          }} 
        />
      )}
    </div>
  )
}
