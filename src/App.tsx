import { Canvas, useThree } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import { Stats, PerformanceMonitor, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { useState } from 'react'
import './App.css'
import { Scene } from './Scene'
import { ArcadeScene } from './ArcadeScene'
import { SwipeHint } from './components/Hud/SwipeHint'

function AppContent() {
  const { invalidate } = useThree()
  const { scene, stats } = useControls({
    scene: { options: ['Default', 'Arcade'], value: 'Default' },
    stats: false,
  })
  const [dpr, setDpr] = useState(Math.min(2, window.devicePixelRatio))

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <Leva collapsed={false} />
      {stats && <Stats />}
      <SwipeHint />
      <Canvas
        frameloop="demand"
        dpr={dpr}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          stencil: false,
          alpha: true,
        }}
      >
        <PerformanceMonitor
          onChange={({ factor }) => {
            const targetDpr = 1 + (Math.min(2, window.devicePixelRatio) - 1) * factor
            setDpr(targetDpr)
            invalidate()
          }}
        />
        <AdaptiveDpr pixelated />
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
