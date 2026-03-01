import { Layer, Line, Circle, Group, Text } from 'react-konva'
import { SimulationResult, PhysicsResult, BALL_COLORS, TABLE } from '../types'

interface SimulationLayerProps {
  simulation: SimulationResult | null
  physicsSimulation?: PhysicsResult | null
  offsetX: number
  offsetY: number
}

function getBallColor(ballNumber: number): string {
  if (ballNumber < 0) return 'rgba(255, 255, 255, 0.6)' // cue ball (__cue__)
  const entry = BALL_COLORS[ballNumber]
  return entry ? entry.fill : '#ccc'
}

export function SimulationLayer({ simulation, physicsSimulation, offsetX, offsetY }: SimulationLayerProps) {
  // Physics mode: render multi-ball paths
  if (physicsSimulation && physicsSimulation.ballPaths.length > 0) {
    return (
      <Layer x={offsetX} y={offsetY} listening={false}>
        {physicsSimulation.ballPaths.map((path) => {
          if (path.segments.length === 0) return null
          const color = getBallColor(path.ballNumber)
          const isCue = path.ballId === '__cue__'
          const opacity = isCue ? 0.5 : 0.4

          // Build polyline
          const pts: number[] = []
          pts.push(path.segments[0].start.x, path.segments[0].start.y)
          for (const seg of path.segments) {
            pts.push(seg.end.x, seg.end.y)
          }

          // Bounce markers at segment joints
          const bounceMarkers = path.segments.slice(0, -1).map((seg) => seg.end)

          return (
            <Group key={path.ballId}>
              <Line
                points={pts}
                stroke={color}
                strokeWidth={isCue ? 1.5 : 1}
                opacity={opacity}
                dash={[6, 4]}
              />
              {bounceMarkers.map((pt, i) => (
                <Circle
                  key={`bm-${path.ballId}-${i}`}
                  x={pt.x}
                  y={pt.y}
                  radius={2}
                  fill={color}
                  opacity={opacity}
                />
              ))}
              {/* Final position ghost ball */}
              {!path.pocketed && (
                <Circle
                  x={path.finalPosition.x}
                  y={path.finalPosition.y}
                  radius={TABLE.BALL_RADIUS}
                  fill={color}
                  opacity={0.15}
                  stroke={color}
                  strokeWidth={1}
                  dash={[3, 3]}
                />
              )}
              {/* Pocketed indicator */}
              {path.pocketed && (
                <Group>
                  <Circle
                    x={path.finalPosition.x}
                    y={path.finalPosition.y}
                    radius={TABLE.BALL_RADIUS}
                    fill={color}
                    opacity={0.1}
                  />
                  <Text
                    x={path.finalPosition.x - 4}
                    y={path.finalPosition.y - 5}
                    text="x"
                    fontSize={10}
                    fill={color}
                    opacity={0.5}
                  />
                </Group>
              )}
            </Group>
          )
        })}
      </Layer>
    )
  }

  // Simple mode: single cue trajectory
  if (!simulation || simulation.segments.length === 0) return null

  const allPoints: number[] = []
  allPoints.push(simulation.segments[0].start.x, simulation.segments[0].start.y)
  for (const seg of simulation.segments) {
    allPoints.push(seg.end.x, seg.end.y)
  }

  const bouncePoints = simulation.segments.slice(0, -1).map((seg) => seg.end)
  const lastSeg = simulation.segments[simulation.segments.length - 1]

  return (
    <Layer x={offsetX} y={offsetY} listening={false}>
      <Line
        points={allPoints}
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth={1.5}
        dash={[6, 4]}
      />
      {bouncePoints.map((pt, i) => (
        <Circle
          key={`bounce-${i}`}
          x={pt.x}
          y={pt.y}
          radius={3}
          fill="rgba(255, 255, 255, 0.5)"
          stroke="rgba(255, 255, 255, 0.7)"
          strokeWidth={0.5}
        />
      ))}
      <Circle
        x={lastSeg.end.x}
        y={lastSeg.end.y}
        radius={TABLE.BALL_RADIUS}
        fill="rgba(255, 255, 255, 0.15)"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={1}
        dash={[3, 3]}
      />
    </Layer>
  )
}
