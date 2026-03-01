import { useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer, Line, Circle } from 'react-konva'
import type Konva from 'konva'
import { EditorProvider, useEditor } from '../context/EditorContext'
import { TableLayer } from '../layers/TableLayer'
import { BallLayer } from '../layers/BallLayer'
import { CueLayer } from '../layers/CueLayer'
import { ShotLayer } from '../layers/ShotLayer'
import { AreaLayer } from '../layers/AreaLayer'
import { SimulationLayer } from '../layers/SimulationLayer'
import { Toolbar } from './Toolbar'
import { BallPalette } from './BallPalette'
import { SimulationControls } from './SimulationControls'
import { PropertiesPanel } from './PropertiesPanel'
import { TABLE, type PoolEditorProps, type Point, type Shot, type Area } from '../types'
import { toJSON } from '../utils/serialization'

// Inner canvas that consumes editor context
function EditorCanvas({ width, readOnly }: { width: number; readOnly: boolean }) {
  const { state, dispatch } = useEditor()
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep a ref to latest state so keyboard handlers always see current values
  const stateRef = useRef(state)
  stateRef.current = state

  // Cue drag state
  const [cueDragStart, setCueDragStart] = useState<Point | null>(null)
  const [cueDragCurrent, setCueDragCurrent] = useState<Point | null>(null)

  // Table offset: center the playing surface with rail padding
  const scale = width / (TABLE.WIDTH + TABLE.RAIL_WIDTH * 2)
  const stageWidth = width
  const stageHeight = (TABLE.HEIGHT + TABLE.RAIL_WIDTH * 2) * scale
  const offsetX = TABLE.RAIL_WIDTH
  const offsetY = TABLE.RAIL_WIDTH

  // Convert stage pointer position to table coordinates
  const pointerToTable = useCallback(
    (stage: Konva.Stage): Point | null => {
      const pointer = stage.getPointerPosition()
      if (!pointer) return null
      const x = pointer.x / scale - offsetX
      const y = pointer.y / scale - offsetY
      if (x < 0 || x > TABLE.WIDTH || y < 0 || y > TABLE.HEIGHT) return null
      return { x, y }
    },
    [scale, offsetX, offsetY],
  )

  // Keyboard shortcuts: Delete/d remove; Escape deselect; arrows move; Q/E rotate cue
  useEffect(() => {
    if (readOnly) return
    const handler = (e: KeyboardEvent) => {
      const s = stateRef.current
      if (e.key === 'Delete' || e.key === 'd' || e.key === 'D') {
        if (s.selectedId) {
          dispatch({ type: 'ERASE_AT', id: s.selectedId })
        }
      } else if (e.key === 'Escape') {
        dispatch({ type: 'SELECT', id: null })
        dispatch({ type: 'CLEAR_DRAWING' })
      } else if (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E') {
        if (s.selectedId !== 'cue' || !s.tableState.cue) return
        e.preventDefault()
        const step = e.shiftKey ? 1 : 5
        const dir = (e.key === 'q' || e.key === 'Q') ? 1 : -1
        const angle = ((s.tableState.cue.angle + dir * step) % 360 + 360) % 360
        dispatch({ type: 'ROTATE_CUE', angle })
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Move selected cue
        if (s.selectedId === 'cue' && s.tableState.cue) {
          e.preventDefault()
          const step = e.shiftKey ? 1 : TABLE.BALL_RADIUS
          let { x, y } = s.tableState.cue.position
          if (e.key === 'ArrowUp') y -= step
          if (e.key === 'ArrowDown') y += step
          if (e.key === 'ArrowLeft') x -= step
          if (e.key === 'ArrowRight') x += step
          x = Math.max(0, Math.min(TABLE.WIDTH, x))
          y = Math.max(0, Math.min(TABLE.HEIGHT, y))
          dispatch({ type: 'MOVE_CUE', position: { x, y } })
          return
        }
        // Move selected ball
        const selectedBall = s.tableState.balls.find((b) => b.id === s.selectedId)
        if (!selectedBall) return
        e.preventDefault()
        const step = e.shiftKey ? 1 : TABLE.BALL_RADIUS
        let { x, y } = selectedBall.position
        if (e.key === 'ArrowUp') y -= step
        if (e.key === 'ArrowDown') y += step
        if (e.key === 'ArrowLeft') x -= step
        if (e.key === 'ArrowRight') x += step
        x = Math.max(0, Math.min(TABLE.WIDTH, x))
        y = Math.max(0, Math.min(TABLE.HEIGHT, y))
        dispatch({ type: 'MOVE_BALL', id: selectedBall.id, position: { x, y } })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [readOnly, dispatch])

  // Stage click handler
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (readOnly) return
      const stage = e.target.getStage()
      if (!stage) return

      // Only process clicks on empty space (stage background or layer)
      // Clicks on existing shapes (balls, shots, handles) are handled by their own handlers
      const isEmptySpace = e.target === stage || e.target.getParent()?.getClassName() === 'Layer'

      const pt = pointerToTable(stage)
      if (!pt) return

      const tool = state.activeTool

      if (!isEmptySpace) {
        // Clicked on an existing shape — only deselect logic for select tool is needed,
        // and shape handlers (onBallClick, onShotClick, etc.) already fired.
        return
      }

      if (tool === 'place-ball') {
        const id = `ball-${state.selectedBallNumber}-${Date.now()}`
        dispatch({
          type: 'ADD_BALL',
          ball: { id, number: state.selectedBallNumber, position: pt },
        })
        dispatch({ type: 'SET_TOOL', tool: 'select' })
      } else if (tool === 'shot-straight') {
        if (state.drawingPoints.length === 0) {
          dispatch({ type: 'ADD_DRAWING_POINT', point: pt })
        } else {
          const start = state.drawingPoints[0]
          const mid = { x: (start.x + pt.x) / 2, y: (start.y + pt.y) / 2 }
          const shot: Shot = {
            id: `shot-${Date.now()}`,
            type: 'curve',
            points: [start, mid, pt],
          }
          dispatch({ type: 'ADD_SHOT', shot })
          dispatch({ type: 'SET_TOOL', tool: 'select' })
        }
      } else if (tool === 'shot-curve') {
        dispatch({ type: 'ADD_DRAWING_POINT', point: pt })
      } else if (tool === 'draw-area') {
        dispatch({ type: 'ADD_DRAWING_POINT', point: pt })
      } else if (tool === 'select') {
        dispatch({ type: 'SELECT', id: null })
      }
    },
    [readOnly, state.activeTool, state.selectedBallNumber, state.drawingPoints, dispatch, pointerToTable],
  )

  // Double-click: finalize curve/area drawing
  const handleStageDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (readOnly) return
      const stage = e.target.getStage()
      if (!stage) return

      const isEmptySpace = e.target === stage || e.target.getParent()?.getClassName() === 'Layer'
      if (!isEmptySpace) return

      const pt = pointerToTable(stage)
      if (!pt) return

      const tool = state.activeTool

      if (tool === 'shot-curve' && state.drawingPoints.length >= 2) {
        const allPts = [...state.drawingPoints, pt]
        const shot: Shot = {
          id: `shot-${Date.now()}`,
          type: 'curve',
          points: allPts,
        }
        dispatch({ type: 'ADD_SHOT', shot })
      } else if (tool === 'draw-area' && state.drawingPoints.length >= 2) {
        const allPts = [...state.drawingPoints, pt]
        let areaType: Area['type'] = 'polygon'
        if (allPts.length === 3) areaType = 'triangle'
        else if (allPts.length === 4) areaType = 'rectangle'
        const area: Area = {
          id: `area-${Date.now()}`,
          type: areaType,
          points: allPts,
        }
        dispatch({ type: 'ADD_AREA', area })
      }
    },
    [readOnly, state.activeTool, state.drawingPoints, dispatch, pointerToTable],
  )

  // Cue placement: mousedown starts drag, mousemove updates preview, mouseup places
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (readOnly || state.activeTool !== 'place-cue') return
      const stage = e.target.getStage()
      if (!stage) return
      const pt = pointerToTable(stage)
      if (!pt) return
      setCueDragStart(pt)
      setCueDragCurrent(pt)
    },
    [readOnly, state.activeTool, pointerToTable],
  )

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!cueDragStart) return
      const stage = e.target.getStage()
      if (!stage) return
      const pointer = stage.getPointerPosition()
      if (!pointer) return
      const x = pointer.x / scale - offsetX
      const y = pointer.y / scale - offsetY
      setCueDragCurrent({ x, y })
    },
    [cueDragStart, scale, offsetX, offsetY],
  )

  const handleMouseUp = useCallback(
    () => {
      if (!cueDragStart || !cueDragCurrent) return
      const dx = cueDragCurrent.x - cueDragStart.x
      const dy = cueDragCurrent.y - cueDragStart.y
      const angle = dx === 0 && dy === 0 ? 0 : (-Math.atan2(dy, dx) * 180) / Math.PI
      dispatch({ type: 'SET_CUE', cue: { position: cueDragCurrent, angle } })
      dispatch({ type: 'SET_TOOL', tool: 'select' })
      setCueDragStart(null)
      setCueDragCurrent(null)
    },
    [cueDragStart, cueDragCurrent, dispatch],
  )

  // Auto-run simulation whenever cue, bounces, balls, or physics settings change
  useEffect(() => {
    dispatch({ type: 'RUN_SIMULATION' })
  }, [state.tableState.cue, state.simulationBounces, state.tableState.balls,
      state.physicsEnabled, state.friction, state.pocketsEnabled, dispatch])

  // Cursor style based on active tool
  const cursorMap: Record<string, string> = {
    'select': 'default',
    'place-ball': 'crosshair',
    'place-cue': 'crosshair',
    'shot-straight': 'crosshair',
    'shot-curve': 'crosshair',
    'draw-area': 'crosshair',
    'eraser': 'pointer',
  }

  return (
    <div ref={containerRef} tabIndex={0} style={{ outline: 'none' }}>
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={scale}
        scaleY={scale}
        onClick={handleStageClick}
        onDblClick={handleStageDblClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          background: '#111',
          borderRadius: '4px',
          cursor: readOnly ? 'default' : (cursorMap[state.activeTool] || 'crosshair'),
        }}
      >
        <TableLayer offsetX={offsetX} offsetY={offsetY} />
        <AreaLayer
          areas={state.tableState.areas}
          offsetX={offsetX}
          offsetY={offsetY}
          selectedAreaId={state.selectedId}
          onAreaClick={(area) => dispatch({ type: 'SELECT', id: area.id })}
          onVertexDragEnd={(areaId, vertexIndex, x, y) =>
            dispatch({ type: 'UPDATE_AREA_VERTEX', areaId, vertexIndex, position: { x, y } })
          }
          interactive={!readOnly}
        />
        <ShotLayer
          shots={state.tableState.shots}
          offsetX={offsetX}
          offsetY={offsetY}
          selectedShotId={state.selectedId}
          onShotClick={(shot) => dispatch({ type: 'SELECT', id: shot.id })}
          onShotDblClick={(shot) => {
            dispatch({ type: 'RESET_SHOT_TO_STRAIGHT', id: shot.id })
          }}
          onControlPointDragMove={(shotId, pointIndex, x, y) =>
            dispatch({ type: 'UPDATE_SHOT_POINT', shotId, pointIndex, position: { x, y } })
          }
          onControlPointDragEnd={(shotId, pointIndex, x, y) =>
            dispatch({ type: 'UPDATE_SHOT_POINT', shotId, pointIndex, position: { x, y } })
          }
          interactive={!readOnly}
          bounces={state.simulationBounces}
          physicsEnabled={state.physicsEnabled}
          balls={state.tableState.balls}
          friction={state.friction}
          pocketsEnabled={state.pocketsEnabled}
        />
        <SimulationLayer
          simulation={state.simulation}
          physicsSimulation={state.physicsSimulation}
          offsetX={offsetX}
          offsetY={offsetY}
        />
        <BallLayer
          balls={state.tableState.balls}
          offsetX={offsetX}
          offsetY={offsetY}
          selectedBallId={state.selectedId}
          onBallClick={(ball) => {
            if (state.activeTool === 'eraser') {
              dispatch({ type: 'REMOVE_BALL', id: ball.id })
            } else {
              dispatch({ type: 'SELECT', id: ball.id })
            }
          }}
          onBallDragEnd={(ball, x, y) =>
            dispatch({ type: 'MOVE_BALL', id: ball.id, position: { x, y } })
          }
          draggable={!readOnly}
        />
        <CueLayer
          cue={state.tableState.cue}
          offsetX={offsetX}
          offsetY={offsetY}
          selected={state.selectedId === 'cue'}
          onClick={() => dispatch({ type: 'SELECT', id: 'cue' })}
          onDragEnd={(x, y) => dispatch({ type: 'MOVE_CUE', position: { x, y } })}
        />
        {/* Cue drag preview while placing */}
        {cueDragStart && cueDragCurrent && (
          <Layer x={offsetX} y={offsetY} listening={false}>
            <Line
              points={[cueDragStart.x, cueDragStart.y, cueDragCurrent.x, cueDragCurrent.y]}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={2}
              dash={[6, 4]}
            />
            <Circle x={cueDragStart.x} y={cueDragStart.y} radius={4} fill="rgba(255,255,255,0.7)" />
          </Layer>
        )}
        {/* Drawing preview: in-progress points */}
        {state.drawingPoints.length > 0 && (
          <Layer x={offsetX} y={offsetY}>
            <Line
              points={state.drawingPoints.flatMap((p) => [p.x, p.y])}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1.5}
              dash={[4, 4]}
              closed={state.activeTool === 'draw-area'}
            />
            {state.drawingPoints.map((p, i) => (
              <Circle
                key={`dp-${i}`}
                x={p.x}
                y={p.y}
                radius={4}
                fill="rgba(255,255,255,0.7)"
              />
            ))}
          </Layer>
        )}
      </Stage>
    </div>
  )
}

