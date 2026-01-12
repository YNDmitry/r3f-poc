import { useEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { Glints } from '../arcade/Glints'

interface ProductModelProps {
  url: string
  opacityValue?: any
  withGlints?: boolean
  glintsVisible?: boolean // New prop to control glint visibility dynamically
}

export function ProductModel({ url, opacityValue, withGlints, glintsVisible = true }: ProductModelProps) {
  const { scene } = useGLTF(url)
  const clonedScene = useMemo(() => scene.clone(true), [scene])
  const materials = useRef<THREE.Material[]>([])

  useEffect(() => {
    const mats: THREE.Material[] = []
    
    clonedScene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        mats.push(child.material)
        
        const mat = child.material
        const matName = mat.name.toLowerCase()
        const mapName = mat.emissiveMap?.name?.toLowerCase() || ''
        const meshName = child.name.toLowerCase()
        
        const isScreen = 
          matName.includes('screen') || 
          matName.includes('display') || 
          matName.includes('monitor') ||
          matName.includes('matrix') ||
          matName.includes('arcade') ||
          matName.includes('9_gms') ||
          mapName.includes('screen') || 
          mapName.includes('display') ||
          mapName.includes('arcade') ||
          meshName.includes('screen') ||
          meshName.includes('display')

        if (isScreen) {
           if (mat.emissiveMap) {
             mat.emissiveIntensity = 2.5 
           } else {
             mat.emissiveIntensity = 1.5
           }
           mat.toneMapped = false 
        } else if (mat.emissiveMap) {
           mat.emissiveIntensity = 1.5
        }
      }
    })
    materials.current = mats
  }, [clonedScene])

  useEffect(() => {
    if (!opacityValue) return
    const unsubscribe = opacityValue.on("change", (latest: number) => {
      const needsTransparent = latest < 0.99
      materials.current.forEach(m => {
        if (m.transparent !== needsTransparent) {
          m.transparent = needsTransparent
          m.needsUpdate = true
        }
        m.opacity = latest
      })
      clonedScene.visible = latest > 0.05
    })
    return unsubscribe
  }, [opacityValue, clonedScene])

  return (
    <>
      <primitive object={clonedScene} />
      {withGlints && <Glints scene={clonedScene} visible={glintsVisible} />}
    </>
  )
}
