import { Canvas } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import './App.css'
import { Scene } from './Scene'
import { ArcadeScene } from './ArcadeScene'

function App() {
  const { scene } = useControls({
    scene: { options: ['Default', 'Arcade'], value: 'Default' }
  })

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <Leva collapsed={false} />
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMappingExposure: 1.0
        }}
        dpr={[1, 2]} // Match the dpr clamp from the reference code
      >
        {scene === 'Default' ? <Scene /> : <ArcadeScene />}
      </Canvas>
    </div>
  )
}

export default App
