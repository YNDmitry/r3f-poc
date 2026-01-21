import { Canvas } from '@react-three/fiber'
import { useControls } from 'leva'
import { Stats, PerformanceMonitor, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { useEffect, useState } from 'react'
import './App.css'
import { Scene } from './Scene'
import { ArcadeScene } from './ArcadeScene'
import { SwipeHint } from './components/Hud/SwipeHint'
import { SceneLoader } from './components/scene/SceneLoader'
import { SceneWarmup } from './components/scene/SceneWarmup'
import { SceneInitProvider } from './components/scene/SceneInitContext'

function AppContent() {
  // We need to get the 'scene' and 'stats' values outside of Canvas to toggle components
  // but useControls needs to be inside the Canvas to access R3F state for the button
  // Let's use a simpler approach: two useControls calls.
  // One for UI toggles (outside), one for GL actions (inside).

  const [{ scene }] = useControls(() => ({
    scene: { options: ['Default', 'Arcade'], value: 'Default' },
  }))

  const [dpr, setDpr] = useState(window.devicePixelRatio || 1)
  const [isSceneReady, setIsSceneReady] = useState(false)
  const isArcade = scene === 'Arcade'

  useEffect(() => {
    setIsSceneReady(false)
  }, [scene])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111', position: 'relative' }}>
      {import.meta.env.DEV && <Stats />}
      <SwipeHint />
      <SceneLoader enabled={!isArcade} isReady={isSceneReady} />
      <Canvas
        frameloop="demand"
        dpr={dpr}
        gl={{
          powerPreference: 'high-performance',
          antialias: false,
          stencil: false,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
      >
        <SceneInitProvider>
          <SceneWarmup resetKey={scene} settleFrames={3} onReady={() => setIsSceneReady(true)} />
          <PerformanceMonitor
            bounds={() => [60, 120]}
            onChange={({ factor }) => {
              const targetDpr = 1 + (Math.min(2, window.devicePixelRatio) - 1) * factor
              setDpr(targetDpr)
            }}
          />
          <AdaptiveDpr />
          <AdaptiveEvents />
          {scene === 'Default' ? <Scene /> : <ArcadeScene />}
        </SceneInitProvider>
      </Canvas>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
