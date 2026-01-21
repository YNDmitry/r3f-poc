import { useState, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Scene } from '../Scene'
import { ArcadeScene } from '../ArcadeScene'
import { preloadSceneModels } from '../utils/preloadSceneModels'
import { PerformanceMonitor, Stats, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { useDevice } from '../hooks/useDevice'
import { Glints } from '../features/arcade/Glints'
import { ARCADE_CONSTANTS } from '../config/arcade-config'
import { SceneLoader } from '../components/scene/SceneLoader'
import { SceneWarmup } from '../components/scene/SceneWarmup'
import { SceneInitProvider } from '../components/scene/SceneInitContext'
import './SceneMount.css'

export interface WebflowSceneConfig {
  modelB: string | null
  modelA: string | null
  posterUrl: string | null
  hasPoster: boolean
  scene: string
}

function SceneInner({
  config,
  setDpr,
  isArcade,
  onReady,
}: {
  config: WebflowSceneConfig
  setDpr: (v: number) => void
  isArcade: boolean
  onReady: () => void
  debug: boolean
}) {
  const { invalidate } = useThree()

  const warmupKey = `${config.scene}:${config.modelA ?? ''}:${config.modelB ?? ''}`

  return (
    <SceneInitProvider>
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

      <SceneWarmup resetKey={warmupKey} settleFrames={3} onReady={onReady} />

      {isArcade ? (
        <ArcadeScene modelA={config.modelA ?? undefined} modelB={config.modelB ?? undefined} />
      ) : (
        <Scene modelA={config.modelA ?? undefined} modelB={config.modelB ?? undefined} />
      )}
    </SceneInitProvider>
  )
}

export function SceneMount({ config }: { config: WebflowSceneConfig }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLDivElement>(null)
  const device = useDevice()

  const [inView, setInView] = useState(false)
  const [dpr, setDpr] = useState(typeof window !== 'undefined' ? window.devicePixelRatio : 1)
  const [debug, setDebug] = useState(false)
  const [mode, setMode] = useState<string>((window as any).jenkaLastMode || 'grid')
  const [isTouch, setIsTouch] = useState(false)
  const [isSceneReady, setIsSceneReady] = useState(false)
  const [posterBounds, setPosterBounds] = useState<PosterBounds | null>(null)

  const isArcade = config.scene === 'arcade' || config.scene === 'hero-duo'
  const isMobileOrTablet = device === 'mobile' || device === 'tablet'
  const shouldDisable3D = isArcade && isMobileOrTablet
  const hasPoster = config.hasPoster || Boolean(config.posterUrl)

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
    if (!hasPoster) {
      setPosterBounds(null)
      return
    }
    const container = containerRef.current
    const poster = posterRef.current
    if (!container || !poster) return

    let cancelled = false
    let lastUrl = ''
    let image: HTMLImageElement | null = null

    const getBackgroundInfo = (element: HTMLElement) => {
      const computed = window.getComputedStyle(element)
      const backgroundImage = computed.backgroundImage
      const backgroundColor = computed.backgroundColor
      const hasBackgroundImage = backgroundImage && backgroundImage !== 'none'
      const hasBackgroundColor =
        backgroundColor &&
        backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        backgroundColor !== 'transparent'

      if (!hasBackgroundImage && !hasBackgroundColor) return null

      return {
        backgroundImage,
        backgroundColor,
        backgroundSize: computed.backgroundSize,
        backgroundPosition: computed.backgroundPosition,
        backgroundRepeat: computed.backgroundRepeat,
        backgroundAttachment: computed.backgroundAttachment,
        backgroundBlendMode: computed.backgroundBlendMode,
      }
    }

    const clearBackground = (element: HTMLElement) => {
      element.style.setProperty('background-image', 'none', 'important')
      element.style.setProperty('background-color', 'transparent', 'important')
    }

    const applyBackgroundToPoster = (info: NonNullable<ReturnType<typeof getBackgroundInfo>>) => {
      if (info.backgroundImage && info.backgroundImage !== 'none') {
        poster.style.backgroundImage = info.backgroundImage
        poster.style.backgroundSize = info.backgroundSize
        poster.style.backgroundPosition = info.backgroundPosition
        poster.style.backgroundRepeat = info.backgroundRepeat
        poster.style.backgroundAttachment = info.backgroundAttachment
        poster.style.backgroundBlendMode = info.backgroundBlendMode
      }

      if (info.backgroundColor && info.backgroundColor !== 'transparent') {
        poster.style.backgroundColor = info.backgroundColor
      }
    }

    const ensurePosterBackground = () => {
      if (config.posterUrl) return

      const posterStyle = window.getComputedStyle(poster)
      if (posterStyle.backgroundImage && posterStyle.backgroundImage !== 'none') return
      const host = container.parentElement as HTMLElement | null

      const hostInfo = host ? getBackgroundInfo(host) : null
      if (hostInfo) {
        applyBackgroundToPoster(hostInfo)
        // @ts-ignore
        clearBackground(host)
        return
      }

      const containerInfo = getBackgroundInfo(container)
      if (containerInfo) {
        applyBackgroundToPoster(containerInfo)
        clearBackground(container)
      }
    }

    const loadImage = (url: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const nextImage = new Image()
        nextImage.decoding = 'async'
        nextImage.onload = () => resolve(nextImage)
        nextImage.onerror = () => resolve(null)
        nextImage.src = url
      })

    const syncPosterBounds = async () => {
      ensurePosterBackground()

      if (!shouldDisable3D) {
        setPosterBounds(null)
        return
      }

      const posterStyle = window.getComputedStyle(poster)
      const backgroundImage = posterStyle.backgroundImage
      const url = extractBackgroundImageUrl(backgroundImage)
      if (!url) {
        setPosterBounds(null)
        return
      }

      if (url !== lastUrl) {
        lastUrl = url
        image = await loadImage(url)
      }

      if (!image || cancelled) return

      const rect = container.getBoundingClientRect()
      const containerSize = { width: rect.width, height: rect.height }
      const imageSize = { width: image.naturalWidth, height: image.naturalHeight }
      if (!imageSize.width || !imageSize.height) return

      const backgroundSize = posterStyle.backgroundSize.split(',')[0].trim()
      const backgroundPosition = posterStyle.backgroundPosition.split(',')[0].trim()
      const renderedSize = resolveBackgroundSize(backgroundSize, containerSize, imageSize)
      const offset = resolveBackgroundPosition(backgroundPosition, containerSize, renderedSize)

      setPosterBounds({
        width: renderedSize.width,
        height: renderedSize.height,
        left: offset.left,
        top: offset.top,
      })
    }

    syncPosterBounds()

    const resizeObserver = new ResizeObserver(() => {
      syncPosterBounds()
    })
    resizeObserver.observe(container)

    return () => {
      cancelled = true
      resizeObserver.disconnect()
    }
  }, [hasPoster, config.posterUrl, shouldDisable3D])

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

  useEffect(() => {
    if (shouldDisable3D) return
    setIsSceneReady(false)
  }, [config.scene, config.modelA, config.modelB, shouldDisable3D])

  const arcadeStagePos = [0, -1.1, -0.5] as [number, number, number]
  const posterGlints =
    ARCADE_CONSTANTS.posterGlints[device] || ARCADE_CONSTANTS.posterGlints.desktop
  const posterGlintModels = posterGlints.models ?? (['modelA', 'modelB'] as const)
  const glintsPositions =
    posterGlints.positions && posterGlints.positions.length
      ? posterGlints.positions
      : posterGlintModels.flatMap((key) => ARCADE_CONSTANTS.glints[key])
  const glintsOffset = posterGlints.offset
  const glintsScale = posterGlints.scale
  const glintsStagePos = [
    arcadeStagePos[0] + glintsOffset[0],
    arcadeStagePos[1] + glintsOffset[1],
    arcadeStagePos[2] + glintsOffset[2],
  ] as [number, number, number]
  const glintsPoseKey = posterGlints.pose ?? 'front'
  const posterGlintsPose =
    // @ts-ignore
    glintsPoseKey === 'none'
      ? null
      : ARCADE_CONSTANTS.states[glintsPoseKey]?.[device] ||
        ARCADE_CONSTANTS.states[glintsPoseKey]?.desktop ||
        ARCADE_CONSTANTS.states.front.desktop

  const containerClasses = [
    'r3f-canvas-container',
    `mode-${mode}`,
    `is-${device}`,
    isTouch ? 'is-touch' : '',
    isSceneReady ? 'is-ready' : 'is-loading',
    shouldDisable3D ? 'is-mobile-arcade' : '',
    hasPoster ? 'has-poster' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={containerRef} className={containerClasses}>
      {import.meta.env.DEV && <Stats />}

      {hasPoster && (
        <div
          ref={posterRef}
          className={config.posterUrl ? 'scene-poster scene-poster--auto' : 'scene-poster'}
          style={config.posterUrl ? { backgroundImage: `url("${config.posterUrl}")` } : undefined}
        />
      )}

      <SceneLoader enabled={!shouldDisable3D && !isArcade && !hasPoster} isReady={isSceneReady} />

      {shouldDisable3D && (
        <div className="canvas-box">
          <div
            className="canvas-box_inner"
            style={
              posterBounds
                ? {
                    width: posterBounds.width,
                    height: posterBounds.height,
                    left: posterBounds.left,
                    top: posterBounds.top,
                  }
                : undefined
            }
          >
            <Canvas
              gl={{ alpha: true }}
              className="canvas-box_canvas"
              camera={{ position: [0, 0, 4.4], fov: 35 }}
            >
              <group position={glintsStagePos} scale={glintsScale}>
                {posterGlintsPose ? (
                  <group
                    position={posterGlintsPose.pos}
                    rotation={posterGlintsPose.rot}
                    scale={posterGlintsPose.scale}
                  >
                    <Glints positions={glintsPositions} uniformScale={1} />
                  </group>
                ) : (
                  <Glints positions={glintsPositions} uniformScale={1} />
                )}
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
            onReady={() => setIsSceneReady(true)}
            debug={debug}
          />
        </Canvas>
      )}
    </div>
  )
}

