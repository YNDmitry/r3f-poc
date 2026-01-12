import { useMemo, useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Html, Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { createStarTexture } from '../../utils/createStarTexture'
import { useSceneConfig } from '../../config/SceneConfigContext'
import type { ProductType } from '../../config/scene-config'
import { useCinematicCamera } from '../../hooks/useCinematicCamera'
import { Hud } from '../../components/Hud/Hud'

interface HotspotsProps {
  type: ProductType
  active: boolean
  controlsRef: any
}

// Individual Hotspot Component for better control
function HotspotItem({ 
  item, 
  texture, 
  onHover, 
  onLeave 
}: { 
  item: any, 
  texture: THREE.Texture, 
  onHover: (id: string) => void,
  onLeave: () => void 
}) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (meshRef.current && !hovered) {
      const time = state.clock.elapsedTime
      // Pulsing when NOT hovered
      const scale = 1.0 + Math.sin(time * 3) * 0.15
      meshRef.current.scale.set(scale, scale, 1)
      ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.8 + Math.sin(time * 2) * 0.2
    } else if (meshRef.current && hovered) {
      // Hide on hover (fade out)
      meshRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.2)
    }
  })

  return (
    <group position={item.position}>
      {/* Visual Star (Billboard makes it always face camera) */}
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

      {/* Invisible Hitbox */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          onHover(item.id)
          document.body.style.cursor = 'pointer' // FIX: Use pointer cursor
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

      {hovered && (
        <Html distanceFactor={1.2} transform={false} style={{ pointerEvents: 'none' }}>
          <Hud item={item} />
        </Html>
      )}
    </group>
  )
}

export function Hotspots({ type, active, controlsRef }: HotspotsProps) {
  const config = useSceneConfig()
  const items = config.customHotspots[type]
  
  const [cameraTargetId, setCameraTargetId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  const leaveTimer = useRef<any>(null)
  const starTexture = useMemo(() => createStarTexture(), [])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 991)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!active) {
      setCameraTargetId(null)
    }
  }, [active])

  const shouldRunCamera = active && !isMobile
  useCinematicCamera(shouldRunCamera, controlsRef, cameraTargetId, items)

  if (!active || isMobile) return null

  return (
    <group>
      {items.map((item) => (
        <HotspotItem
          key={item.id}
          item={item}
          texture={starTexture}
          onHover={(id) => {
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
    </group>
  )
}
