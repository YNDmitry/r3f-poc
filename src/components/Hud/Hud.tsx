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
      <div className="hud-box">
        {item.label}
      </div>
      <svg 
        className="hud-leader" 
        viewBox="0 0 200 40" 
        preserveAspectRatio="none"
      >
        <path 
          d="M200 40 L70 40 L20 0 H0" 
          vectorEffect="non-scaling-stroke" 
        />
        <g className="hud-marker">
          <circle cx="200" cy="40" r="1.5" />
          <circle
            cx="200"
            cy="40"
            r="3.5"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
            opacity="0.6"
          />
        </g>
      </svg>
    </div>
  )
}
