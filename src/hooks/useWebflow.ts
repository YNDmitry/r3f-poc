import { useCallback } from 'react'

interface WebflowWindow extends Window {
  Webflow?: {
    require?: (module: string) => any
  }
}

export function useWebflow(container?: HTMLElement | null) {
  const trigger = useCallback(
    (eventName: string = 'From canvas') => {
      if (typeof window === 'undefined') {
        return
      }

      // 1. Native DOM Event (Standard)
      const evtData = {
        detail: { name: eventName },
        bubbles: true,
        cancelable: true,
      }
      const customEvt = new CustomEvent('jenka-event', evtData)

      if (container) {
        container.dispatchEvent(customEvt)
      }
      document.dispatchEvent(new CustomEvent('jenka-event', evtData))

      // 2. Webflow IX2/IX3 API Integration
      const wf = (window as unknown as WebflowWindow).Webflow
      if (wf && wf.require) {
        try {
          // IX3 Support (Newer Webflow API)
          const ix3 = wf.require('ix3')
          if (ix3 && typeof ix3.emit === 'function') {
            ix3.emit(eventName)
            return
          }
        } catch (err) {
          console.warn('Webflow interaction trigger failed:', err)
        }
      }
    },
    [container]
  )

  return { trigger }
}
