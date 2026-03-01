import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { Ball, Cue, Shot, Area, Tool, PoolTableState, SimulationResult, Point } from '../types'
import { createEmptyState } from '../utils/serialization'
import { computeTrajectory } from '../utils/physics'

// Extended internal state beyond the serializable PoolTableState
interface EditorState {
  tableState: PoolTableState
  activeTool: Tool
  selectedId: string | null  // id of selected ball, shot, or area
  selectedBallNumber: number // which ball number to place next
  simulation: SimulationResult | null
  simulationBounces: number
  drawingPoints: Point[]  // temp points while drawing a shot or area
}

type EditorAction =
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'SELECT'; id: string | null }
  | { type: 'SET_SELECTED_BALL_NUMBER'; num: number }
  | { type: 'ADD_BALL'; ball: Ball }
  | { type: 'MOVE_BALL'; id: string; position: Point }
  | { type: 'REMOVE_BALL'; id: string }
  | { type: 'SET_CUE'; cue: Cue }
  | { type: 'MOVE_CUE'; position: Point }
  | { type: 'ROTATE_CUE'; angle: number }
  | { type: 'REMOVE_CUE' }
  | { type: 'ADD_SHOT'; shot: Shot }
  | { type: 'UPDATE_SHOT'; id: string; changes: Partial<Shot> }
  | { type: 'UPDATE_SHOT_POINT'; shotId: string; pointIndex: number; position: Point }
  | { type: 'REMOVE_SHOT'; id: string }
  | { type: 'RESET_SHOT_TO_STRAIGHT'; id: string }
  | { type: 'ADD_SHOT_MIDPOINT'; id: string }
  | { type: 'ADD_AREA'; area: Area }
  | { type: 'UPDATE_AREA'; id: string; changes: Partial<Area> }
  | { type: 'UPDATE_AREA_VERTEX'; areaId: string; vertexIndex: number; position: Point }
  | { type: 'REMOVE_AREA'; id: string }
  | { type: 'ADD_DRAWING_POINT'; point: Point }
  | { type: 'CLEAR_DRAWING' }
  | { type: 'SET_SIMULATION'; result: SimulationResult | null }
  | { type: 'SET_SIMULATION_BOUNCES'; count: number }
  | { type: 'RUN_SIMULATION' }
  | { type: 'LOAD_STATE'; state: PoolTableState }
  | { type: 'CLEAR_ALL' }
  | { type: 'ERASE_AT'; id: string }

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, activeTool: action.tool, selectedId: null, drawingPoints: [] }
    case 'SELECT':
      return { ...state, selectedId: action.id }
    case 'SET_SELECTED_BALL_NUMBER':
      return { ...state, selectedBallNumber: action.num }

    case 'ADD_BALL':
      return { ...state, tableState: { ...state.tableState, balls: [...state.tableState.balls, action.ball] } }
    case 'MOVE_BALL':
      return {
        ...state,
        tableState: {
          ...state.tableState,
          balls: state.tableState.balls.map((b) => b.id === action.id ? { ...b, position: action.position } : b),
        },
      }
    case 'REMOVE_BALL':
      return {
        ...state,
        tableState: { ...state.tableState, balls: state.tableState.balls.filter((b) => b.id !== action.id) },
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      }

    case 'SET_CUE':
      return { ...state, tableState: { ...state.tableState, cue: action.cue } }
    case 'MOVE_CUE':
      return { ...state, tableState: { ...state.tableState, cue: state.tableState.cue ? { ...state.tableState.cue, position: action.position } : undefined } }
    case 'ROTATE_CUE':
      return { ...state, tableState: { ...state.tableState, cue: state.tableState.cue ? { ...state.tableState.cue, angle: action.angle } : undefined } }
    case 'REMOVE_CUE':
      return { ...state, tableState: { ...state.tableState, cue: undefined } }

    case 'ADD_SHOT':
      return { ...state, tableState: { ...state.tableState, shots: [...state.tableState.shots, action.shot] }, drawingPoints: [] }
    case 'UPDATE_SHOT':
      return {
        ...state,
        tableState: {
          ...state.tableState,
          shots: state.tableState.shots.map((s) => s.id === action.id ? { ...s, ...action.changes } : s),
        },
      }
    case 'UPDATE_SHOT_POINT':
      return {
        ...state,
        tableState: {
          ...state.tableState,
          shots: state.tableState.shots.map((s) => {
            if (s.id !== action.shotId) return s
            const newPoints = [...s.points]
            newPoints[action.pointIndex] = action.position
            return { ...s, points: newPoints }
          }),
        },
      }
    case 'REMOVE_SHOT':
      return {
        ...state,
        tableState: { ...state.tableState, shots: state.tableState.shots.filter((s) => s.id !== action.id) },
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      }
    case 'RESET_SHOT_TO_STRAIGHT': {
      return {
        ...state,
        tableState: {
          ...state.tableState,
          shots: state.tableState.shots.map((s) => {
            if (s.id !== action.id) return s
            // Keep only first and last point
            return { ...s, type: 'straight', points: [s.points[0], s.points[s.points.length - 1]] }
          }),
        },
      }
    }
    case 'ADD_SHOT_MIDPOINT': {
      return {
        ...state,
        tableState: {
          ...state.tableState,
          shots: state.tableState.shots.map((s) => {
            if (s.id !== action.id || s.points.length < 2) return s
            const start = s.points[0]
            const end = s.points[s.points.length - 1]
            const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
            return { ...s, type: 'curve', points: [start, mid, end] }
          }),
        },
      }
    }

    case 'ADD_AREA':
      return { ...state, tableState: { ...state.tableState, areas: [...state.tableState.areas, action.area] }, drawingPoints: [] }
    case 'UPDATE_AREA':
      return {
        ...state,
        tableState: {
          ...state.tableState,
          areas: state.tableState.areas.map((a) => a.id === action.id ? { ...a, ...action.changes } : a),
        },
      }
    case 'UPDATE_AREA_VERTEX':
      return {
        ...state,
        tableState: {
          ...state.tableState,
          areas: state.tableState.areas.map((a) => {
            if (a.id !== action.areaId) return a
            const newPoints = [...a.points]
            newPoints[action.vertexIndex] = action.position
            return { ...a, points: newPoints }
          }),
        },
      }
    case 'REMOVE_AREA':
      return {
        ...state,
        tableState: { ...state.tableState, areas: state.tableState.areas.filter((a) => a.id !== action.id) },
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      }

    case 'ADD_DRAWING_POINT':
      return { ...state, drawingPoints: [...state.drawingPoints, action.point] }
    case 'CLEAR_DRAWING':
      return { ...state, drawingPoints: [] }

    case 'SET_SIMULATION':
      return { ...state, simulation: action.result }
    case 'SET_SIMULATION_BOUNCES':
      return { ...state, simulationBounces: action.count }
    case 'RUN_SIMULATION': {
      const { cue, shots } = state.tableState
      if (!cue || shots.length === 0) return { ...state, simulation: null }
      // Find the shot starting closest to the cue position
      let closestShot: typeof shots[0] | null = null
      let closestDist = Infinity
      for (const shot of shots) {
        if (shot.points.length < 2) continue
        const dx = shot.points[0].x - cue.position.x
        const dy = shot.points[0].y - cue.position.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < closestDist) {
          closestDist = d
          closestShot = shot
        }
      }
      if (!closestShot || closestShot.points.length < 2) return { ...state, simulation: null }
      // Compute angle from first to second point of the shot
      const p0 = closestShot.points[0]
      const p1 = closestShot.points[1]
      const angle = -Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI
      const result = computeTrajectory(cue.position, angle, state.simulationBounces)
      return { ...state, simulation: result }
    }

    case 'LOAD_STATE':
      return { ...state, tableState: action.state, selectedId: null, simulation: null, drawingPoints: [] }
    case 'CLEAR_ALL':
      return { ...state, tableState: createEmptyState(), selectedId: null, simulation: null, drawingPoints: [] }

    case 'ERASE_AT': {
      const id = action.id
      const hasBall = state.tableState.balls.some((b) => b.id === id)
      if (hasBall) return reducer(state, { type: 'REMOVE_BALL', id })
      const hasShot = state.tableState.shots.some((s) => s.id === id)
      if (hasShot) return reducer(state, { type: 'REMOVE_SHOT', id })
      const hasArea = state.tableState.areas.some((a) => a.id === id)
      if (hasArea) return reducer(state, { type: 'REMOVE_AREA', id })
      return state
    }

    default:
      return state
  }
}

interface EditorContextValue {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
  tableState: PoolTableState
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({
  children,
  initialState,
  simulationBounces = 0,
}: {
  children: ReactNode
  initialState?: Partial<PoolTableState>
  simulationBounces?: number
}) {
  const init: EditorState = {
    tableState: {
      ...createEmptyState(),
      ...initialState,
    } as PoolTableState,
    activeTool: 'select',
    selectedId: null,
    selectedBallNumber: 0,
    simulation: null,
    simulationBounces,
    drawingPoints: [],
  }

  const [state, dispatch] = useReducer(reducer, init)

  return (
    <EditorContext.Provider value={{ state, dispatch, tableState: state.tableState }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be inside EditorProvider')
  return ctx
}

export type { EditorState, EditorAction }
