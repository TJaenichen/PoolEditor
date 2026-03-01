import { Point, Ball, SimulationSegment, SimulationResult, BallTrajectory, PhysicsResult, TABLE } from '../types'

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

// ---------------------------------------------------------------------------
// Event-based physics simulation with ball-ball collisions
// ---------------------------------------------------------------------------

const INITIAL_SPEED = 500
const SPEED_THRESHOLD = 0.5
const MAX_EVENTS = 500
const R = TABLE.BALL_RADIUS
const R2 = R * 2 // collision distance (sum of radii)

interface BallState {
  id: string
  number: number
  x: number
  y: number
  vx: number
  vy: number
  active: boolean // still on table (not pocketed)
  segments: SimulationSegment[]
  startX: number // segment start
  startY: number
}

function findWallTime(pos: number, vel: number, min: number, max: number): number {
  if (vel > 0) {
    const t = (max - R - pos) / vel
    if (t > 0.0001) return t
  } else if (vel < 0) {
    const t = (min + R - pos) / vel
    if (t > 0.0001) return t
  }
  return Infinity
}

function findBallCollisionTime(
  x1: number, y1: number, vx1: number, vy1: number,
  x2: number, y2: number, vx2: number, vy2: number,
): number {
  const dpx = x1 - x2
  const dpy = y1 - y2
  const dvx = vx1 - vx2
  const dvy = vy1 - vy2

  const a = dvx * dvx + dvy * dvy
  if (a < 1e-12) return Infinity // no relative motion
  const b = 2 * (dpx * dvx + dpy * dvy)
  const c = dpx * dpx + dpy * dpy - R2 * R2

  const disc = b * b - 4 * a * c
  if (disc < 0) return Infinity

  const sqrtDisc = Math.sqrt(disc)
  const t = (-b - sqrtDisc) / (2 * a)
  if (t > 0.0001) return t
  return Infinity
}

function findPocketTime(
  x: number, y: number, vx: number, vy: number,
  pockets: Point[],
): { time: number; pocketIdx: number } {
  let best = Infinity
  let bestIdx = -1

  for (let i = 0; i < pockets.length; i++) {
    const px = pockets[i].x
    const py = pockets[i].y
    // Solve ||pos(t) - pocket|| = POCKET_RADIUS
    const dpx = x - px
    const dpy = y - py
    const a = vx * vx + vy * vy
    if (a < 1e-12) continue
    const b = 2 * (dpx * vx + dpy * vy)
    const c = dpx * dpx + dpy * dpy - TABLE.POCKET_RADIUS * TABLE.POCKET_RADIUS

    // If already inside pocket radius, capture immediately
    if (c <= 0) {
      if (best > 0) { best = 0; bestIdx = i }
      continue
    }

    const disc = b * b - 4 * a * c
    if (disc < 0) continue
    const sqrtDisc = Math.sqrt(disc)
    const t = (-b - sqrtDisc) / (2 * a)
    if (t > -0.001 && t < best) {
      best = Math.max(0, t)
      bestIdx = i
    }
  }

  return { time: best, pocketIdx: bestIdx }
}

