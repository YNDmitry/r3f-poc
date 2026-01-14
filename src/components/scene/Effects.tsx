import { Suspense } from 'react'
import { EffectComposer, Bloom, BrightnessContrast } from '@react-three/postprocessing'
import { HalfFloatType } from 'three'

export function Effects() {
  return (
    <Suspense fallback={null}>
      <EffectComposer
        multisampling={0}
        stencilBuffer={false}
        depthBuffer={true}
        frameBufferType={HalfFloatType}
      >
        <Bloom intensity={0.01} luminanceThreshold={0.9} />
        <BrightnessContrast contrast={0.25} brightness={-0.03} />
      </EffectComposer>
    </Suspense>
  )
}
