import { Layer, Line, Circle, Arrow, Group, Text } from 'react-konva'
import { Shot, Point } from '../types'
import { catmullRomToBezier, sampleBezierPath } from '../utils/spline'

interface ShotLayerProps {
  shots: Shot[]
  offsetX: number
  offsetY: number
  selectedShotId?: string | null
  onShotClick?: (shot: Shot) => void
  onControlPointDragEnd?: (shotId: string, pointIndex: number, x: number, y: number) => void
  interactive?: boolean
}

export function ShotLayer({
  shots, offsetX, offsetY, selectedShotId, onShotClick, onControlPointDragEnd, interactive = false
}: ShotLayerProps) {
  return (
    <Layer x={offsetX} y={offsetY}>
      {shots.map((shot) => {
        const isSelected = shot.id === selectedShotId
        const color = shot.color || '#FFFF00'

        if (shot.type === 'straight' && shot.points.length >= 2) {
          const start = shot.points[0]
          const end = shot.points[shot.points.length - 1]
          return (
            <Group key={shot.id}>
              <Arrow
                points={[start.x, start.y, end.x, end.y]}
                stroke={color}
                strokeWidth={isSelected ? 3 : 2}
                fill={color}
                pointerLength={8}
                pointerWidth={6}
                dash={isSelected ? undefined : [8, 4]}
                onClick={() => onShotClick?.(shot)}
                onTap={() => onShotClick?.(shot)}
              />
              {shot.label && (
                <Text
                  x={(start.x + end.x) / 2}
                  y={(start.y + end.y) / 2 - 14}
                  text={shot.label}
                  fontSize={11}
                  fill={color}
                  align="center"
                />
              )}
            </Group>
          )
        }

        if (shot.type === 'curve' && shot.points.length >= 2) {
          const bezierSegments = catmullRomToBezier(shot.points)
          const curvePoints = sampleBezierPath(bezierSegments, 30)
          const flatPoints = curvePoints.flatMap((p: Point) => [p.x, p.y])

          return (
            <Group key={shot.id}>
              <Line
                points={flatPoints}
                stroke={color}
                strokeWidth={isSelected ? 3 : 2}
                dash={isSelected ? undefined : [8, 4]}
                onClick={() => onShotClick?.(shot)}
                onTap={() => onShotClick?.(shot)}
              />
              {/* Arrow head at end */}
              {curvePoints.length >= 2 && (
                <Arrow
                  points={[
                    curvePoints[curvePoints.length - 2].x,
                    curvePoints[curvePoints.length - 2].y,
                    curvePoints[curvePoints.length - 1].x,
                    curvePoints[curvePoints.length - 1].y,
                  ]}
                  stroke={color}
                  fill={color}
                  pointerLength={8}
                  pointerWidth={6}
                  strokeWidth={0}
                />
              )}
              {/* Control point handles (only when selected and interactive) */}
              {isSelected && interactive && shot.points.map((pt, i) => (
                <Circle
                  key={`cp-${shot.id}-${i}`}
                  x={pt.x}
                  y={pt.y}
                  radius={5}
                  fill={i === 0 || i === shot.points.length - 1 ? color : '#FFF'}
                  stroke={color}
                  strokeWidth={1}
                  draggable
                  onDragEnd={(e) => {
                    const pos = e.target.position()
                    onControlPointDragEnd?.(shot.id, i, pos.x, pos.y)
                  }}
                />
              ))}
              {shot.label && (
                <Text
                  x={shot.points[0].x}
                  y={shot.points[0].y - 14}
                  text={shot.label}
                  fontSize={11}
                  fill={color}
                />
              )}
            </Group>
          )
        }

        return null
      })}
    </Layer>
  )
}
