import { useCallback, useEffect, useRef } from 'react'
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
      // Clamp to table bounds
      if (x < 0 || x > TABLE.WIDTH || y < 0 || y > TABLE.HEIGHT) return null
      return { x, y }
    },
    [scale, offsetX, offsetY],
  )

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (readOnly) return
      const stage = e.target.getStage()
      if (!stage) return
      const pt = pointerToTable(stage)
      if (!pt) return

      const tool = state.activeTool

      if (tool === 'place-ball') {
        const id = `ball-${state.selectedBallNumber}-${Date.now()}`
        dispatch({
          type: 'ADD_BALL',
          ball: { id, number: state.selectedBallNumber, position: pt },
        })
      } else if (tool === 'place-cue') {
        dispatch({ type: 'SET_CUE', cue: { position: pt, angle: 0 } })
        dispatch({ type: 'SET_TOOL', tool: 'select' })
      } else if (tool === 'shot-straight') {
        if (state.drawingPoints.length === 0) {
          dispatch({ type: 'ADD_DRAWING_POINT', point: pt })
        } else {
          const start = state.drawingPoints[0]
          const shot: Shot = {
            id: `shot-${Date.now()}`,
            type: 'straight',
            points: [start, pt],
          }
          dispatch({ type: 'ADD_SHOT', shot })
        }
      } else if (tool === 'shot-curve') {
        dispatch({ type: 'ADD_DRAWING_POINT', point: pt })
      } else if (tool === 'draw-area') {
        dispatch({ type: 'ADD_DRAWING_POINT', point: pt })
      } else if (tool === 'select') {
        // Deselect when clicking empty table area
        if (e.target === stage || e.target.getParent()?.getClassName() === 'Layer') {
          dispatch({ type: 'SELECT', id: null })
        }
      }
    },
    [readOnly, state.activeTool, state.selectedBallNumber, state.drawingPoints, dispatch, pointerToTable],
  )

  const handleStageDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (readOnly) return
      const stage = e.target.getStage()
      if (!stage) return
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

  return (
    <Stage
      ref={stageRef}
      width={stageWidth}
      height={stageHeight}
      scaleX={scale}
      scaleY={scale}
      onClick={handleStageClick}
      onDblClick={handleStageDblClick}
      style={{ background: '#111', borderRadius: '4px', cursor: readOnly ? 'default' : 'crosshair' }}
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
        interactive={!readOnly && state.activeTool === 'select'}
      />
      <ShotLayer
        shots={state.tableState.shots}
        offsetX={offsetX}
        offsetY={offsetY}
        selectedShotId={state.selectedId}
        onShotClick={(shot) => dispatch({ type: 'SELECT', id: shot.id })}
        onControlPointDragEnd={(shotId, pointIndex, x, y) =>
          dispatch({ type: 'UPDATE_SHOT_POINT', shotId, pointIndex, position: { x, y } })
        }
        interactive={!readOnly && state.activeTool === 'select'}
      />
      <SimulationLayer
        simulation={state.simulation}
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
        draggable={!readOnly && state.activeTool === 'select'}
      />
      <CueLayer
        cue={state.tableState.cue}
        offsetX={offsetX}
        offsetY={offsetY}
        onDragEnd={(x, y) => dispatch({ type: 'MOVE_CUE', position: { x, y } })}
        onAngleChange={(angle) => dispatch({ type: 'ROTATE_CUE', angle })}
        draggable={!readOnly && state.activeTool === 'select'}
      />
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
