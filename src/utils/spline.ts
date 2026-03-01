import { Point } from '../types'

export function cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  }
}

export function quadraticBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  }
}

export function catmullRomToBezier(points: Point[], tension = 0.5): Point[][] {
  if (points.length < 2) return []
  const segments: Point[][] = []

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    const d1x = (p2.x - p0.x) * tension
    const d1y = (p2.y - p0.y) * tension
    const d2x = (p3.x - p1.x) * tension
    const d2y = (p3.y - p1.y) * tension

    segments.push([
      p1,
      { x: p1.x + d1x / 3, y: p1.y + d1y / 3 },
      { x: p2.x - d2x / 3, y: p2.y - d2y / 3 },
      p2,
    ])
  }
  return segments
}

export function sampleBezierPath(segments: Point[][], samplesPerSegment = 20): Point[] {
  const result: Point[] = []
  for (const [p0, p1, p2, p3] of segments) {
    for (let i = 0; i <= samplesPerSegment; i++) {
      result.push(cubicBezier(p0, p1, p2, p3, i / samplesPerSegment))
    }
  }
  return result
}

export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}
