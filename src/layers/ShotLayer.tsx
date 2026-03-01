import { Layer, Line, Circle, Arrow, Group, Text } from 'react-konva'
import { Shot, Point, TABLE } from '../types'
import { catmullRomToBezier, sampleBezierPath } from '../utils/spline'
import { computeTrajectory } from '../utils/physics'

interface ShotLayerProps {
  shots: Shot[]
  offsetX: number
  offsetY: number
  selectedShotId?: string | null
  onShotClick?: (shot: Shot) => void
  onShotDblClick?: (shot: Shot) => void
  onControlPointDragMove?: (shotId: string, pointIndex: number, x: number, y: number) => void
  onControlPointDragEnd?: (shotId: string, pointIndex: number, x: number, y: number) => void
  onMidpointDragStart?: (shotId: string) => void
  onMidpointDragMove?: (shotId: string, x: number, y: number) => void
  onMidpointDragEnd?: (shotId: string, x: number, y: number) => void
  interactive?: boolean
  bounces?: number
}

// Compute continuation trajectory from the endpoint of a shot
function shotTrajectory(shot: Shot, curvePoints: Point[] | null, bounces: number) {
  if (bounces <= 0) return null
  let fromPt: Point
  let toPt: Point
  if (shot.type === 'straight' && shot.points.length >= 2) {
    fromPt = shot.points[shot.points.length - 2]
    toPt = shot.points[shot.points.length - 1]
  } else if (curvePoints && curvePoints.length >= 2) {
    fromPt = curvePoints[curvePoints.length - 2]
    toPt = curvePoints[curvePoints.length - 1]
  } else {
    return null
  }
  const dx = toPt.x - fromPt.x
  const dy = toPt.y - fromPt.y
  if (dx === 0 && dy === 0) return null
  const angle = (-Math.atan2(dy, dx) * 180) / Math.PI
  return computeTrajectory(toPt, angle, bounces)
}

export function ShotLayer({
  shots, offsetX, offsetY, selectedShotId, onShotClick, onShotDblClick,
  onControlPointDragMove, onControlPointDragEnd, onMidpointDragStart, onMidpointDragMove, onMidpointDragEnd, interactive = false,
  bounces = 0,
}: ShotLayerProps) {
  return (
    <Layer x={offsetX} y={offsetY}>
      {shots.map((shot) => {
        const isSelected = shot.id === selectedShotId
        const color = shot.color || '#FFFF00'

        if (shot.type === 'straight' && shot.points.length >= 2) {
          const start = shot.points[0]
          const end = shot.points[shot.points.length - 1]
          const midX = (start.x + end.x) / 2
          const midY = (start.y + end.y) / 2
          const traj = shotTrajectory(shot, null, bounces)

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
                onDblClick={() => onShotDblClick?.(shot)}
                onDblTap={() => onShotDblClick?.(shot)}
              />
              {/* Continuation trajectory */}
              {traj && traj.segments.length > 0 && (() => {
                const trajPts: number[] = []
                trajPts.push(traj.segments[0].start.x, traj.segments[0].start.y)
                for (const seg of traj.segments) trajPts.push(seg.end.x, seg.end.y)
                const bouncePts = traj.segments.slice(0, -1).map((seg) => seg.end)
                const lastEnd = traj.segments[traj.segments.length - 1].end
                return (
                  <Group listening={false}>
                    <Line points={trajPts} stroke={color} strokeWidth={1} opacity={0.35} dash={[4, 4]} />
                    {bouncePts.map((pt, i) => (
                      <Circle key={`tb-${shot.id}-${i}`} x={pt.x} y={pt.y} radius={3} fill={color} opacity={0.4} />
                    ))}
                    <Circle x={lastEnd.x} y={lastEnd.y} radius={TABLE.BALL_RADIUS} stroke={color} strokeWidth={1} opacity={0.2} dash={[3, 3]} />
                  </Group>
                )
              })()}
              {/* Midpoint handle — always visible, drag to curve */}
              <Circle
                x={midX}
                y={midY}
                radius={6}
                fill="rgba(255,255,255,0.7)"
                stroke={color}
                strokeWidth={1.5}
                draggable={interactive}
                onDragStart={() => onMidpointDragStart?.(shot.id)}
                onDragMove={(e) => {
                  const pos = e.target.position()
                  onMidpointDragMove?.(shot.id, pos.x, pos.y)
                }}
                onDragEnd={(e) => {
                  const pos = e.target.position()
                  onMidpointDragEnd?.(shot.id, pos.x, pos.y)
                }}
              />
              {/* Endpoint handles when selected */}
              {isSelected && interactive && shot.points.map((pt, i) => (
                <Circle
                  key={`cp-${shot.id}-${i}`}
                  x={pt.x}
                  y={pt.y}
                  radius={5}
                  fill={color}
                  stroke={color}
                  strokeWidth={1}
                  draggable
                  onDragMove={(e) => {
                    const pos = e.target.position()
                    onControlPointDragMove?.(shot.id, i, pos.x, pos.y)
                  }}
                  onDragEnd={(e) => {
                    const pos = e.target.position()
                    onControlPointDragEnd?.(shot.id, i, pos.x, pos.y)
                  }}
                />
              ))}
              {shot.label && (
                <Text
                  x={midX}
                  y={midY - 14}
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
          const traj = shotTrajectory(shot, curvePoints, bounces)

          return (
            <Group key={shot.id}>
              <Line
                points={flatPoints}
                stroke={color}
                strokeWidth={isSelected ? 3 : 2}
                dash={isSelected ? undefined : [8, 4]}
                onClick={() => onShotClick?.(shot)}
                onTap={() => onShotClick?.(shot)}
                onDblClick={() => onShotDblClick?.(shot)}
                onDblTap={() => onShotDblClick?.(shot)}
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
              {/* Continuation trajectory */}
              {traj && traj.segments.length > 0 && (() => {
                const trajPts: number[] = []
                trajPts.push(traj.segments[0].start.x, traj.segments[0].start.y)
                for (const seg of traj.segments) trajPts.push(seg.end.x, seg.end.y)
                const bouncePts = traj.segments.slice(0, -1).map((seg) => seg.end)
                const lastEnd = traj.segments[traj.segments.length - 1].end
                return (
                  <Group listening={false}>
                    <Line points={trajPts} stroke={color} strokeWidth={1} opacity={0.35} dash={[4, 4]} />
                    {bouncePts.map((pt, i) => (
                      <Circle key={`tb-${shot.id}-${i}`} x={pt.x} y={pt.y} radius={3} fill={color} opacity={0.4} />
                    ))}
                    <Circle x={lastEnd.x} y={lastEnd.y} radius={TABLE.BALL_RADIUS} stroke={color} strokeWidth={1} opacity={0.2} dash={[3, 3]} />
                  </Group>
                )
              })()}
              {/* Control point handles — always visible, draggable in select mode */}
              {shot.points.map((pt, i) => (
                <Circle
                  key={`cp-${shot.id}-${i}`}
                  x={pt.x}
                  y={pt.y}
                  radius={i === 0 || i === shot.points.length - 1 ? 5 : 6}
                  fill={i === 0 || i === shot.points.length - 1 ? color : 'rgba(255,255,255,0.7)'}
                  stroke={color}
                  strokeWidth={1}
                  draggable={interactive}
                  onDragMove={(e) => {
                    const pos = e.target.position()
                    onControlPointDragMove?.(shot.id, i, pos.x, pos.y)
                  }}
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
