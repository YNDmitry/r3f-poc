import { useRef, useEffect, useState, Suspense } from 'react'
import {
  PerspectiveCamera,
  OrbitControls,
  Environment,
  Preload,
  Html,
} from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

import { CONSTANTS } from './config/scene-config'
import type { SceneMode } from './config/scene-config'
import { SceneConfigProvider } from './config/SceneConfigContext'
import { useSceneConfig } from './config/SceneContext'
import type { SceneConfiguration } from './config/SceneContext'
import { Lights } from './components/scene/Lights'
import { Effects } from './components/scene/Effects'
import { Product } from './features/product/Product'
import { useDevice } from './hooks/useDevice'
import { SwipeHint } from './components/Hud/SwipeHint'

interface SceneProps {
  modelA?: string
  modelB?: string
  config?: SceneConfiguration
}

// --- Components ---

function Intro({
  controlsRef,
  cameraZ,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  cameraZ: number
}) {
  useFrame((state) => {
    const time = state.clock.elapsedTime
    if (time < 2.5) {
      const progress = Math.min(time / 2.0, 1)
      const ease = 1 - Math.pow(1 - progress, 3)

      const startZ = cameraZ + 5
      const startY = 2

      state.camera.position.z = THREE.MathUtils.lerp(startZ, cameraZ, ease)
      state.camera.position.y = THREE.MathUtils.lerp(startY, 0, ease)
      state.camera.lookAt(0, 0, 0)

      if (controlsRef.current) {
        controlsRef.current.update()
      }
    }
  })

  return null
}

function Backdrop({ onReset }: { onReset: () => void }) {
  const clickStart = useRef({ x: 0, y: 0 })

  return (
    <group>
      <mesh
        position={[0, 0, -1]}
        visible={false}
        onPointerDown={(e) => {
          clickStart.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
        }}
        onPointerUp={(e) => {
          const dx = e.nativeEvent.clientX - clickStart.current.x
          const dy = e.nativeEvent.clientY - clickStart.current.y
          if (Math.sqrt(dx * dx + dy * dy) < 10) onReset()
        }}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  )
}

function SceneContent({ modelA, modelB }: { modelA: string; modelB: string }) {
  const { layout } = useSceneConfig()
  const device = useDevice()

  const [mode, setMode] = useState<SceneMode>('grid')
  const [isRotating, setIsRotating] = useState(false)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null!)

  // Resolve responsive layout props
  const cameraZ = layout.cameraZ[device] || layout.cameraZ.desktop
  const stagePos = layout.stagePos[device] || layout.stagePos.desktop

  useEffect(() => {
    const handleSetMode = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode: string }>
      const newMode = customEvent.detail?.mode
      if (newMode && (newMode === 'grid' || newMode === 'focus-a' || newMode === 'focus-b')) {
        setMode(newMode as SceneMode)
      }
    }
    window.addEventListener('jenka-set-mode', handleSetMode)
    return () => window.removeEventListener('jenka-set-mode', handleSetMode)
  }, [])

  // Camera Reset Logic (Grid Mode Force Fix)
  useEffect(() => {
    if (mode === 'grid' && controlsRef.current && cameraRef.current) {
      const controls = controlsRef.current
      const camera = cameraRef.current

      controls.enabled = false // FORCE DISABLE

      camera.fov = layout.baseFov
      camera.updateProjectionMatrix()

      camera.position.set(0, 0, cameraZ)
      camera.lookAt(0, 0, 0)

      controls.target.set(0, 0, 0)
      controls.update()
    }
  }, [mode, cameraZ, layout.baseFov])

  useEffect(() => {
    if (mode === 'focus-a' || mode === 'focus-b') {
      const container =
        document.querySelector('[data-tres="scene"]') ||
        document.querySelector('[data-tres="hero-duo"]')
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [mode])

  useFrame(() => {
    if (mode === 'grid' && controlsRef.current && controlsRef.current.enabled) {
      controlsRef.current.enabled = false
    }
  })

  useEffect(() => {
    // Set default cursor for the scene
    const canvas = document.querySelector('canvas')
    if (canvas) canvas.style.cursor = 'grab'

    // Inject styles dynamically to ensure they work even if CSS file isn't loaded
    const style = document.createElement('style')
    style.id = 'r3f-cursor-styles'
    style.innerHTML = `
      .grabbing, .grabbing * { cursor: grabbing !important; }
      canvas:active { cursor: grabbing !important; }
    `
    document.head.appendChild(style)
    
    return () => {
       if (canvas) canvas.style.cursor = 'auto'
       if (document.head.contains(style)) document.head.removeChild(style)
    }
  }, [])

  return (
    <>
      {mode !== 'grid' && (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
          <SwipeHint />
        </Html>
      )}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 2, cameraZ + 5]}
        fov={layout.baseFov}
      />

      <Intro controlsRef={controlsRef} cameraZ={cameraZ} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={mode !== 'grid'}
        enableZoom={false}
        enablePan={false}
        enableDamping={true}
        dampingFactor={0.05}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={-Math.PI / 3}
        maxAzimuthAngle={Math.PI / 3}
        maxDistance={
          device === 'desktop'
            ? layout.cameraZ.desktop
            : device === 'tablet'
              ? layout.cameraZ.tablet
              : layout.cameraZ.mobile
        }
        minDistance={2}
        onStart={() => {
          setIsRotating(true)
          document.body.classList.add('grabbing')
          const canvas = document.querySelector('canvas')
          if (canvas) canvas.style.cursor = 'grabbing'
        }}
        onEnd={() => {
          setIsRotating(false)
          document.body.classList.remove('grabbing')
          const canvas = document.querySelector('canvas')
          if (canvas) canvas.style.cursor = 'grab'
        }}
      />

      <Environment preset="city" blur={1.0} background={false} resolution={256} />

      <Lights mode={mode} />

      <Backdrop onReset={() => setMode('grid')} />

      <group position={stagePos}>
        <Suspense fallback={null}>
          <Product
            type="a"
            mode={mode}
            url={modelA}
            controlsRef={controlsRef}
            isRotating={isRotating}
            onClick={() => setMode((m) => (m === 'focus-a' ? 'grid' : 'focus-a'))}
            onPointerOver={() => {
              if (mode === 'grid') document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => (document.body.style.cursor = 'auto')}
          />

          <Product
            type="b"
            mode={mode}
            url={modelB}
            controlsRef={controlsRef}
            isRotating={isRotating}
            onClick={() => setMode((m) => (m === 'focus-b' ? 'grid' : 'focus-b'))}
            onPointerOver={() => {
              if (mode === 'grid') document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => (document.body.style.cursor = 'auto')}
          />
          <Preload all />
        </Suspense>
      </group>

      <Effects />
    </>
  )
}

export function Scene({
  modelA = '/model-1.glb',
  modelB = '/model-2.glb',
  config = CONSTANTS,
}: SceneProps) {
  return (
    <SceneConfigProvider config={config}>
      <SceneContent modelA={modelA} modelB={modelB} />
    </SceneConfigProvider>
  )
}
