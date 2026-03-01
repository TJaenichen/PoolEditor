import { Layer, Line, Circle } from 'react-konva'
import { SimulationResult, TABLE } from '../types'

interface SimulationLayerProps {
  simulation: SimulationResult | null
  offsetX: number
  offsetY: number
}

export function SimulationLayer({ simulation, offsetX, offsetY }: SimulationLayerProps) {
  if (!simulation || simulation.segments.length === 0) return null

  // Flatten all segment points into a polyline
  const allPoints: number[] = []
  allPoints.push(simulation.segments[0].start.x, simulation.segments[0].start.y)
  for (const seg of simulation.segments) {
    allPoints.push(seg.end.x, seg.end.y)
  }

  // Bounce markers at segment joints
  const bouncePoints = simulation.segments.slice(0, -1).map((seg) => seg.end)

  // Final position marker
  const lastSeg = simulation.segments[simulation.segments.length - 1]

  return (
    <Layer x={offsetX} y={offsetY} listening={false}>
      {/* Trajectory polyline */}
      <Line
        points={allPoints}
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth={1.5}
        dash={[6, 4]}
      />
      {/* Bounce markers */}
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
      {/* Ghost ball at final position */}
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