export function simulatePhysics(
  startPos: Point,
  angleDeg: number,
  balls: Ball[],
  options: { friction: number; pocketsEnabled: boolean; maxEvents?: number },
): PhysicsResult {
  const { friction, pocketsEnabled, maxEvents = MAX_EVENTS } = options
  const angleRad = (angleDeg * Math.PI) / 180

  // Initialize ball states — cue ball gets velocity, others are stationary
  const states: BallState[] = []

  // Cue ball (the one being shot from startPos)
  states.push({
    id: '__cue__',
    number: -1,
    x: startPos.x,
    y: startPos.y,
    vx: Math.cos(angleRad) * INITIAL_SPEED,
    vy: -Math.sin(angleRad) * INITIAL_SPEED, // canvas Y flipped
    active: true,
    segments: [],
    startX: startPos.x,
    startY: startPos.y,
  })

  // Other balls on the table
  for (const ball of balls) {
    states.push({
      id: ball.id,
      number: ball.number,
      x: ball.position.x,
      y: ball.position.y,
      vx: 0,
      vy: 0,
      active: true,
      segments: [],
      startX: ball.position.x,
      startY: ball.position.y,
    })
  }

  const pocketedIds: string[] = []
  // Friction decay factor per unit time
  const frictionDecay = friction * 2 // scale friction slider to reasonable range

  for (let event = 0; event < maxEvents; event++) {
    // Check if any ball is still moving
    const anyMoving = states.some(
      (s) => s.active && (Math.abs(s.vx) > SPEED_THRESHOLD || Math.abs(s.vy) > SPEED_THRESHOLD),
    )
    if (!anyMoving) break

    // Find next event
    let minTime = Infinity
    let eventType: 'wall_x' | 'wall_y' | 'ball' | 'pocket' | 'stop' = 'stop'
    let eventBallIdx = -1
    let eventBall2Idx = -1
    // eventPocketIdx not needed — pocket is processed by removing the ball

    for (let i = 0; i < states.length; i++) {
      const s = states[i]
      if (!s.active) continue
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy)
      if (speed < SPEED_THRESHOLD) continue

      // Wall collisions
      const txMin = findWallTime(s.x, s.vx, 0, TABLE.WIDTH)
      const tyMin = findWallTime(s.y, s.vy, 0, TABLE.HEIGHT)

      if (txMin < minTime) {
        minTime = txMin; eventType = 'wall_x'; eventBallIdx = i
      }
      if (tyMin < minTime) {
        minTime = tyMin; eventType = 'wall_y'; eventBallIdx = i
      }

      // Ball-ball collisions
      for (let j = i + 1; j < states.length; j++) {
        if (!states[j].active) continue
        const t = findBallCollisionTime(
          s.x, s.y, s.vx, s.vy,
          states[j].x, states[j].y, states[j].vx, states[j].vy,
        )
        if (t < minTime) {
          minTime = t; eventType = 'ball'; eventBallIdx = i; eventBall2Idx = j
        }
      }

      // Pocket detection
      if (pocketsEnabled) {
        const pt = findPocketTime(s.x, s.y, s.vx, s.vy, TABLE.POCKETS)
        if (pt.time < minTime) {
          minTime = pt.time; eventType = 'pocket'; eventBallIdx = i
        }
      }

      // Stop time (friction brings speed to threshold)
      if (frictionDecay > 0) {
        // speed * e^(-decay * t) = threshold
        // t = -ln(threshold / speed) / decay
        const tStop = Math.log(speed / SPEED_THRESHOLD) / frictionDecay
        if (tStop > 0 && tStop < minTime) {
          minTime = tStop; eventType = 'stop'; eventBallIdx = i
        }
      }
    }

    if (!isFinite(minTime) || minTime <= 0) break

    // Cap time step to prevent huge leaps
    minTime = Math.min(minTime, 10)

    // Advance all balls
    for (const s of states) {
      if (!s.active) continue
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy)
      if (speed < SPEED_THRESHOLD) continue

      s.x += s.vx * minTime
      s.y += s.vy * minTime

      // Record segment if ball moved meaningfully
      const dx = s.x - s.startX
      const dy = s.y - s.startY
      if (dx * dx + dy * dy > 1) {
        s.segments.push({ start: { x: s.startX, y: s.startY }, end: { x: s.x, y: s.y } })
        s.startX = s.x
        s.startY = s.y
      }
    }

    // Apply friction (exponential decay)
    if (frictionDecay > 0) {
      const decay = Math.exp(-frictionDecay * minTime)
      for (const s of states) {
        if (!s.active) continue
        s.vx *= decay
        s.vy *= decay
      }
    }

    // Process event
    if (eventType === 'wall_x' && eventBallIdx >= 0) {
      const s = states[eventBallIdx]
      s.vx = -s.vx
      // Clamp position to table bounds
      s.x = Math.max(R, Math.min(TABLE.WIDTH - R, s.x))
      s.startX = s.x; s.startY = s.y
    } else if (eventType === 'wall_y' && eventBallIdx >= 0) {
      const s = states[eventBallIdx]
      s.vy = -s.vy
      s.y = Math.max(R, Math.min(TABLE.HEIGHT - R, s.y))
      s.startX = s.x; s.startY = s.y
    } else if (eventType === 'ball' && eventBallIdx >= 0 && eventBall2Idx >= 0) {
      const b1 = states[eventBallIdx]
      const b2 = states[eventBall2Idx]
      // Elastic collision for equal masses
      const nx = b2.x - b1.x
      const ny = b2.y - b1.y
      const dist = Math.sqrt(nx * nx + ny * ny)
      if (dist > 0) {
        const ux = nx / dist
        const uy = ny / dist
        const dvx = b1.vx - b2.vx
        const dvy = b1.vy - b2.vy
        const dot = dvx * ux + dvy * uy
        if (dot > 0) { // only if approaching
          b1.vx -= dot * ux
          b1.vy -= dot * uy
          b2.vx += dot * ux
          b2.vy += dot * uy
        }
      }
      // Record segment starts at collision point
      b1.startX = b1.x; b1.startY = b1.y
      b2.startX = b2.x; b2.startY = b2.y
    } else if (eventType === 'pocket' && eventBallIdx >= 0) {
      const s = states[eventBallIdx]
      // Finish last segment
      if (s.startX !== s.x || s.startY !== s.y) {
        s.segments.push({ start: { x: s.startX, y: s.startY }, end: { x: s.x, y: s.y } })
      }
      s.active = false
      s.vx = 0; s.vy = 0
      pocketedIds.push(s.id)
    } else if (eventType === 'stop' && eventBallIdx >= 0) {
      const s = states[eventBallIdx]
      // Finish last segment
      if (s.startX !== s.x || s.startY !== s.y) {
        s.segments.push({ start: { x: s.startX, y: s.startY }, end: { x: s.x, y: s.y } })
      }
      s.vx = 0; s.vy = 0
      s.startX = s.x; s.startY = s.y
    }
  }

  // Flush remaining segments for any still-moving balls
  for (const s of states) {
    const dx = s.x - s.startX
    const dy = s.y - s.startY
    if (dx * dx + dy * dy > 1) {
      s.segments.push({ start: { x: s.startX, y: s.startY }, end: { x: s.x, y: s.y } })
    }
  }

  // Build result — only include balls that actually moved
  const ballPaths: BallTrajectory[] = states
    .filter((s) => s.segments.length > 0)
    .map((s) => ({
      ballId: s.id,
      ballNumber: s.number,
      segments: s.segments,
      pocketed: pocketedIds.includes(s.id),
      finalPosition: { x: s.x, y: s.y },
    }))

  return { ballPaths, pocketedBalls: pocketedIds }
}
