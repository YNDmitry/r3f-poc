import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useMemo, useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Html, Billboard } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { createStarTexture } from '../../utils/createStarTexture'
import { useSceneConfig } from '../../config/SceneContext'
import type { ProductType, HotspotItem } from '../../config/scene-config'
import { useCinematicCamera } from '../../hooks/useCinematicCamera'
import { Hud } from '../../components/Hud/Hud'
import { motion } from 'framer-motion-3d'
import { useDevice } from '../../hooks/useDevice'

interface HotspotsProps {
  type: ProductType
  active: boolean
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  visible?: boolean
}

const vTargetScale = new THREE.Vector3()

function HotspotItem({
  item,
  texture,
  onHover,
  onLeave,
  globalVisible = true,
}: {
  item: HotspotItem
  texture: THREE.Texture
  onHover: (id: string) => void
  onLeave: () => void
  globalVisible?: boolean
}) {
  const { invalidate } = useThree()
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (!meshRef.current) return

    const targetState = globalVisible ? 1 : 0
    const currentOpacity = (meshRef.current.material as THREE.MeshBasicMaterial).opacity
    const isTransitioning = Math.abs(currentOpacity - targetState) > 0.001 || hovered

    const newBaseOpacity = THREE.MathUtils.lerp(currentOpacity, targetState, 0.1)

    if (globalVisible && !hovered) {
      const time = state.clock.elapsedTime
      const pulseScale = 1.0 + Math.sin(time * 3) * 0.15
      meshRef.current.scale.set(pulseScale, pulseScale, 1)
      ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        (0.8 + Math.sin(time * 2) * 0.2) * newBaseOpacity
    } else if (hovered || !globalVisible) {
      const targetScale = hovered ? 0 : 0
      vTargetScale.set(targetScale, targetScale, 0)
      meshRef.current.scale.lerp(vTargetScale, 0.2)
      ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = newBaseOpacity
    }

    if (isTransitioning) {
      invalidate()
    }
  })

  return (
    <group position={item.position as [number, number, number]}>
      <Billboard>
        <mesh ref={meshRef}>
          <planeGeometry args={[0.15, 0.15]} />
          <meshBasicMaterial
            map={texture}
            transparent
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>

      <mesh
        onPointerOver={(e) => {
          if (!globalVisible) return
          if (document.body.classList.contains('grabbing')) return
          e.stopPropagation()
          setHovered(true)
          onHover(item.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          onLeave()
          document.body.style.cursor = 'auto'
        }}
        visible={false}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial />
      </mesh>

      {hovered && globalVisible && (
        <Html distanceFactor={1} transform={false} style={{ pointerEvents: 'none' }}>
          <Hud item={item} />
        </Html>
      )}
    </group>
  )
}

export function Hotspots({ type, active, controlsRef, visible = true }: HotspotsProps) {
  const { invalidate } = useThree()
  const config = useSceneConfig()
  const items = config.customHotspots[type]
  const device = useDevice()

  const [cameraTargetId, setCameraTargetId] = useState<string | null>(null)

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const starTexture = useMemo(() => createStarTexture(), [])

  useEffect(() => {
    if (!active) {
      setCameraTargetId(null)
    }
  }, [active])

  const showHotspots = active && device === 'desktop'
  const shouldRunCamera = active && device === 'desktop'
  useCinematicCamera(shouldRunCamera, controlsRef, cameraTargetId, items)

  const variants = {
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    hidden: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
  }

  return (
    <motion.group
      initial="visible"
      animate={showHotspots && visible ? 'visible' : 'hidden'}
      variants={variants}
      onUpdate={() => invalidate()}
      visible={true}
    >
      {items.map((item) => (
        <HotspotItem
          key={item.id}
          item={item}
          texture={starTexture}
          globalVisible={showHotspots && visible}
          onHover={(id) => {
            if (!(showHotspots && visible)) return
            if (leaveTimer.current) {
              clearTimeout(leaveTimer.current)
              leaveTimer.current = null
            }
            setCameraTargetId(id)
          }}
          onLeave={() => {
            leaveTimer.current = setTimeout(() => {
              setCameraTargetId(null)
            }, 300)
          }}
        />
      ))}
    </motion.group>
  )
}
