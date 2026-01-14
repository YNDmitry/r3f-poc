import { createRoot, type Root } from 'react-dom/client'
import { SceneMount } from './SceneMount'
import type { WebflowSceneConfig } from './SceneMount'

declare global {
  interface Window {
    WebflowTresScenes: any
  }
}

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
    poster: safeUrl(ds.poster || null), // Support data-poster
  }
}

// --- Registry & Lifecycle ---

const mountedRoots = new Map<HTMLElement, Root>()

export function mountAll() {
  const elements = document.querySelectorAll<HTMLElement>('[data-tres]')

  elements.forEach((el) => {
    if (mountedRoots.has(el)) return

    const sceneAttr = el.dataset.tres || ''
    if (!sceneAttr) return

    try {
      const config = parseConfig(el)
      const root = createRoot(el)

      root.render(<SceneMount config={config} />)

      mountedRoots.set(el, root)
      el.dataset.sceneManaged = 'true'
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
    delete el.dataset.sceneManaged
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

    // 1. Cleanup disconnected roots (Fix Memory Leak)
    mountedRoots.forEach((root, el) => {
      if (!el.isConnected) {
        root.unmount()
        mountedRoots.delete(el)
        console.log('[WebflowTres] Auto-unmounted disconnected root', el)
      }
    })

    // 2. Check for new nodes
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
