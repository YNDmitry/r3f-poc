import { Suspense, useLayoutEffect, useRef } from 'react'
import { EffectComposer, Bloom, BrightnessContrast } from '@react-three/postprocessing'
import { useFrame, useThree } from '@react-three/fiber'
import { HalfFloatType } from 'three'
import { useSceneInit } from './SceneInitContext'

export function Effects() {
  const { register } = useSceneInit()
  const { invalidate } = useThree()
  const remainingFramesRef = useRef(0)
  const doneRef = useRef<(() => void) | null>(null)
  const readyRef = useRef(true)

  useLayoutEffect(() => {
    const done = register()
    doneRef.current = done
    remainingFramesRef.current = 2
    readyRef.current = false
    return () => {
      if (doneRef.current) {
        doneRef.current()
        doneRef.current = null
      }
    }
  }, [register])

  useFrame(() => {
    if (readyRef.current) return
    remainingFramesRef.current -= 1
    if (remainingFramesRef.current <= 0) {
      readyRef.current = true
      if (doneRef.current) {
        doneRef.current()
        doneRef.current = null
      }
      return
    }
    invalidate()
  }, 1)

  return (
    <Suspense fallback={null}>
      <EffectComposer
        multisampling={window.devicePixelRatio * 2} // Efficient hardware AA
        stencilBuffer={false}
        depthBuffer={true}
        frameBufferType={HalfFloatType}
      >
        <Bloom intensity={0.01} luminanceThreshold={0.9} mipmapBlur />
        <BrightnessContrast contrast={0.22} brightness={0.02} />
      </EffectComposer>
    </Suspense>
  )
}
