import { Point, SimulationSegment, SimulationResult, TABLE } from '../types'

export function computeTrajectory(
  start: Point,
  angleDeg: number,
  maxBounces: number
): SimulationResult {
  const segments: SimulationSegment[] = []
  const angleRad = (angleDeg * Math.PI) / 180
  let dx = Math.cos(angleRad)
  let dy = -Math.sin(angleRad)  // canvas Y is flipped
  let cx = start.x
  let cy = start.y

  const minX = 0
  const maxX = TABLE.WIDTH
  const minY = 0
  const maxY = TABLE.HEIGHT

  for (let bounce = 0; bounce <= maxBounces; bounce++) {
    let tMin = Infinity

    if (dx > 0) { const t = (maxX - cx) / dx; if (t > 0.001 && t < tMin) tMin = t }
    if (dx < 0) { const t = (minX - cx) / dx; if (t > 0.001 && t < tMin) tMin = t }
    if (dy > 0) { const t = (maxY - cy) / dy; if (t > 0.001 && t < tMin) tMin = t }
    if (dy < 0) { const t = (minY - cy) / dy; if (t > 0.001 && t < tMin) tMin = t }

    if (!isFinite(tMin)) break

    const endX = cx + dx * tMin
    const endY = cy + dy * tMin

    segments.push({ start: { x: cx, y: cy }, end: { x: endX, y: endY } })

    const hitRight = Math.abs(endX - maxX) < 0.01
    const hitLeft = Math.abs(endX - minX) < 0.01
    const hitBottom = Math.abs(endY - maxY) < 0.01
    const hitTop = Math.abs(endY - minY) < 0.01

    if (hitLeft || hitRight) dx = -dx
    if (hitTop || hitBottom) dy = -dy

    cx = endX
    cy = endY
  }

  return { segments, bounceCount: Math.max(0, segments.length - 1) }
}
