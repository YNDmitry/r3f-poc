import { Suspense } from 'react'
import { EffectComposer, Bloom, BrightnessContrast, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export function Effects() {
  return (
    <Suspense fallback={null}>
      {/*
        Enable Hardware MSAA (Multisampling) inside the Composer
        multisampling={4} is a good balance for quality/performance
        Removed <SMAA /> as requested
      */}
      <EffectComposer multisampling={16}>
        <Bloom
          intensity={0.15}
          luminanceThreshold={0.9}
          mipmapBlur // Optional: Makes bloom smoother and faster usually
        />
        <BrightnessContrast contrast={0.1} brightness={-0.05} />
        <ToneMapping
            blendFunction={BlendFunction.NORMAL}
            adaptive={true}
            resolution={256} // Optimized from 512
            middleGrey={0.6}
            maxLuminance={16.0}
            averageLuminance={1.0}
            adaptationRate={5.0}
        />
      </EffectComposer>
    </Suspense>
  )
}
