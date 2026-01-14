import type { ReactNode } from 'react'
import { SceneConfigContext, type SceneConfiguration } from './SceneContext'

export const SceneConfigProvider = ({ config, children }: { config: SceneConfiguration, children: ReactNode }) => {
  return (
    <SceneConfigContext.Provider value={config}>
      {children}
    </SceneConfigContext.Provider>
  )
}
