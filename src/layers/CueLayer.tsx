import { Layer, Line, Circle } from 'react-konva'
import { Cue, TABLE } from '../types'

interface CueLayerProps {
  cue?: Cue
  offsetX: number
  offsetY: number
  onDragEnd?: (x: number, y: number) => void
  onAngleChange?: (angle: number) => void
  draggable?: boolean
}

const CUE_LENGTH = 180
const CUE_TIP_WIDTH = 2
const CUE_BUTT_WIDTH = 6

export function CueLayer({ cue, offsetX, offsetY, onDragEnd, onAngleChange, draggable = false }: CueLayerProps) {
  if (!cue) return null

  const angleRad = (cue.angle * Math.PI) / 180
  const cos = Math.cos(angleRad)
  const sin = -Math.sin(angleRad) // canvas Y flipped

  // Tip is at cue position, butt extends backwards
  const tipX = cue.position.x
  const tipY = cue.position.y
  const buttX = tipX - cos * CUE_LENGTH
  const buttY = tipY - sin * CUE_LENGTH

  // Drag handle at butt end to rotate
  const handleX = tipX - cos * (CUE_LENGTH + 15)
  const handleY = tipY - sin * (CUE_LENGTH + 15)

  return (
    <Layer x={offsetX} y={offsetY}>
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
      {/* Rotation handle at butt */}
      <Circle
        x={handleX}
        y={handleY}
        radius={8}
        fill="rgba(255,255,255,0.3)"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth={1}
        draggable={draggable}
        onDragMove={(e) => {
          if (!onAngleChange) return
          const stage = e.target.getStage()
          if (!stage) return
          const pointer = stage.getPointerPosition()
          if (!pointer) return
          const dx = pointer.x - offsetX - tipX
          const dy = pointer.y - offsetY - tipY
          const newAngle = (-Math.atan2(dy, dx) * 180) / Math.PI
          onAngleChange(newAngle)
          // Reset handle position (angle-only control)
          e.target.position({ x: handleX, y: handleY })
        }}
        onDragEnd={(e) => {
          // Reset position after angle change
          e.target.position({ x: handleX, y: handleY })
        }}
      />
      {/* Main cue position drag */}
      {draggable && (
        <Circle
          x={tipX}
          y={tipY}
          radius={TABLE.BALL_RADIUS + 4}
          fill="transparent"
          draggable
          onDragEnd={(e) => {
            const pos = e.target.position()
            onDragEnd?.(pos.x, pos.y)
          }}
        />
      )}
    </Layer>
  )
}
