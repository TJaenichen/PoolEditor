import { Layer, Rect, Circle, Line } from 'react-konva'
import { TABLE } from '../types'

const FELT_COLOR = '#2d6a27'
const RAIL_COLOR = '#5c3317'
const CUSHION_COLOR = '#1a8a1a'
const POCKET_COLOR = '#111'
const DIAMOND_COLOR = '#c8a96e'

// Pocket positions (relative to inner playing surface origin)
const POCKETS = [
  { x: 0, y: 0 },                           // top-left
  { x: TABLE.WIDTH / 2, y: -2 },           // top-center (slightly inset)
  { x: TABLE.WIDTH, y: 0 },                 // top-right
  { x: 0, y: TABLE.HEIGHT },                // bottom-left
  { x: TABLE.WIDTH / 2, y: TABLE.HEIGHT + 2 }, // bottom-center
  { x: TABLE.WIDTH, y: TABLE.HEIGHT },      // bottom-right
]

// Diamond markers along rails
function getDiamonds(): { x: number; y: number }[] {
  const diamonds: { x: number; y: number }[] = []
  for (let i = 1; i <= 3; i++) {
    const xFrac = i / 4
    // Top rail diamonds
    diamonds.push({ x: TABLE.WIDTH * xFrac, y: -TABLE.RAIL_WIDTH / 2 })
    // Bottom rail diamonds
    diamonds.push({ x: TABLE.WIDTH * xFrac, y: TABLE.HEIGHT + TABLE.RAIL_WIDTH / 2 })
  }
  // Along the short rails
  diamonds.push({ x: -TABLE.RAIL_WIDTH / 2, y: TABLE.HEIGHT * 0.25 })
  diamonds.push({ x: -TABLE.RAIL_WIDTH / 2, y: TABLE.HEIGHT * 0.75 })
  diamonds.push({ x: TABLE.WIDTH + TABLE.RAIL_WIDTH / 2, y: TABLE.HEIGHT * 0.25 })
  diamonds.push({ x: TABLE.WIDTH + TABLE.RAIL_WIDTH / 2, y: TABLE.HEIGHT * 0.75 })
  return diamonds
}

interface TableLayerProps {
  offsetX: number
  offsetY: number
}

export function TableLayer({ offsetX, offsetY }: TableLayerProps) {
  const rw = TABLE.RAIL_WIDTH
  const diamonds = getDiamonds()

  return (
    <Layer x={offsetX} y={offsetY}>
      {/* Outer rail frame */}
      <Rect
        x={-rw}
        y={-rw}
        width={TABLE.WIDTH + rw * 2}
        height={TABLE.HEIGHT + rw * 2}
        fill={RAIL_COLOR}
        cornerRadius={8}
      />
      {/* Inner felt */}
      <Rect
        x={0}
        y={0}
        width={TABLE.WIDTH}
        height={TABLE.HEIGHT}
        fill={FELT_COLOR}
      />
      {/* Cushion lines (inner edge of rails) */}
      <Line points={[0, 0, TABLE.WIDTH, 0]} stroke={CUSHION_COLOR} strokeWidth={3} />
      <Line points={[0, TABLE.HEIGHT, TABLE.WIDTH, TABLE.HEIGHT]} stroke={CUSHION_COLOR} strokeWidth={3} />
      <Line points={[0, 0, 0, TABLE.HEIGHT]} stroke={CUSHION_COLOR} strokeWidth={3} />
      <Line points={[TABLE.WIDTH, 0, TABLE.WIDTH, TABLE.HEIGHT]} stroke={CUSHION_COLOR} strokeWidth={3} />
      {/* Head string (dashed line at 25% for cue ball placement) */}
      <Line
        points={[TABLE.WIDTH * 0.25, 0, TABLE.WIDTH * 0.25, TABLE.HEIGHT]}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
        dash={[6, 6]}
      />
      {/* Foot spot */}
      <Circle x={TABLE.WIDTH * 0.73} y={TABLE.HEIGHT / 2} radius={3} fill="rgba(255,255,255,0.3)" />
      {/* Pockets */}
      {POCKETS.map((p, i) => (
        <Circle
          key={`pocket-${i}`}
          x={p.x}
          y={p.y}
          radius={TABLE.POCKET_RADIUS}
          fill={POCKET_COLOR}
        />
      ))}
      {/* Diamond markers */}
      {diamonds.map((d, i) => (
        <Circle
          key={`diamond-${i}`}
          x={d.x}
          y={d.y}
          radius={3}
          fill={DIAMOND_COLOR}
        />
      ))}
    </Layer>
  )
}
