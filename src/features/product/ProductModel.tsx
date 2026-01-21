import { useEffect, useRef, useState } from 'react'
import { useGLTF, meshBounds } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Glints } from '../arcade/Glints'
import type { MotionValue } from 'framer-motion'
import { KTX2Loader } from 'three-stdlib'
import { useSceneInit } from '../../components/scene/SceneInitContext'

const FROSTED_MESH_NAMES = new Set([
  'GeoSphere003',
  'Cylinder236',
  'Cylinder238',
  'Box013',
  'Sphere',
  'Cylinder.007',
  'Circle',
  'Circle.004',
  'Circle.005',
])

const FROSTED_MATERIAL_NAMES = new Set([
  'Paper_button',
  'Glass_GLTF',
  'Material.003',
  'Material.005',
  'Material.001',
  'Mat_Circle.005_Unique_GLTF.001',
])

const FROSTED_OPACITY = 0.66
const FROSTED_TINT = new THREE.Color('#c9d3df')

interface ProductModelProps {
  url: string
  opacityValue?: MotionValue<number>
  withGlints?: boolean
  glintsVisible?: boolean
  glintPositions?: [number, number, number][]
  raycastMode?: 'bounds' | 'default' | 'none'
  onBounds?: (bounds: { center: [number, number, number]; size: [number, number, number] }) => void
  frosted?: boolean
}

