import { Canvas } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import { Stats, PerformanceMonitor } from '@react-three/drei'
import { useState } from 'react'
import './App.css'
import { Scene } from './Scene'
import { ArcadeScene } from './ArcadeScene'
import { SwipeHint } from './components/Hud/SwipeHint'

function App() {
  const { scene, stats } = useControls({
    scene: { options: ['Default', 'Arcade'], value: 'Default' },
    stats: false,
  })
  const [dpr, setDpr] = useState(1.5)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <Leva collapsed={false} />
      {stats && <Stats />}
      <SwipeHint />
      <Canvas
        dpr={dpr}
        gl={{
          powerPreference: 'high-performance',
          antialias: false,
          stencil: false,
          alpha: true,
        }}
      >
        <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
        {scene === 'Default' ? <Scene /> : <ArcadeScene />}
      </Canvas>
    </div>
  )
}

export default App
