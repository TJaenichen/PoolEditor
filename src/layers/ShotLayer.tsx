import { Layer, Line, Circle, Arrow, Group, Text } from 'react-konva'
import { Shot, Ball, Point, BALL_COLORS, TABLE } from '../types'
import { catmullRomToBezier, sampleBezierPath } from '../utils/spline'
import { computeTrajectory, simulatePhysics } from '../utils/physics'

interface ShotLayerProps {
  shots: Shot[]
  offsetX: number
  offsetY: number
  selectedShotId?: string | null
  onShotClick?: (shot: Shot) => void
  onShotDblClick?: (shot: Shot) => void
  onControlPointDragMove?: (shotId: string, pointIndex: number, x: number, y: number) => void
  onControlPointDragEnd?: (shotId: string, pointIndex: number, x: number, y: number) => void
  interactive?: boolean
  bounces?: number
  physicsEnabled?: boolean
  balls?: Ball[]
  friction?: number
  pocketsEnabled?: boolean
}

export function ShotLayer({
  shots, offsetX, offsetY, selectedShotId, onShotClick, onShotDblClick,
  onControlPointDragMove, onControlPointDragEnd, interactive = false,
  bounces = 0, physicsEnabled = false, balls = [], friction = 0.3, pocketsEnabled = true,
}: ShotLayerProps) {
  return (
    <Layer x={offsetX} y={offsetY}>
      {shots.map((shot) => {
        if (shot.points.length < 2) return null
        const isSelected = shot.id === selectedShotId
        const color = shot.color || '#FFFF00'

        // All shots render through the curve path — a "straight" shot is just
        // a curve with a collinear midpoint, so the same handles always exist.
        const bezierSegments = catmullRomToBezier(shot.points)
        const curvePoints = sampleBezierPath(bezierSegments, 30)
        const flatPoints = curvePoints.flatMap((p: Point) => [p.x, p.y])

        // Continuation trajectory from endpoint
        let traj = null
        let physicsTraj = null
        if (curvePoints.length >= 2) {
          const fromPt = curvePoints[curvePoints.length - 2]
          const toPt = curvePoints[curvePoints.length - 1]
          const dx = toPt.x - fromPt.x
          const dy = toPt.y - fromPt.y
          if (dx !== 0 || dy !== 0) {
            const angle = (-Math.atan2(dy, dx) * 180) / Math.PI
            if (physicsEnabled && balls.length > 0) {
              physicsTraj = simulatePhysics(toPt, angle, balls, { friction, pocketsEnabled })
            } else if (bounces > 0) {
              traj = computeTrajectory(toPt, angle, bounces)
            }
          }
        }

        // Label position: near first point
        const labelPt = shot.points[0]

        return (
          <Group key={shot.id}>
            {/* Shot path */}
            <Line
              points={flatPoints}
              stroke={color}
              strokeWidth={isSelected ? 3 : 2}
              hitStrokeWidth={12}
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
            {/* Continuation trajectory (simple) */}
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
            {/* Continuation trajectory (physics) */}
            {physicsTraj && physicsTraj.ballPaths.length > 0 && (
              <Group listening={false}>
                {physicsTraj.ballPaths.map((path) => {
                  if (path.segments.length === 0) return null
                  const isCue = path.ballId === '__cue__'
                  const pathColor = isCue ? color : (BALL_COLORS[path.ballNumber]?.fill || '#ccc')
                  const pts: number[] = []
                  pts.push(path.segments[0].start.x, path.segments[0].start.y)
                  for (const seg of path.segments) pts.push(seg.end.x, seg.end.y)
                  return (
                    <Group key={`phys-${shot.id}-${path.ballId}`}>
                      <Line points={pts} stroke={pathColor} strokeWidth={1} opacity={0.35} dash={[4, 4]} />
                      {path.segments.slice(0, -1).map((seg, i) => (
                        <Circle key={`pb-${shot.id}-${path.ballId}-${i}`} x={seg.end.x} y={seg.end.y} radius={2} fill={pathColor} opacity={0.4} />
                      ))}
                      {!path.pocketed && (
                        <Circle x={path.finalPosition.x} y={path.finalPosition.y} radius={TABLE.BALL_RADIUS} stroke={pathColor} strokeWidth={1} opacity={0.15} dash={[3, 3]} />
                      )}
                    </Group>
                  )
                })}
              </Group>
            )}
            {/* Control point handles — endpoints smaller, mid-handles larger with white fill */}
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
                onClick={() => onShotClick?.(shot)}
                onTap={() => onShotClick?.(shot)}
                onDblClick={() => onShotDblClick?.(shot)}
                onDblTap={() => onShotDblClick?.(shot)}
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
                x={labelPt.x}
                y={labelPt.y - 14}
                text={shot.label}
                fontSize={11}
                fill={color}
              />
            )}
          </Group>
        )
      })}
    </Layer>
  )
}
