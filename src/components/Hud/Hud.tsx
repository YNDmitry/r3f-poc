import './Hud.css'

interface HudProps {
  item: {
    label: string
    position: [number, number, number] | readonly [number, number, number]
    hudWidth?: number | string
  }
}

export function Hud({ item }: HudProps) {
  const isMirrored = item.position[0] < 0

  // Standard width is 15rem, but can be overridden
  const width = item.hudWidth !== undefined ? (typeof item.hudWidth === 'number' ? `${item.hudWidth}rem` : item.hudWidth) : '15rem'

  return (
    <div className={`jenka-tech-hud ${isMirrored ? 'is-mirrored' : ''}`}>
      <div className="hud-box">{item.label}</div>
      <svg 
        className="hud-leader" 
        viewBox="0 0 1000 40" 
        preserveAspectRatio="none"
        style={{ width }}
      >
        {/* 
          Updated Path:
          M 1000 40 : Start at box
          L 150 40  : Horizontal long line
          L 100 0   : Diagonal up (40 units high, 50 units wide)
          L 0 0     : Long horizontal tip (100 units) - the "загибулина"
        */}
        <path d="M1000 40 L150 40 L100 0 L0 0" />
      </svg>
    </div>
  )
}
