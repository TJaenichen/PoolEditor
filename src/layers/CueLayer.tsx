import { Layer, Line, Circle } from 'react-konva'
import { Cue } from '../types'

interface CueLayerProps {
  cue?: Cue
  offsetX: number
  offsetY: number
}

const CUE_LENGTH = 180
const CUE_TIP_WIDTH = 2
const CUE_BUTT_WIDTH = 6

export function CueLayer({ cue, offsetX, offsetY }: CueLayerProps) {
  if (!cue) return null

  const angleRad = (cue.angle * Math.PI) / 180
  const cos = Math.cos(angleRad)
  const sin = -Math.sin(angleRad) // canvas Y flipped

  // Tip is at cue position, butt extends backwards
  const tipX = cue.position.x
  const tipY = cue.position.y
  const buttX = tipX - cos * CUE_LENGTH
  const buttY = tipY - sin * CUE_LENGTH

  return (
    <Layer x={offsetX} y={offsetY} listening={false}>
      {/* Cue shaft */}
      <Line
        points={[tipX, tipY, buttX, buttY]}
        stroke="#d4a56a"
        strokeWidth={CUE_BUTT_WIDTH}
        lineCap="round"
      />
      {/* Ferrule (white tip section) */}
      <Line
        points={[tipX, tipY, tipX - cos * 12, tipY - sin * 12]}
        stroke="#f5f5dc"
        strokeWidth={CUE_TIP_WIDTH + 1}
        lineCap="round"
      />
      {/* Tip (blue chalk) */}
      <Circle x={tipX} y={tipY} radius={CUE_TIP_WIDTH} fill="#4169E1" />
    </Layer>
  )
}
