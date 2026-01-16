import { useState, useEffect } from 'react'
import { useDevice } from '../../hooks/useDevice'
import './Hud.css'

export function SwipeHint() {
  const device = useDevice()
  const [visible, setVisible] = useState(true)
  const [active, setActive] = useState(false)

  useEffect(() => {
    // Small delay before activating listeners to avoid capturing the initial click
    const timer = setTimeout(() => setActive(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!active) return

    const handleInteract = () => {
      setVisible(false)
    }

    window.addEventListener('pointerdown', handleInteract)
    window.addEventListener('touchstart', handleInteract)
    window.addEventListener('wheel', handleInteract)

    return () => {
      window.removeEventListener('pointerdown', handleInteract)
      window.removeEventListener('touchstart', handleInteract)
      window.removeEventListener('wheel', handleInteract)
    }
  }, [active])

  // Only show on mobile and tablet, and only if user hasn't interacted yet
  if (!visible || device === 'desktop') return null

  return (
    <div className="swipe-hint-container">
      <div
        style={{
          opacity: 0.9,
          animation: 'hint-pulse 2.5s infinite',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'none',
        }}
      >
        <svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="white"
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))',
            animation: 'hand-swipe 2s ease-in-out infinite',
          }}
        >
          <path d="M9,11.24V7.5C9,6.12,10.12,5,11.5,5S14,6.12,14,7.5v3.74c1.21-0.81,2-2.18,2-3.74c0-2.49-2.01-4.5-4.5-4.5S7,5.01,7,7.5 c0,1.56,0.79,2.93,2,3.74z M17.47,13.79c-0.18-0.54-0.65-0.93-1.22-1.02l-3.32-0.51c-0.34-0.05-0.68,0.03-0.97,0.22l-0.58,0.38 l-3.14-3.14c-0.29-0.29-0.77-0.29-1.06,0l-0.35,0.35c-0.29,0.29-0.29,0.77,0,1.06l3.41,3.41c0.16,0.16,0.23,0.39,0.18,0.61 l-0.67,3.15c-0.06,0.27,0.02,0.55,0.21,0.75l3.86,3.86c0.39,0.39,1.02,0.39,1.41,0l3.18-3.18C18.67,19.49,18.82,17.75,17.47,13.79z" />
        </svg>
        <span
          style={{
            color: 'white',
            fontFamily: 'sans-serif',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '2px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            opacity: 0.9,
            textAlign: 'center',
            textTransform: 'uppercase'
          }}
        >
          Swipe to Rotate
        </span>
      </div>
    </div>
  )
}
