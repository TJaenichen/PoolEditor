import { Ball, Cue, TABLE } from '../types'

const R = TABLE.BALL_RADIUS
const CX = TABLE.WIDTH * 0.73
const CY = TABLE.HEIGHT * 0.5
const ROW = R * 2 * 0.866  // equilateral triangle row spacing

function ball(id: string, num: number, x: number, y: number): Ball {
  return { id, number: num, position: { x, y } }
}

export function eightBallRack(): { balls: Ball[]; cue: Cue } {
  const balls: Ball[] = [
    ball('cue', 0, TABLE.WIDTH * 0.25, CY),
    ball('b1', 1, CX, CY),
    ball('b2', 2, CX + ROW, CY - R),
    ball('b3', 3, CX + ROW, CY + R),
    ball('b4', 4, CX + ROW * 2, CY - R * 2),
    ball('b8', 8, CX + ROW * 2, CY),
    ball('b5', 5, CX + ROW * 2, CY + R * 2),
    ball('b6', 6, CX + ROW * 3, CY - R * 3),
    ball('b7', 7, CX + ROW * 3, CY - R),
    ball('b9', 9, CX + ROW * 3, CY + R),
    ball('b10', 10, CX + ROW * 3, CY + R * 3),
    ball('b11', 11, CX + ROW * 4, CY - R * 4),
    ball('b12', 12, CX + ROW * 4, CY - R * 2),
    ball('b13', 13, CX + ROW * 4, CY),
    ball('b14', 14, CX + ROW * 4, CY + R * 2),
    ball('b15', 15, CX + ROW * 4, CY + R * 4),
  ]
  const cue: Cue = { position: { x: TABLE.WIDTH * 0.25, y: CY }, angle: 0 }
  return { balls, cue }
}

export function nineBallRack(): { balls: Ball[]; cue: Cue } {
  const balls: Ball[] = [
    ball('cue', 0, TABLE.WIDTH * 0.25, CY),
    ball('b1', 1, CX, CY),
    ball('b2', 2, CX + ROW, CY - R),
    ball('b3', 3, CX + ROW, CY + R),
    ball('b4', 4, CX + ROW * 2, CY - R * 2),
    ball('b9', 9, CX + ROW * 2, CY),
    ball('b5', 5, CX + ROW * 2, CY + R * 2),
    ball('b6', 6, CX + ROW * 3, CY - R),
    ball('b7', 7, CX + ROW * 3, CY + R),
    ball('b8', 8, CX + ROW * 4, CY),
  ]
  const cue: Cue = { position: { x: TABLE.WIDTH * 0.25, y: CY }, angle: 0 }
  return { balls, cue }
}
