import { Layer, Line, Circle, Group, Text } from 'react-konva'
import { Area, Point } from '../types'

interface AreaLayerProps {
  areas: Area[]
  offsetX: number
  offsetY: number
  selectedAreaId?: string | null
  onAreaClick?: (area: Area) => void
  onVertexDragEnd?: (areaId: string, vertexIndex: number, x: number, y: number) => void
  interactive?: boolean
}

function centroid(points: Point[]): Point {
  const n = points.length
  if (n === 0) return { x: 0, y: 0 }
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: sum.x / n, y: sum.y / n }
}

export function AreaLayer({
  areas, offsetX, offsetY, selectedAreaId, onAreaClick, onVertexDragEnd, interactive = false
}: AreaLayerProps) {
  return (
    <Layer x={offsetX} y={offsetY}>
      {areas.map((area) => {
        if (area.points.length < 3) return null
        const isSelected = area.id === selectedAreaId
        const flatPoints = area.points.flatMap((p) => [p.x, p.y])
        const center = centroid(area.points)

        return (
          <Group key={area.id}>
            <Line
              points={flatPoints}
              closed
              fill={area.fill || 'rgba(255, 255, 0, 0.15)'}
              stroke={area.stroke || '#FFD700'}
              strokeWidth={isSelected ? 2.5 : 1.5}
              opacity={area.opacity ?? 0.6}
              dash={isSelected ? undefined : [4, 4]}
              onClick={() => onAreaClick?.(area)}
              onTap={() => onAreaClick?.(area)}
            />
            {/* Vertex handles — always visible, draggable when interactive */}
            {area.points.map((pt, i) => (
              <Circle
                key={`v-${area.id}-${i}`}
                x={pt.x}
                y={pt.y}
                radius={5}
                fill={isSelected ? '#FFF' : 'rgba(255,255,255,0.5)'}
                stroke={area.stroke || '#FFD700'}
                strokeWidth={1.5}
                draggable={interactive}
                onDragEnd={(e) => {
                  const pos = e.target.position()
                  onVertexDragEnd?.(area.id, i, pos.x, pos.y)
                }}
              />
            ))}
            {area.label && (
              <Text
                x={center.x}
                y={center.y}
                text={area.label}
                fontSize={12}
                fill={area.stroke || '#FFD700'}
                offsetX={area.label.length * 3}
                offsetY={6}
              />
            )}
          </Group>
        )
      })}
    </Layer>
  )
}
