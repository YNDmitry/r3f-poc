import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { createStarTexture } from '../../utils/createStarTexture'

interface GlintsProps {
  positions?: [number, number, number][]
  visible?: boolean
}

const tempObject = new THREE.Object3D()

export function Glints({ positions = [], visible = true }: GlintsProps) {
  const { invalidate } = useThree()
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const texture = useMemo(() => createStarTexture(), [])

  const offsets = useMemo(() => positions.map(() => Math.random() * 100), [positions])

  const visibleFactor = useRef(1)

  useFrame((state) => {
    if (!meshRef.current || positions.length === 0) return

    const time = state.clock.elapsedTime

    visibleFactor.current = THREE.MathUtils.lerp(visibleFactor.current, visible ? 1 : 0, 0.1)

    if (visibleFactor.current < 0.001) {
      meshRef.current.visible = false
      return
    }

    meshRef.current.visible = true

    positions.forEach((pos, i) => {
      const offset = offsets[i]
      const t = Math.sin((time + offset) * 3)
      const sparkle = Math.pow((t + 1) / 2, 10) * visibleFactor.current

      tempObject.position.set(pos[0], pos[1], pos[2])
      tempObject.scale.setScalar(sparkle)
      tempObject.lookAt(state.camera.position)
      tempObject.updateMatrix()

      meshRef.current.setMatrixAt(i, tempObject.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    invalidate()
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, positions.length]}
      frustumCulled={false}
    >
      <planeGeometry args={[0.15, 0.15]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        color="white"
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  )
}
