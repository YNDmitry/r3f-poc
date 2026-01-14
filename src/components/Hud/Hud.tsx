import './Hud.css'

interface HudProps {
  item: {
    label: string
    position: [number, number, number] | readonly [number, number, number]
  }
}

export function Hud({ item }: HudProps) {
  // Determine if we should mirror the HUD (for items on the left side)
  // Assuming X < 0 means left side relative to center
  const isMirrored = item.position[0] < 0

  return (
    <div className={`jenka-tech-hud ${isMirrored ? 'is-mirrored' : ''}`}>
      <div className="hud-box">{item.label}</div>
      <svg className="hud-leader" viewBox="0 0 400 40">
        <path d="M400 40 L70 40 L20 0 H0" />
      </svg>
    </div>
  )
}
