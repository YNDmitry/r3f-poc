import { useState, useEffect, useMemo } from 'react'
import { PerspectiveCamera, Environment } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { ARCADE_CONSTANTS } from './config/arcade-config'
import { ArcadeMachine } from './features/arcade/ArcadeMachine'
import { Effects } from './components/scene/Effects'
import { useDevice } from './hooks/useDevice'

interface ArcadeSceneProps {
  modelA?: string
  modelB?: string
}

export function ArcadeScene({
  modelA = '/model-1.glb',
  modelB = '/model-2.glb',
}: ArcadeSceneProps) {
  const [isSwapped, setIsSwapped] = useState(false)
  const device = useDevice()

  const stagePos = useMemo(() => {
    return ARCADE_CONSTANTS.layout.stagePos[device] || ARCADE_CONSTANTS.layout.stagePos.desktop
  }, [device])

  useEffect(() => {
    const handleSetMode = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode: string }>
      const newMode = customEvent.detail?.mode

      if (!newMode) return

      if (newMode === 'focus-a' || newMode === 'set-a') {
        setIsSwapped(false)
      } else if (newMode === 'focus-b' || newMode === 'set-b') {
        setIsSwapped(true)
      }
    }

    window.addEventListener('jenka-set-mode', handleSetMode)
    return () => window.removeEventListener('jenka-set-mode', handleSetMode)
  }, [])

  useFrame((state) => {
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={ARCADE_CONSTANTS.layout.camPos}
        fov={ARCADE_CONSTANTS.layout.fov}
      />

      <Environment preset="city" blur={1.0} background={false} resolution={512} />

      {/* Lighting Boosted */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[3.5, 5.5, 6.5]} intensity={1.8} />
      <directionalLight position={[-6.5, 2.5, 4.0]} intensity={1.0} color="#bcd7ff" />
      <directionalLight position={[0.0, 4.0, -6.0]} intensity={1.5} />

      <group position={stagePos}>
        <ArcadeMachine
          state={!isSwapped ? 'front' : 'back'}
          url={modelA}
          glintPositions={ARCADE_CONSTANTS.glints.modelA}
          onClick={() => {
            if (isSwapped) setIsSwapped(false)
          }}
        />

        <ArcadeMachine
          state={isSwapped ? 'front' : 'back'}
          url={modelB}
          glintPositions={ARCADE_CONSTANTS.glints.modelB}
          onClick={() => {
            if (!isSwapped) setIsSwapped(true)
          }}
        />
      </group>

      <Effects />
    </>
  )
}
