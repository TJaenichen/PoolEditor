// Library entry point
export { PoolEditor } from './components/PoolEditor'
export type {
  PoolTableState,
  PoolEditorProps,
  Ball,
  Shot,
  Area,
  Cue,
  Point,
  Tool,
  SimulationResult,
  SimulationSegment,
  BallTrajectory,
  PhysicsResult,
} from './types'
export { BALL_COLORS, TABLE } from './types'
export { toJSON, fromJSON, createEmptyState } from './utils/serialization'
export { eightBallRack, nineBallRack } from './utils/templates'
export { computeTrajectory, simulatePhysics } from './utils/physics'
