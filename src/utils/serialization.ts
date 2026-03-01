import { PoolTableState } from '../types'

const CURRENT_VERSION = '1' as const

export function createEmptyState(): PoolTableState {
  return {
    version: CURRENT_VERSION,
    balls: [],
    shots: [],
    areas: [],
  }
}

export function toJSON(state: PoolTableState): string {
  return JSON.stringify(state, null, 2)
}

export function fromJSON(json: string): PoolTableState {
  const parsed = JSON.parse(json)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid pool table state: not an object')
  }
  return {
    version: parsed.version || CURRENT_VERSION,
    balls: Array.isArray(parsed.balls) ? parsed.balls : [],
    cue: parsed.cue || undefined,
    shots: Array.isArray(parsed.shots) ? parsed.shots : [],
    areas: Array.isArray(parsed.areas) ? parsed.areas : [],
  }
}
