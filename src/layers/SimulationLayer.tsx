import { useState, useEffect, useRef } from 'react'
import { Layer, Line, Circle } from 'react-konva'
import { SimulationResult, TABLE } from '../types'

interface SimulationLayerProps {
  simulation: SimulationResult | null
  offsetX: number
  offsetY: number
  animate?: boolean
}

export function SimulationLayer({ simulation, offsetX, offsetY, animate = true }: SimulationLayerProps) {
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    if (!simulation || !animate || simulation.segments.length === 0) {
      setGhostPos(null)
      return
    }

    // Compute total path length for consistent speed
    let totalLen = 0
    const segLengths: number[] = []
    for (const seg of simulation.segments) {
      const len = Math.sqrt((seg.end.x - seg.start.x) ** 2 + (seg.end.y - seg.start.y) ** 2)
      segLengths.push(len)
      totalLen += len
    }

    const speed = 300 // px per second
    const totalTime = totalLen / speed
    const startTime = performance.now()

    function step(now: number) {
      const elapsed = (now - startTime) / 1000
      const t = (elapsed % totalTime) / totalTime // loop
      let distTarget = t * totalLen
      let segIdx = 0
      while (segIdx < segLengths.length - 1 && distTarget > segLengths[segIdx]) {
        distTarget -= segLengths[segIdx]
        segIdx++
      }
      const seg = simulation!.segments[segIdx]
      const segT = segLengths[segIdx] > 0 ? distTarget / segLengths[segIdx] : 0
      setGhostPos({
        x: seg.start.x + (seg.end.x - seg.start.x) * segT,
        y: seg.start.y + (seg.end.y - seg.start.y) * segT,
      })
      animRef.current = requestAnimationFrame(step)
    }

    animRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animRef.current)
  }, [simulation, animate])

  if (!simulation || simulation.segments.length === 0) return null

  // Flatten all segment points into a polyline
  const allPoints: number[] = []
  allPoints.push(simulation.segments[0].start.x, simulation.segments[0].start.y)
  for (const seg of simulation.segments) {
    allPoints.push(seg.end.x, seg.end.y)
  }

  // Bounce markers at segment joints
  const bouncePoints = simulation.segments.slice(0, -1).map((seg) => seg.end)

  return (
    <Layer x={offsetX} y={offsetY}>
      {/* Trajectory polyline */}
      <Line
        points={allPoints}
        stroke="rgba(255, 100, 100, 0.7)"
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
          fill="rgba(255, 100, 100, 0.8)"
          stroke="#FFF"
          strokeWidth={0.5}
        />
      ))}
      {/* Animated ghost ball */}
      {ghostPos && (
        <Circle
          x={ghostPos.x}
          y={ghostPos.y}
          radius={TABLE.BALL_RADIUS}
          fill="rgba(255, 255, 255, 0.4)"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth={1}
        />
      )}
    </Layer>
  )
}