export function ProductModel({
  url,
  opacityValue,
  withGlints,
  glintsVisible = true,
  glintPositions = [],
  raycastMode = 'bounds',
  onBounds,
  frosted = true,
}: ProductModelProps) {
  const { invalidate, gl } = useThree()
  const { register } = useSceneInit()
  const { scene } = useGLTF(url, undefined, undefined, (loader) => {
    const ktx2Loader = new KTX2Loader()
    ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/gh/pmndrs/drei-assets/basis/')
    ktx2Loader.detectSupport(gl)
    loader.setKTX2Loader(ktx2Loader)
  })
  const [clonedScene, setClonedScene] = useState<THREE.Group | null>(null)
  const noRaycastRef = useRef(() => null)

  const materials = useRef<
    Array<{ material: THREE.Material; baseOpacity: number; forceTransparent: boolean }>
  >([])

  useEffect(() => {
    let cancelled = false
    let done = false
    const finish = register()

    const markDone = () => {
      if (done) return
      done = true
      finish()
    }

    setClonedScene(null)
    materials.current = []

    const scheduleIdle = (cb: () => void) => {
      if (typeof window === 'undefined') return setTimeout(cb, 1)
      const idle = (window as Window & {
        requestIdleCallback?: (handler: () => void, options?: { timeout: number }) => number
      }).requestIdleCallback
      return idle ? idle(cb, { timeout: 250 }) : window.setTimeout(cb, 1)
    }

    const cancelIdle = (id: number) => {
      if (typeof window === 'undefined') {
        clearTimeout(id)
        return
      }
      const cancel = (window as Window & { cancelIdleCallback?: (handle: number) => void })
        .cancelIdleCallback
      if (cancel) {
        cancel(id)
      } else {
        clearTimeout(id)
      }
    }

    const idleHandle = scheduleIdle(() => {
      if (cancelled) {
        markDone()
        return
      }

      const cloned = scene.clone(true)
      let sourceMat: THREE.Material | null = null
      let planeMesh: THREE.Mesh | null = null

      const applyFrostedFinish = (material: THREE.Material) => {
        const mat = material as THREE.MeshStandardMaterial & {
          clearcoat?: number
          clearcoatRoughness?: number
          transmission?: number
          envMapIntensity?: number
          thickness?: number
          ior?: number
        }

        if ('color' in mat && mat.color) {
          mat.color.lerp(FROSTED_TINT, 0.25)
        }
        if ('roughness' in mat && typeof mat.roughness === 'number') {
          mat.roughness = Math.max(mat.roughness, 1)
        }
        if ('metalness' in mat && typeof mat.metalness === 'number') {
          mat.metalness = 0
        }
        if (typeof mat.envMapIntensity === 'number') {
          mat.envMapIntensity = 0
        }
        if (typeof mat.clearcoat === 'number') {
          mat.clearcoat = 0
        }
        if (typeof mat.clearcoatRoughness === 'number') {
          mat.clearcoatRoughness = 1
        }
        if (typeof mat.specularIntensity === 'number') {
          mat.specularIntensity = 0
        }
        if (typeof mat.specularColor !== 'undefined') {
          mat.specularColor = FROSTED_TINT
        }
        if (typeof mat.transmission === 'number') {
          mat.transmission = 0
          if (typeof mat.thickness === 'number') {
            mat.thickness = 0
          }
          if (typeof mat.ior === 'number') {
            mat.ior = 1.1
          }
          if (typeof mat.attenuationColor !== 'undefined') {
            mat.attenuationColor = FROSTED_TINT
          }
        }

        material.needsUpdate = true
      }

      const registerMaterial = (
        material: THREE.Material,
        options?: { baseOpacity?: number; forceTransparent?: boolean }
      ) => {
        const baseOpacity = options?.baseOpacity ?? 1
        const forceTransparent = options?.forceTransparent ?? false
        materials.current.push({ material, baseOpacity, forceTransparent })
      }

      const prepareMaterial = (material: THREE.Material, shouldFrost: boolean) => {
        const nextMaterial = shouldFrost ? material.clone() : material
        if (shouldFrost) {
          nextMaterial.transparent = true
          nextMaterial.depthWrite = true
          nextMaterial.opacity = FROSTED_OPACITY
          nextMaterial.needsUpdate = true
        } else {
          nextMaterial.transparent = false
          nextMaterial.depthWrite = true
        }

        registerMaterial(nextMaterial, {
          baseOpacity: shouldFrost ? FROSTED_OPACITY : 1,
          forceTransparent: shouldFrost,
        })

        const mat = nextMaterial as THREE.MeshStandardMaterial
        const matName = mat.name?.toLowerCase() || ''
        const isScreen = matName.includes('9_gms')
        if (isScreen) {
          // @ts-ignore
          if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0.9
          mat.toneMapped = false
        } else if ((mat as any).emissiveMap) {
          // @ts-ignore
          if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0.9
        }

        if (shouldFrost) {
          applyFrostedFinish(nextMaterial)
        }

        return nextMaterial
      }

      cloned.traverse((child: THREE.Object3D) => {
        const mesh = child as THREE.Mesh
        if (!mesh.isMesh || !mesh.material) return
        const shouldFrostMesh = frosted && FROSTED_MESH_NAMES.has(mesh.name)

        if (mesh.name === 'Cube_01005') {
          sourceMat = mesh.material as THREE.Material
        }

        if (mesh.name === 'Plane001') {
          planeMesh = mesh
          return
        }

        if (Array.isArray(mesh.material)) {
          let hasFrostedMaterial = false
          const nextMaterials = mesh.material.map((mat) => {
            const shouldFrost =
              shouldFrostMesh || (frosted && FROSTED_MATERIAL_NAMES.has(mat.name || ''))
            if (shouldFrost) hasFrostedMaterial = true
            return prepareMaterial(mat, shouldFrost)
          })
          if (shouldFrostMesh || hasFrostedMaterial) mesh.material = nextMaterials
        } else {
          const mat = mesh.material as THREE.Material
          const shouldFrost =
            shouldFrostMesh || (frosted && FROSTED_MATERIAL_NAMES.has(mat.name || ''))
          const nextMaterial = prepareMaterial(mat, shouldFrost)
          if (shouldFrost) mesh.material = nextMaterial
        }
      })

      if (planeMesh) {
        const baseMat = (sourceMat || (planeMesh.material as THREE.Material)) as THREE.Material
        const newMat = baseMat.clone() as THREE.MeshStandardMaterial
        newMat.color.set('gray')
        planeMesh.material = newMat
        prepareMaterial(newMat, false)
      }

      if (!cancelled) {
        setClonedScene(cloned)
        if (onBounds) {
          const box = new THREE.Box3().setFromObject(cloned)
          const size = new THREE.Vector3()
          const center = new THREE.Vector3()
          box.getSize(size)
          box.getCenter(center)
          onBounds({
            center: [center.x, center.y, center.z],
            size: [size.x, size.y, size.z],
          })
        }
        invalidate()
      }
      markDone()
    })

    return () => {
      cancelled = true
      cancelIdle(idleHandle)
      markDone()
    }
  }, [scene, invalidate, onBounds, register])

  useEffect(() => {
    if (!clonedScene) return
    clonedScene.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      if (raycastMode === 'none') {
        mesh.raycast = noRaycastRef.current
      } else if (raycastMode === 'default') {
        mesh.raycast = THREE.Mesh.prototype.raycast
      } else {
        mesh.raycast = meshBounds
      }
    })
  }, [clonedScene, raycastMode])

  useEffect(() => {
    if (!clonedScene) return
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

  useEffect(() => {
    if (!opacityValue || !clonedScene) return
    const unsubscribe = opacityValue.on('change', (latest: number) => {
      const needsTransparent = latest < 0.99

      materials.current.forEach(({ material, baseOpacity, forceTransparent }) => {
        const targetOpacity = baseOpacity * latest
        if (forceTransparent) {
          if (!material.transparent || material.depthWrite !== true) {
            material.transparent = true
            material.depthWrite = true
            material.needsUpdate = true
          }
        } else if (material.transparent !== needsTransparent) {
          material.transparent = needsTransparent
          material.depthWrite = true
          material.needsUpdate = true
        }
        material.opacity = targetOpacity
      })
      clonedScene.visible = latest > 0.05

      // ONLY invalidate if actually changing. Framer motion sometimes sends micro-updates.
      invalidate()
    })
    return unsubscribe
  }, [opacityValue, clonedScene, invalidate])

  if (!clonedScene) return null

  return (
    <>
      <primitive object={clonedScene} />
      {withGlints && <Glints positions={glintPositions} visible={glintsVisible} />}
    </>
  )
}
