import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface SceneInitContextValue {
  register: () => () => void
  pending: number
}

const SceneInitContext = createContext<SceneInitContextValue | null>(null)

export function SceneInitProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0)

  const register = useCallback(() => {
    let done = false
    setPending((value) => value + 1)
    return () => {
      if (done) return
      done = true
      setPending((value) => Math.max(0, value - 1))
    }
  }, [])

  const value = useMemo(() => ({ register, pending }), [register, pending])

  return <SceneInitContext.Provider value={value}>{children}</SceneInitContext.Provider>
}

export function useSceneInit() {
  const context = useContext(SceneInitContext)
  if (!context) {
    return { register: () => () => {}, pending: 0 }
  }
  return context
}
