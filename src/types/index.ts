import type React from 'react'

export interface Point {
  x: number
  y: number
}

export interface Ball {
  id: string
  number: number   // 0 = cue, 1–15 = standard
  position: Point
}

export interface Cue {
  position: Point
  angle: number   // degrees, 0 = right, counter-clockwise
}

export interface Shot {
  id: string
  type: 'straight' | 'curve'
  points: Point[]  // [start, ...controlPoints, end]
  spin?: {
    top: number    // -1 to 1
    side: number   // -1 to 1
  }
  color?: string
  label?: string
}

export interface Area {
  id: string
  type: 'triangle' | 'rectangle' | 'polygon'
  points: Point[]
  fill?: string
  stroke?: string
  opacity?: number
  label?: string
}

export type Tool =
  | 'select'
  | 'place-ball'
  | 'place-cue'
  | 'shot-straight'
  | 'shot-curve'
  | 'draw-area'
  | 'eraser'

export interface PoolTableState {
  version: '1'
  balls: Ball[]
  cue?: Cue
  shots: Shot[]
  areas: Area[]
}

export interface SimulationSegment {
  start: Point
  end: Point
}

export interface SimulationResult {
  segments: SimulationSegment[]
  bounceCount: number
}

export interface PoolEditorProps {
  initialState?: Partial<PoolTableState>
  onChange?: (state: PoolTableState) => void
  readOnly?: boolean
  width?: number | string
  height?: number | string
  simulationBounces?: number
  className?: string
  style?: React.CSSProperties
}

// Standard ball colors
export const BALL_COLORS: Record<number, { fill: string; stripe: boolean }> = {
  0:  { fill: '#FFFFFF', stripe: false },  // cue
  1:  { fill: '#FFD700', stripe: false },  // yellow
  2:  { fill: '#0000FF', stripe: false },  // blue
  3:  { fill: '#FF0000', stripe: false },  // red
  4:  { fill: '#800080', stripe: false },  // purple
  5:  { fill: '#FF8C00', stripe: false },  // orange
  6:  { fill: '#008000', stripe: false },  // green
  7:  { fill: '#800000', stripe: false },  // maroon
  8:  { fill: '#000000', stripe: false },  // black (8-ball)
  9:  { fill: '#FFD700', stripe: true },
  10: { fill: '#0000FF', stripe: true },
  11: { fill: '#FF0000', stripe: true },
  12: { fill: '#800080', stripe: true },
  13: { fill: '#FF8C00', stripe: true },
  14: { fill: '#008000', stripe: true },
  15: { fill: '#800000', stripe: true },
}

// Table constants (inner playing surface dimensions in abstract units)
export const TABLE = {
  WIDTH: 900,
  HEIGHT: 450,
  BALL_RADIUS: 11,
  POCKET_RADIUS: 18,
  RAIL_WIDTH: 30,
  CUSHION_WIDTH: 15,
}
