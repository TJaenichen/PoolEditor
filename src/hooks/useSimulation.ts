import { useCallback } from 'react'
import { useEditor } from '../context/EditorContext'

export function useSimulation() {
  const { state, dispatch } = useEditor()

  const setBounces = useCallback((count: number) => {
    dispatch({ type: 'SET_SIMULATION_BOUNCES', count: Math.max(0, Math.min(10, count)) })
  }, [dispatch])

  return {
    simulation: state.simulation,
    bounces: state.simulationBounces,
    setBounces,
  }
}
