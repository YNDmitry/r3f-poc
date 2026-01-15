import { MotionValue } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import { useGLTF, Bvh } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Glints } from '../arcade/Glints'

interface ProductModelProps {
  url: string
  opacityValue?: MotionValue<number>
  withGlints?: boolean
  glintsVisible?: boolean
  glintPositions?: [number, number, number][]
}

export function ProductModel({
  url,
  opacityValue,
  withGlints,
  glintsVisible = true,
  glintPositions = [],
}: ProductModelProps) {
  const { invalidate } = useThree()
  const { scene } = useGLTF(url)
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          ;(child as THREE.Mesh).geometry.dispose()
          const material = (child as THREE.Mesh).material
          if (Array.isArray(material)) {
            material.forEach((m) => m.dispose())
          } else {
            material.dispose()
          }
        }
      })
    }
  }, [clonedScene])

  const materials = useRef<THREE.Material[]>([])

  useEffect(() => {
    const mats: THREE.Material[] = []

    // First pass: Find source material for hacks (Cube_01005)
    let sourceMat: THREE.Material | null = null
    clonedScene.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh && mesh.name === 'Cube_01005') {
        sourceMat = mesh.material as THREE.Material
      }
    })

    clonedScene.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh && mesh.material) {
        // Init: Set based on initial opacity (assumed 1.0 if not started)
        // We start opaque to look good immediately.
        const material = mesh.material as THREE.Material
        material.transparent = false
        material.depthWrite = true
        mats.push(material)

        const mat = material as THREE.MeshStandardMaterial // Assuming standard mostly, but base Material is enough for generic props
        const matName = mat.name.toLowerCase()
        const meshName = mesh.name

        // 2. Fix Plane001 (Color override)
        if (meshName === 'Plane001') {
          const baseMat = sourceMat || (mesh.material as THREE.Material)
          const newMat = baseMat.clone() as THREE.MeshStandardMaterial

          newMat.color.set('#gray')

          mesh.material = newMat
        }

        // --- SCREEN LOGIC ---
        const isScreen = matName.includes('9_gms')

        if (isScreen) {
          // @ts-ignore
          if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0.9
          mat.toneMapped = false
        } else if ((mat as any).emissiveMap) {
          // @ts-ignore
          if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0.9
          // mat.toneMapped defaults to true for others, which is fine
        }
      }
    })
    materials.current = mats
  }, [clonedScene])

  useEffect(() => {
    if (!opacityValue) return
    const unsubscribe = opacityValue.on('change', (latest: number) => {
      // Logic:
      // High opacity (> 0.99) -> Opaque (Best Visuals, SSAO works)
      // Low opacity (< 0.99)  -> Transparent (Fading works)
      const needsTransparent = latest < 0.99

      materials.current.forEach((m) => {
        // Only toggle if state changes (avoids constant setting)
        if (m.transparent !== needsTransparent) {
          m.transparent = needsTransparent
          // When switching to transparent, ensure depthWrite is maintained for sorting
          // When opaque, depthWrite is default true anyway.
          m.depthWrite = true
          m.needsUpdate = true // Trigger recompile/update
        }
        m.opacity = latest
      })
      clonedScene.visible = latest > 0.05
      invalidate()
    })
    return unsubscribe
  }, [opacityValue, clonedScene, invalidate])

  return (
    <>
      <Bvh firstHitOnly>
        <primitive object={clonedScene} />
      </Bvh>
      {withGlints && <Glints positions={glintPositions} visible={glintsVisible} />}
    </>
  )
}
