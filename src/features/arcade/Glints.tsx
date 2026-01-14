import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { createStarTexture } from '../../utils/createStarTexture'

// Imperative Glint manager
class GlintAnimator {
  mesh: THREE.Mesh
  offset: number
  
  constructor(texture: THREE.Texture, geometry: THREE.PlaneGeometry) {
    // Use shared geometry
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
    // Geometry is shared, do not dispose it here!
    // this.mesh.geometry.dispose() 
    ;(this.mesh.material as THREE.Material).dispose()
  }
}

export function Glints({ positions = [], visible = true }: { positions?: [number, number, number][], visible?: boolean }) {
  const texture = useMemo(() => createStarTexture(), [])
  const animators = useMemo<GlintAnimator[]>(() => [], [])
  // Optimization: Share geometry across all glints
  const sharedGeometry = useMemo(() => new THREE.PlaneGeometry(0.15, 0.15), [])

  useEffect(() => {
    // Clear old animators
    animators.forEach(a => {
        a.mesh.removeFromParent()
        a.dispose()
    })
    animators.length = 0

    positions.forEach(pos => {
      // Pass shared geometry
      const animator = new GlintAnimator(texture, sharedGeometry)
      animator.mesh.position.set(pos[0], pos[1], pos[2])
      
      // We need to add it to a parent group. 
      // Since Glints is used inside <primitive> in ProductModel, 
      // we can't easily add to the parent "scene" without passing it.
      // BUT, we can just return a <group> and add meshes to it in React.
      // However, the current class-based approach is imperative.
      // Let's adapt: The parent of this component is the <ProductModel> fragment.
      // We should return a group and add meshes to ref.
    })
    // REFACTOR: The imperative approach was designed for attaching to arbitrary scene graph nodes.
    // Now we have explicit positions. It's better to just render them declaratively.
  }, [positions, texture, animators, sharedGeometry])
  
  // Declarative render
  useFrame((state) => {
     const time = state.clock.elapsedTime
     animators.forEach(a => a.update(time, state.camera, visible))
  })

  return (
    <group>
        {positions.map((pos, i) => (
            <GlintItem key={i} position={pos} texture={texture} geometry={sharedGeometry} visible={visible} />
        ))}
    </group>
  )
}

function GlintItem({ position, texture, geometry, visible }: { position: [number, number, number], texture: THREE.Texture, geometry: THREE.PlaneGeometry, visible: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const offset = useMemo(() => Math.random() * 100, [])
    const visibleFactor = useRef(1)

    useFrame((state) => {
        if (!meshRef.current) return
        const time = state.clock.elapsedTime
        
        // Smoothly transition visibility factor
        visibleFactor.current = THREE.MathUtils.lerp(visibleFactor.current, visible ? 1 : 0, 0.1)

        const t = Math.sin((time + offset) * 3)
        const opacity = (t + 1) / 2
        let sparkle = Math.pow(opacity, 10) * visibleFactor.current

        if (visibleFactor.current < 0.01) {
            meshRef.current.visible = false
        } else {
            meshRef.current.visible = true
            meshRef.current.scale.setScalar(sparkle)
            ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = sparkle
            meshRef.current.rotation.z += 0.01
            meshRef.current.lookAt(state.camera.position)
        }
    })

    return (
        <mesh ref={meshRef} position={position} geometry={geometry}>
            <meshBasicMaterial 
                map={texture} 
                transparent 
                depthWrite={false} 
                depthTest={false} 
                blending={THREE.AdditiveBlending} 
                color="white" 
                side={THREE.DoubleSide} 
            />
        </mesh>
    )
}