import { useState, useRef, useCallback } from 'react'
import { Layer, Circle, Text, Group, Arc, Line } from 'react-konva'
import { Ball, BALL_COLORS, TABLE } from '../types'

interface BallLayerProps {
  balls: Ball[]
  offsetX: number
  offsetY: number
  selectedBallId?: string | null
  onBallClick?: (ball: Ball) => void
  onBallDragEnd?: (ball: Ball, x: number, y: number) => void
  draggable?: boolean
}

export function BallLayer({
  balls, offsetX, offsetY, selectedBallId, onBallClick, onBallDragEnd, draggable = false
}: BallLayerProps) {
  const R = TABLE.BALL_RADIUS
  const selectedBall = selectedBallId ? balls.find((b) => b.id === selectedBallId) : null

  // Track live drag position for crosshair updates
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const hLineRef = useRef<import('konva/lib/shapes/Line').Line>(null)
  const vLineRef = useRef<import('konva/lib/shapes/Line').Line>(null)

  // The crosshair position: use drag position while dragging, otherwise the ball's stored position
  const crossX = dragPos?.x ?? selectedBall?.position.x
  const crossY = dragPos?.y ?? selectedBall?.position.y

  const handleDragMove = useCallback((ball: Ball, e: import('konva/lib/Node').KonvaEventObject<DragEvent>) => {
    if (ball.id !== selectedBallId) return
    const pos = e.target.position()
    // Update crosshair lines directly via refs for performance
    if (vLineRef.current) {
      vLineRef.current.points([pos.x, 0, pos.x, TABLE.HEIGHT])
    }
    if (hLineRef.current) {
      hLineRef.current.points([0, pos.y, TABLE.WIDTH, pos.y])
    }
    // Also update React state so it re-renders if needed
    setDragPos(pos)
  }, [selectedBallId])

  return (
    <Layer x={offsetX} y={offsetY}>
      {/* Crosshair guide lines for selected ball */}
      {selectedBall && crossX != null && crossY != null && (
        <>
          <Line
            ref={vLineRef}
            points={[crossX, 0, crossX, TABLE.HEIGHT]}
            stroke="rgba(255, 215, 0, 0.25)"
            strokeWidth={1}
            listening={false}
          />
          <Line
            ref={hLineRef}
            points={[0, crossY, TABLE.WIDTH, crossY]}
            stroke="rgba(255, 215, 0, 0.25)"
            strokeWidth={1}
            listening={false}
          />
        </>
      )}
      {balls.map((ball) => {
        const colors = BALL_COLORS[ball.number] || { fill: '#999', stripe: false }
        const isSelected = ball.id === selectedBallId
        const isCue = ball.number === 0

        return (
          <Group
            key={ball.id}
            x={ball.position.x}
            y={ball.position.y}
            draggable={draggable && isSelected}
            onClick={() => onBallClick?.(ball)}
            onTap={() => onBallClick?.(ball)}
            onDragMove={(e) => handleDragMove(ball, e)}
            onDragEnd={(e) => {
              setDragPos(null)
              const pos = e.target.position()
              onBallDragEnd?.(ball, pos.x, pos.y)
            }}
          >
            {/* Shadow */}
            <Circle radius={R} offsetX={-1} offsetY={1} fill="rgba(0,0,0,0.3)" />
            {/* Main ball */}
            <Circle radius={R} fill={colors.fill} stroke={isSelected ? '#FFD700' : '#333'} strokeWidth={isSelected ? 2 : 0.5} />
            {/* Stripe band for balls 9-15 */}
            {colors.stripe && (
              <Arc
                angle={180}
                rotation={-90}
                innerRadius={R * 0.45}
                outerRadius={R}
                fill="#FFFFFF"
              />
            )}
            {/* Number circle + text (except cue ball) */}
            {!isCue && (
              <>
                <Circle radius={R * 0.42} fill="#FFFFFF" />
                <Text
                  text={String(ball.number)}
                  fontSize={R * 0.8}
                  fontStyle="bold"
                  fill="#000"
                  width={R * 2}
                  height={R * 2}
                  offsetX={R}
                  offsetY={R}
                  align="center"
                  verticalAlign="middle"
                />
              </>
            )}
          </Group>
        )
      })}
    </Layer>
  )
}