// Wrapper that fires onChange
function EditorWithCallbacks({
  onChange,
  width,
  readOnly,
}: {
  onChange?: (state: import('../types').PoolTableState) => void
  width: number
  readOnly: boolean
}) {
  const { state } = useEditor()
  const prevRef = useRef<string>('')

  useEffect(() => {
    if (!onChange) return
    const json = toJSON(state.tableState)
    if (json !== prevRef.current) {
      prevRef.current = json
      onChange(state.tableState)
    }
  }, [state.tableState, onChange])

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      {!readOnly && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Toolbar />
          <BallPalette />
          <SimulationControls />
        </div>
      )}
      <EditorCanvas width={width} readOnly={readOnly} />
      {!readOnly && <PropertiesPanel />}
    </div>
  )
}

// Public API component
export function PoolEditor({
  initialState,
  onChange,
  readOnly = false,
  width = 900,
  simulationBounces = 0,
  className,
  style,
}: PoolEditorProps) {
  const numWidth = typeof width === 'string' ? parseInt(width, 10) || 900 : width

  return (
    <div className={className} style={style}>
      <EditorProvider initialState={initialState} simulationBounces={simulationBounces}>
        <EditorWithCallbacks onChange={onChange} width={numWidth} readOnly={readOnly} />
      </EditorProvider>
    </div>
  )
}
