import { useState, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Scene } from '../Scene'
import { ArcadeScene } from '../ArcadeScene'
import { preloadSceneModels } from '../utils/preloadSceneModels'
import { PerformanceMonitor, Stats, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { useDevice } from '../hooks/useDevice'
import { Glints } from '../features/arcade/Glints'
import { ARCADE_CONSTANTS } from '../config/arcade-config'
import './SceneMount.css'

export interface WebflowSceneConfig {
  modelB: string | null
  modelA: string | null
  poster: string | null
  scene: string
}

function LoadingTrigger({ onLoad }: { onLoad: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onLoad, 800)
    return () => clearTimeout(timer)
  }, [onLoad])
  return null
}

function SceneInner({
  config,
  setDpr,
  isArcade,
  onLoaded,
}: {
  config: WebflowSceneConfig
  setDpr: (v: number) => void
  isArcade: boolean
  onLoaded: () => void
  debug: boolean
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

      <LoadingTrigger onLoad={onLoaded} />

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
  const [isSceneReady, setIsSceneReady] = useState(false)

  const isArcade = config.scene === 'arcade' || config.scene === 'hero-duo'
  const isMobileOrTablet = device === 'mobile' || device === 'tablet'
  const shouldDisable3D = isArcade && isMobileOrTablet

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)
    const checkDebug = () => {
      const isDebug = window.location.hash.includes('debug')
      setDebug(isDebug)
      if (isDebug) {
        const styleId = 'leva-over-webflow'
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style')
          style.id = styleId
          style.innerHTML =
            '#leva__root { z-index: 999999 !important; position: fixed !important; }'
          document.head.appendChild(style)
        }
      }
    }
    checkDebug()
    window.addEventListener('hashchange', checkDebug)
    return () => window.removeEventListener('hashchange', checkDebug)
  }, [])

  useEffect(() => {
    const handleSetMode = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode: string }>
      const newMode = customEvent.detail?.mode
      if (newMode) setMode(newMode)
    }
    window.addEventListener('jenka-set-mode', handleSetMode)
    return () => window.removeEventListener('jenka-set-mode', handleSetMode)
  }, [])

  useEffect(() => {
    if (!shouldDisable3D && config.modelA && config.modelB)
      preloadSceneModels(config.modelA, config.modelB)
  }, [config.modelA, config.modelB, shouldDisable3D])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '200px',
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (shouldDisable3D) setIsSceneReady(true)
  }, [shouldDisable3D])

  const arcadeStagePos = [0, -1.1, -0.5] as [number, number, number]

  const containerClasses = [
    'r3f-canvas-container',
    `mode-${mode}`,
    `is-${device}`,
    isTouch ? 'is-touch' : '',
    isSceneReady ? 'is-ready' : 'is-loading',
    shouldDisable3D ? 'is-mobile-arcade' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={containerRef} className={containerClasses}>
      {import.meta.env.DEV && <Stats />}

      {config.poster && (
        <div className="scene-poster" style={{ backgroundImage: `url("${config.poster}")` }} />
      )}

      {shouldDisable3D && (
        <div className="canvas-box">
          <div className="canvas-box_inner">
            <Canvas
              gl={{ alpha: true }}
              className="canvas-box_canvas"
              camera={{ position: [0, 0, 4.4], fov: 35 }}
            >
              <group position={arcadeStagePos}>
                <Glints
                  positions={[...ARCADE_CONSTANTS.glints.modelA, ...ARCADE_CONSTANTS.glints.modelB]}
                />
              </group>
            </Canvas>
          </div>
        </div>
      )}

      {!shouldDisable3D && (
        <Canvas
          className="r3f-canvas-element"
          frameloop={inView ? 'demand' : 'never'}
          dpr={dpr}
          gl={{
            powerPreference: 'high-performance',
            antialias: false,
            stencil: false,
            alpha: true,
            preserveDrawingBuffer: true,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
          }}
          style={{
            opacity: isSceneReady ? 1 : 0,
            pointerEvents:
              (device === 'tablet' || device === 'mobile') && mode === 'grid' ? 'none' : 'auto',
          }}
        >
          <SceneInner
            config={config}
            setDpr={setDpr}
            isArcade={isArcade}
            onLoaded={() => setIsSceneReady(true)}
            debug={debug}
          />
        </Canvas>
      )}
    </div>
  )
}
