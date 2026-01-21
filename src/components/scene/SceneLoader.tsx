import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import './SceneLoader.css'

interface SceneLoaderProps {
  enabled?: boolean
  isReady?: boolean
  minDuration?: number
}

export function SceneLoader({ enabled = true, isReady, minDuration = 650 }: SceneLoaderProps) {
  const { active, progress } = useProgress()
  const [visible, setVisible] = useState(false)
  const shownAtRef = useRef<number | null>(null)

  const isLoading = active || (progress > 0 && progress < 100)
  const shouldShow = enabled && (isLoading || isReady === false)

  useEffect(() => {
    if (!enabled) {
      setVisible(false)
      shownAtRef.current = null
      return
    }

    if (shouldShow) {
      if (!visible) {
        setVisible(true)
        shownAtRef.current = Date.now()
      }
      return
    }

    if (!visible) {
      shownAtRef.current = null
      return
    }

    const shownAt = shownAtRef.current ?? Date.now()
    const elapsed = Date.now() - shownAt
    const delay = Math.max(minDuration - elapsed, 0)
    const timer = setTimeout(() => {
      setVisible(false)
      shownAtRef.current = null
    }, delay)

    return () => clearTimeout(timer)
  }, [enabled, shouldShow, visible, minDuration])

  if (!visible) return null

  const progressValue = Math.min(100, Math.max(0, Math.round(progress)))

  return (
    <div className="scene-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="scene-loader__panel">
        <div className="scene-loader__spinner" />
        <div className="scene-loader__text">
          <div className="scene-loader__meta">
            <span className="scene-loader__percent">{progressValue}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
