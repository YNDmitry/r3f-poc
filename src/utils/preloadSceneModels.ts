import { useGLTF } from '@react-three/drei'

export const preloadSceneModels = (a: string, b: string) => {
  useGLTF.preload(a)
  useGLTF.preload(b)
}
