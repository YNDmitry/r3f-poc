import { useEffect, useRef, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { useSceneInit } from './SceneInitContext'

interface SceneWarmupProps {
  onReady: () => void
  resetKey?: string | number
  enabled?: boolean
  settleFrames?: number
}

export function SceneWarmup({
  onReady,
  resetKey,
  enabled = true,
  settleFrames = 2,
}: SceneWarmupProps) {
  const { gl, scene, camera, invalidate } = useThree()
  const { active, progress, total } = useProgress()
  const { pending } = useSceneInit()
  const hasRunRef = useRef(false)
  const hasStartedRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const readyRef = useRef(false)
  const waitingForPendingRef = useRef(false)
  const pendingRef = useRef(pending)
  const compileQueuedRef = useRef(false)

  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  const markReady = useCallback(() => {
    if (readyRef.current) return
    if (pendingRef.current > 0) {
      waitingForPendingRef.current = true
      return
    }
    readyRef.current = true
    onReady()
  }, [onReady])

  const runCompile = useCallback(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true
    rafRef.current = requestAnimationFrame(() => {
      gl.compile(scene, camera)
      invalidate()
      if (settleFrames <= 0) {
        markReady()
        return
      }

      let remaining = settleFrames
      const tick = () => {
        remaining -= 1
        if (remaining <= 0) {
          markReady()
          return
        }
        invalidate()
        rafRef.current = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    })
  }, [gl, scene, camera, invalidate, markReady, settleFrames])

  const maybeCompile = useCallback(() => {
    if (hasRunRef.current || compileQueuedRef.current) return
    const hasProgress = active || progress > 0 || total > 0
    const progressDone = !active && progress >= 100
    const noProgressButSettled = !hasProgress && !active
    if (pendingRef.current > 0) return
    if (!progressDone && !noProgressButSettled) return
    compileQueuedRef.current = true
    runCompile()
  }, [active, progress, total, runCompile])

  useEffect(() => {
    hasRunRef.current = false
    hasStartedRef.current = false
    readyRef.current = false
    waitingForPendingRef.current = false
    compileQueuedRef.current = false
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [resetKey])

  useEffect(() => {
    if (active || total > 0 || progress > 0) {
      hasStartedRef.current = true
    }
  }, [active, total, progress])

  useEffect(() => {
    if (!enabled || hasRunRef.current) return

    if (hasStartedRef.current) {
      maybeCompile()
      return
    }

    const fallbackTimer = window.setTimeout(() => {
      if (!hasRunRef.current && !active) {
        maybeCompile()
      }
    }, 150)

    return () => window.clearTimeout(fallbackTimer)
  }, [enabled, active, progress, maybeCompile])

  useEffect(() => {
    if (!waitingForPendingRef.current) return
    if (pending > 0 || readyRef.current) return
    waitingForPendingRef.current = false
    readyRef.current = true
    onReady()
  }, [pending, onReady])

  useEffect(() => {
    if (!enabled || hasRunRef.current) return
    maybeCompile()
  }, [enabled, pending, active, progress, total, maybeCompile])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  return null
}
