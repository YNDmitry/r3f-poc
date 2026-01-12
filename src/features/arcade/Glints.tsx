import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { createStarTexture } from '../../utils/createStarTexture'

// Imperative Glint manager
class GlintAnimator {
  mesh: THREE.Mesh
  offset: number
  
  constructor(texture: THREE.Texture) {
    const geometry = new THREE.PlaneGeometry(0.15, 0.15)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      color: 'white',
      side: THREE.DoubleSide
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.offset = Math.random() * 100
  }

  update(time: number, camera: THREE.Camera, visible: boolean) {
    // Animation
    const t = Math.sin((time + this.offset) * 3)
    const opacity = (t + 1) / 2
    let sparkle = Math.pow(opacity, 10)
    
    // Logic: If not visible, force scale to 0 smoothly (simulated by modifying sparkle factor)
    if (!visible) {
        sparkle = 0;
        // Use slight lerp for smoothness if we had a previous state, 
        // but here we rely on the frame loop. 
        // To make it truly smooth fading out, we'd need internal state, 
        // but snapping to 0 scale is usually fine for "hiding during fast motion".
        // Let's make it invisible instantly to prevent misclicks as requested.
        this.mesh.visible = false;
        return;
    }

    this.mesh.visible = true;
    this.mesh.scale.setScalar(sparkle)
    ;(this.mesh.material as THREE.MeshBasicMaterial).opacity = sparkle
    this.mesh.rotation.z += 0.01

    // Billboard effect (manual)
    this.mesh.lookAt(camera.position)
  }
  
  dispose() {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }
}

export function Glints({ scene, visible = true }: { scene: THREE.Object3D, visible?: boolean }) {
  const texture = useMemo(() => createStarTexture(), [])
  const animators = useMemo<GlintAnimator[]>(() => [], [])

  useEffect(() => {
    const candidates: THREE.Object3D[] = []
    
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const name = obj.name.toLowerCase()
        if (
          !name.includes('glass') &&
          !name.includes('screen') &&
          !name.includes('window') &&
          !name.includes('display') &&
          !name.includes('plane')
        ) {
          candidates.push(obj)
        }
      }
    })

    // Shuffle and pick 5
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = candidates[i]
      candidates[i] = candidates[j]
      candidates[j] = temp
    }
    const targets = candidates.slice(0, 5)

    targets.forEach(target => {
      const animator = new GlintAnimator(texture)
      
      if ((target as THREE.Mesh).geometry) {
         (target as THREE.Mesh).geometry.computeBoundingSphere()
         const sphere = (target as THREE.Mesh).geometry.boundingSphere
         if (sphere) {
             animator.mesh.position.copy(sphere.center)
             animator.mesh.position.z += sphere.radius 
         }
      }
      
      target.add(animator.mesh)
      animators.push(animator)
    })

    return () => {
      animators.forEach(a => {
        a.mesh.removeFromParent()
        a.dispose()
      })
      animators.length = 0
    }
  }, [scene, texture, animators])

  useFrame((state) => {
    const time = state.clock.elapsedTime
    // Pass the 'visible' prop down to the update loop
    animators.forEach(a => a.update(time, state.camera, visible))
  })

  return null
}
