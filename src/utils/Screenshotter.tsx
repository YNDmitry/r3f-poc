import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export function Screenshotter() {
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Press 'P' to take a screenshot
      if (e.key.toLowerCase() === 'p') {
        // Force a render to ensure buffer is fresh
        gl.render(scene, camera)
        
        gl.domElement.toBlob((blob) => {
          if (blob) {
            const a = document.createElement('a')
            const url = URL.createObjectURL(blob)
            a.href = url
            a.download = `scene-shot-${Date.now()}.png`
            a.click()
            URL.revokeObjectURL(url)
            console.log('📸 Screenshot saved!')
          }
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gl, scene, camera])

  return null
}
