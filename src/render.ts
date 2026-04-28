import type { Body, FocusId, Probe, Vec } from './sim.ts'

export interface CameraState {
  center: Vec
  zoom: number
}

export interface StarParticle {
  x: number
  y: number
  radius: number
  alpha: number
  tint: string
}

export interface RenderOptions {
  width: number
  height: number
  showTrails: boolean
  showPrediction: boolean
  prediction: Vec[]
  burnVector: Vec
  highlightId: FocusId
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createStarfield(count = 160): StarParticle[] {
  const random = mulberry32(84_271)
  const stars: StarParticle[] = []

  for (let index = 0; index < count; index += 1) {
    const hue = 180 + random() * 40
    stars.push({
      x: random(),
      y: random(),
      radius: 0.4 + random() * 1.8,
      alpha: 0.18 + random() * 0.52,
      tint: `hsla(${hue}, 70%, 88%, ${0.25 + random() * 0.5})`,
    })
  }

  return stars
}

function worldToScreen(point: Vec, camera: CameraState, width: number, height: number, pixelsPerUnit: number): Vec {
  return {
    x: width / 2 + (point.x - camera.center.x) * pixelsPerUnit,
    y: height / 2 - (point.y - camera.center.y) * pixelsPerUnit,
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, stars: StarParticle[]): void {
  const backdrop = ctx.createLinearGradient(0, 0, width, height)
  backdrop.addColorStop(0, '#07121f')
  backdrop.addColorStop(0.55, '#10263c')
  backdrop.addColorStop(1, '#122f39')
  ctx.fillStyle = backdrop
  ctx.fillRect(0, 0, width, height)

  const bloom = ctx.createRadialGradient(width * 0.82, height * 0.12, 10, width * 0.82, height * 0.12, width * 0.72)
  bloom.addColorStop(0, 'rgba(247, 194, 126, 0.32)')
  bloom.addColorStop(0.35, 'rgba(58, 127, 134, 0.16)')
  bloom.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = bloom
  ctx.fillRect(0, 0, width, height)

  for (const star of stars) {
    ctx.beginPath()
    ctx.fillStyle = star.tint
    ctx.globalAlpha = star.alpha
    ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.strokeStyle = 'rgba(174, 219, 223, 0.07)'
  ctx.lineWidth = 1
  const spacing = 68

  for (let x = 0; x <= width; x += spacing) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y <= height; y += spacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  points: Vec[],
  color: string,
  camera: CameraState,
  width: number,
  height: number,
  pixelsPerUnit: number,
  lineWidth: number,
): void {
  if (points.length < 2) {
    return
  }

  ctx.beginPath()
  for (let index = 0; index < points.length; index += 1) {
    const point = worldToScreen(points[index], camera, width, height, pixelsPerUnit)
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  }
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

function drawPrediction(
  ctx: CanvasRenderingContext2D,
  prediction: Vec[],
  camera: CameraState,
  width: number,
  height: number,
  pixelsPerUnit: number,
): void {
  if (prediction.length < 2) {
    return
  }

  ctx.save()
  ctx.beginPath()
  for (let index = 0; index < prediction.length; index += 1) {
    const point = worldToScreen(prediction[index], camera, width, height, pixelsPerUnit)
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  }
  ctx.setLineDash([8, 7])
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(255, 242, 214, 0.72)'
  ctx.stroke()
  ctx.restore()
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  body: Body,
  camera: CameraState,
  width: number,
  height: number,
  pixelsPerUnit: number,
  highlighted: boolean,
): void {
  const screen = worldToScreen(body.position, camera, width, height, pixelsPerUnit)
  const radius = Math.max(3, body.radius * pixelsPerUnit)

  ctx.save()
  ctx.shadowBlur = highlighted ? 26 : 18
  ctx.shadowColor = body.glow
  ctx.fillStyle = body.color
  ctx.beginPath()
  ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2)
  ctx.fill()

  if (highlighted) {
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255, 245, 221, 0.92)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screen.x, screen.y, radius + 8, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(236, 245, 248, 0.88)'
  ctx.font = '600 13px "Space Grotesk", sans-serif'
  ctx.fillText(body.name, screen.x + radius + 8, screen.y - radius - 6)
  ctx.restore()
}

function drawProbe(
  ctx: CanvasRenderingContext2D,
  probe: Probe,
  camera: CameraState,
  width: number,
  height: number,
  pixelsPerUnit: number,
  highlighted: boolean,
): void {
  const screen = worldToScreen(probe.position, camera, width, height, pixelsPerUnit)
  const size = Math.max(5, probe.radius * pixelsPerUnit * 1.3)

  ctx.save()
  ctx.translate(screen.x, screen.y)
  ctx.rotate(Math.atan2(-probe.velocity.y, probe.velocity.x))
  ctx.shadowBlur = highlighted ? 18 : 12
  ctx.shadowColor = probe.glow
  ctx.fillStyle = probe.color
  ctx.beginPath()
  ctx.moveTo(size, 0)
  ctx.lineTo(-size * 0.9, size * 0.55)
  ctx.lineTo(-size * 0.45, 0)
  ctx.lineTo(-size * 0.9, -size * 0.55)
  ctx.closePath()
  ctx.fill()

  if (highlighted) {
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255, 244, 212, 0.9)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, size + 8, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.restore()
  ctx.fillStyle = 'rgba(255, 243, 229, 0.9)'
  ctx.font = '600 12px "Space Grotesk", sans-serif'
  ctx.fillText(probe.name, screen.x + size + 8, screen.y + size + 16)
}

function drawBurnVector(
  ctx: CanvasRenderingContext2D,
  probe: Probe,
  burnVector: Vec,
  camera: CameraState,
  width: number,
  height: number,
  pixelsPerUnit: number,
): void {
  const magnitude = Math.hypot(burnVector.x, burnVector.y)
  if (magnitude <= 0.001) {
    return
  }

  const screen = worldToScreen(probe.position, camera, width, height, pixelsPerUnit)
  const direction = { x: burnVector.x / magnitude, y: burnVector.y / magnitude }
  const arrowLength = 24 + magnitude * 12
  const end = {
    x: screen.x + direction.x * arrowLength,
    y: screen.y - direction.y * arrowLength,
  }

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 153, 112, 0.95)'
  ctx.fillStyle = 'rgba(255, 153, 112, 0.95)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(screen.x, screen.y)
  ctx.lineTo(end.x, end.y)
  ctx.stroke()

  const angle = Math.atan2(end.y - screen.y, end.x - screen.x)
  ctx.translate(end.x, end.y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-10, 5)
  ctx.lineTo(-10, -5)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  stars: StarParticle[],
  bodies: Body[],
  probe: Probe,
  camera: CameraState,
  options: RenderOptions,
): void {
  drawBackground(ctx, options.width, options.height, stars)
  drawGrid(ctx, options.width, options.height)

  const pixelsPerUnit = (Math.min(options.width, options.height) / 760) * camera.zoom

  if (options.showPrediction) {
    drawPrediction(ctx, options.prediction, camera, options.width, options.height, pixelsPerUnit)
  }

  if (options.showTrails) {
    for (const body of bodies) {
      const color = body.id === 'star' ? 'rgba(255, 213, 159, 0.22)' : 'rgba(170, 238, 238, 0.24)'
      drawTrail(ctx, body.trail, color, camera, options.width, options.height, pixelsPerUnit, body.id === 'star' ? 1.3 : 1.8)
    }
    drawTrail(ctx, probe.trail, 'rgba(255, 147, 117, 0.46)', camera, options.width, options.height, pixelsPerUnit, 2)
  }

  for (const body of bodies) {
    drawBody(ctx, body, camera, options.width, options.height, pixelsPerUnit, body.id === options.highlightId)
  }

  drawProbe(ctx, probe, camera, options.width, options.height, pixelsPerUnit, options.highlightId === 'probe')
  drawBurnVector(ctx, probe, options.burnVector, camera, options.width, options.height, pixelsPerUnit)
}
