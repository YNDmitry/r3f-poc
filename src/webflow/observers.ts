// Efficient shared observers to minimize overhead
// We only need ONE ResizeObserver and ONE IntersectionObserver for the entire page.

type ResizeCallback = (entry: ResizeObserverEntry) => void
type IntersectionCallback = (entry: IntersectionObserverEntry) => void

const resizeCallbacks = new Map<Element, ResizeCallback>()
const intersectCallbacks = new Map<Element, IntersectionCallback>()

let resizeObserver: ResizeObserver | null = null
let intersectObserver: IntersectionObserver | null = null

function ensureResizeObserver() {
  if (resizeObserver) {
    return
  }
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const cb = resizeCallbacks.get(entry.target)
      if (cb) {
        cb(entry)
      }
    }
  })
}

function ensureIntersectObserver() {
  if (intersectObserver) {
    return
  }
  intersectObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const cb = intersectCallbacks.get(entry.target)
        if (cb) {
          cb(entry)
        }
      }
    },
    { root: null, rootMargin: '200px 0px', threshold: [0, 0.1] },
  )
}

export const SharedObserver = {
  observeResize(el: Element, cb: ResizeCallback) {
    ensureResizeObserver()
    resizeCallbacks.set(el, cb)
    resizeObserver!.observe(el)
  },

  unobserveResize(el: Element) {
    if (!resizeObserver) {
      return
    }
    resizeCallbacks.delete(el)
    resizeObserver.unobserve(el)
  },

  observeIntersection(el: Element, cb: IntersectionCallback) {
    ensureIntersectObserver()
    intersectCallbacks.set(el, cb)
    intersectObserver!.observe(el)
  },

  unobserveIntersection(el: Element) {
    if (!intersectObserver) {
      return
    }
    intersectCallbacks.delete(el)
    intersectObserver.unobserve(el)
  },
}
