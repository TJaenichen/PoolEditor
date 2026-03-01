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

  return (
    <Layer x={offsetX} y={offsetY}>
      {/* Crosshair guide lines for selected ball */}
      {selectedBall && (
        <>
          <Line
            points={[selectedBall.position.x, 0, selectedBall.position.x, TABLE.HEIGHT]}
            stroke="rgba(255, 215, 0, 0.25)"
            strokeWidth={1}
            listening={false}
          />
          <Line
            points={[0, selectedBall.position.y, TABLE.WIDTH, selectedBall.position.y]}
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
            onDragEnd={(e) => {
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
