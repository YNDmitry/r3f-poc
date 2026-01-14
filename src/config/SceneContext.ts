import { createContext, useContext } from 'react'
import { CONSTANTS } from './scene-config'

// Extract the type from the constants object automatically
export type SceneConfiguration = typeof CONSTANTS

export const SceneConfigContext = createContext<SceneConfiguration>(CONSTANTS)

export const useSceneConfig = () => {
  const context = useContext(SceneConfigContext)
  if (!context) {
    throw new Error('useSceneConfig must be used within a SceneConfigProvider')
  }
  return context
}