type Size = { width: number; height: number }

type PosterBounds = {
  width: number
  height: number
  left: number
  top: number
}

function extractBackgroundImageUrl(value: string): string | null {
  if (!value || value === 'none') return null
  const match = /url\(["']?(.+?)["']?\)/.exec(value)
  return match?.[1] ?? null
}

function parseLength(value: string, total: number): number | null {
  if (!value || value === 'auto') return null
  const normalized = value.trim().toLowerCase()
  if (normalized.endsWith('%')) {
    const percent = Number.parseFloat(normalized)
    if (Number.isNaN(percent)) return null
    return (percent / 100) * total
  }
  if (normalized.endsWith('px')) {
    const px = Number.parseFloat(normalized)
    return Number.isNaN(px) ? null : px
  }

  const match = /^(-?\d*\.?\d+)([a-z]*)$/.exec(normalized)
  if (!match) return null
  const amount = Number.parseFloat(match[1])
  const unit = match[2]
  if (Number.isNaN(amount)) return null

  if (unit === 'rem' || unit === 'em') {
    const rootSize =
      typeof window !== 'undefined'
        ? Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize || '16')
        : 16
    return amount * (Number.isNaN(rootSize) ? 16 : rootSize)
  }

  if (unit === 'vw') {
    if (typeof window === 'undefined') return (amount / 100) * total
    return (amount / 100) * window.innerWidth
  }

  if (unit === 'vh') {
    if (typeof window === 'undefined') return (amount / 100) * total
    return (amount / 100) * window.innerHeight
  }

  if (!unit) return amount
  return null
}

function resolveBackgroundSize(value: string, container: Size, image: Size): Size {
  const normalized = value.toLowerCase()
  if (normalized === 'cover' || normalized === 'contain') {
    const scale =
      normalized === 'cover'
        ? Math.max(container.width / image.width, container.height / image.height)
        : Math.min(container.width / image.width, container.height / image.height)
    return { width: image.width * scale, height: image.height * scale }
  }

  const parts = normalized.split(/\s+/).filter(Boolean)
  const widthToken = parts[0] ?? 'auto'
  const heightToken = parts[1] ?? 'auto'
  const width = parseLength(widthToken, container.width)
  const height = parseLength(heightToken, container.height)

  if (width !== null && height !== null) return { width, height }
  if (width !== null && height === null) {
    return { width, height: (width * image.height) / image.width }
  }
  if (height !== null && width === null) {
    return { width: (height * image.width) / image.height, height }
  }
  return { width: image.width, height: image.height }
}

function resolveBackgroundPosition(value: string, container: Size, image: Size) {
  const parts = value.toLowerCase().split(/\s+/).filter(Boolean)
  const xToken = parts[0] ?? '50%'
  const yToken = parts[1] ?? '50%'
  const remainingX = container.width - image.width
  const remainingY = container.height - image.height

  return {
    left: resolvePositionToken(xToken, remainingX),
    top: resolvePositionToken(yToken, remainingY),
  }
}

function resolvePositionToken(token: string, remaining: number): number {
  if (token === 'left' || token === 'top') return 0
  if (token === 'center') return remaining / 2
  if (token === 'right' || token === 'bottom') return remaining

  const parsed = parseLength(token, remaining)
  if (parsed === null) return remaining / 2
  return parsed
}
