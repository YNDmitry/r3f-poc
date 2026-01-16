import { Canvas, useThree } from '@react-three/fiber'
import { Leva, useControls, button } from 'leva'
import { Stats, PerformanceMonitor, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { useState } from 'react'
import './App.css'
import { Scene } from './Scene'
import { ArcadeScene } from './ArcadeScene'
import { SwipeHint } from './components/Hud/SwipeHint'

function Controls() {
  const { gl, scene: threeScene, camera } = useThree()

  useControls({
    scene: { options: ['Default', 'Arcade'], value: 'Default' },
    stats: true,
    '📸 Take Poster': button(() => {
      gl.render(threeScene, camera)
      const link = document.createElement('a')
      link.download = `poster-${Date.now()}.png`
      link.href = gl.domElement.toDataURL('image/png')
      link.click()
    }),
  })

  return null
}

function AppContent() {
  // We need to get the 'scene' and 'stats' values outside of Canvas to toggle components
  // but useControls needs to be inside the Canvas to access R3F state for the button
  // Let's use a simpler approach: two useControls calls.
  // One for UI toggles (outside), one for GL actions (inside).

  const [{ scene }] = useControls(() => ({
    scene: { options: ['Default', 'Arcade'], value: 'Default' },
  }))

  const [dpr, setDpr] = useState(window.devicePixelRatio || 1)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      {import.meta.env.DEV && <Leva collapsed={false} />}
      {import.meta.env.DEV && <Stats />}
      <SwipeHint />
      <Canvas
        frameloop="demand"
        dpr={dpr}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          stencil: false,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
      >
        <Controls />
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
      </Canvas>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
