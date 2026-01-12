import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { SceneMount } from './SceneMount'; import type { WebflowSceneConfig } from './SceneMount'

// --- Config Parser ---

function safeUrl(url: string | null): string | null {
  if (!url) return null
  return url.trim()
}

function parseConfig(el: HTMLElement): WebflowSceneConfig {
  const ds = el.dataset

  const rawType = ds.scene || ds.tres || 'hero-duo'

  return {
    scene: rawType,
    modelA: safeUrl(ds.modelA || null),
    modelB: safeUrl(ds.modelB || null),
    hdr: safeUrl(ds.hdr || null),
    poster: safeUrl(ds.poster || null), // Support data-poster
    hideSpinner: ds.hideSpinner !== undefined,
    exposure: ds.exposure ? Number.parseFloat(ds.exposure) : undefined,
    bloom: ds.bloom ? Number.parseFloat(ds.bloom) : undefined,
    envIntensity: ds.envIntensity ? Number.parseFloat(ds.envIntensity) : undefined,
  }
}

// --- Registry & Lifecycle ---

const mountedRoots = new Map<HTMLElement, Root>()

export function mountAll() {
  const elements = document.querySelectorAll<HTMLElement>('[data-tres]')

  elements.forEach((el) => {
    if (mountedRoots.has(el)) return

    const tresAttr = el.dataset.tres || ''
    if (!tresAttr) return

    try {
      const config = parseConfig(el)
      const root = createRoot(el)
      
      root.render(<SceneMount config={config} />)
      
      mountedRoots.set(el, root)
      el.dataset.tresManaged = 'true'
    } catch (err) {
      console.error('[WebflowTres] Failed to mount scene:', el, err)
      el.dataset.tresState = 'error'
    }
  })
}

export function unmountAll() {
  mountedRoots.forEach((root, el) => {
    root.unmount()
    el.innerHTML = ''
    delete el.dataset.tresManaged
    delete el.dataset.tresState
  })
  mountedRoots.clear()
}

export function refresh() {
  unmountAll()
  mountAll()
}

// --- Bootstrap ---

if (typeof window !== 'undefined') {
  window.WebflowTresScenes = {
    mountAll,
    unmountAll,
    refresh,
    version: '1.0.0', 
  }

  const init = () => {
    mountAll()
    console.warn('[WebflowTres] Initialized (React)')
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

  const observer = new MutationObserver((mutations) => {
    let shouldMount = false
    for (const m of mutations) {
      if (m.type !== 'childList') continue
      for (const node of Array.from(m.addedNodes)) {
        if (node instanceof HTMLElement) {
          if (node.matches('[data-tres]') || node.querySelector('[data-tres]')) {
            shouldMount = true
            break
          }
        }
      }
      if (shouldMount) break
    }
    if (shouldMount) mountAll()
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}
