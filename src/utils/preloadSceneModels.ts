import { useGLTF } from '@react-three/drei'

export const preloadSceneModels = (a: string, b: string) => {
  // Use a small delay to avoid blocking the very first frame of the page
  setTimeout(() => {
    useGLTF.preload(a)
    useGLTF.preload(b)
  }, 500)
}
