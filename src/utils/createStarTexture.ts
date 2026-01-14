import { CanvasTexture } from 'three'

export function createStarTexture() {
  if (typeof document === 'undefined') {
    return new CanvasTexture(new OffscreenCanvas(64, 64) as unknown as HTMLCanvasElement)
  }
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return new CanvasTexture(canvas)
  }

  const cx = 128
  const cy = 128

  // 1. Clear
  ctx.clearRect(0, 0, 256, 256)

  // 2. Soft Glow Center
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60)
  glow.addColorStop(0, 'rgba(255, 255, 255, 1)')
  glow.addColorStop(0.2, 'rgba(255, 255, 255, 0.4)')
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 256, 256)

  // 3. Draw Cross Beams (Lens Flare style)
  // Helper to draw a tapered beam
  const drawBeam = (angle: number, length: number, width: number) => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, length)
    grd.addColorStop(0, 'rgba(255, 255, 255, 1)')
    grd.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)')
    grd.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = grd
    
    // Draw a long thin ellipse/diamond shape
    ctx.beginPath()
    ctx.moveTo(-width / 2, 0)
    ctx.quadraticCurveTo(0, width, length, 0) // Tip
    ctx.quadraticCurveTo(0, -width, -width / 2, 0) // Back
    ctx.fill()
    
    // Draw opposite side
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.quadraticCurveTo(0, width, -length, 0)
    ctx.quadraticCurveTo(0, -width, width / 2, 0)
    ctx.fill()
    
    ctx.restore()
  }

  // Draw Vertical Beam
  drawBeam(Math.PI / 2, 110, 6)
  
  // Draw Horizontal Beam
  drawBeam(0, 110, 6)

  // 4. Bright Core
  ctx.beginPath()
  ctx.arc(cx, cy, 4, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 1)'
  ctx.fill()

  const tex = new CanvasTexture(canvas)
  return tex
}
