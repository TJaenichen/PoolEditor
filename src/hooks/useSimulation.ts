import { useCallback } from 'react'
import { useEditor } from '../context/EditorContext'

export function useSimulation() {
  const { state, dispatch } = useEditor()

  const setBounces = useCallback((count: number) => {
    dispatch({ type: 'SET_SIMULATION_BOUNCES', count: Math.max(0, Math.min(10, count)) })
  }, [dispatch])

  const setPhysicsEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_PHYSICS_ENABLED', enabled })
  }, [dispatch])

  const setFriction = useCallback((value: number) => {
    dispatch({ type: 'SET_FRICTION', value })
  }, [dispatch])

  const setPocketsEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_POCKETS_ENABLED', enabled })
  }, [dispatch])

  return {
    simulation: state.simulation,
    physicsSimulation: state.physicsSimulation,
    bounces: state.simulationBounces,
    setBounces,
    physicsEnabled: state.physicsEnabled,
    setPhysicsEnabled,
    friction: state.friction,
    setFriction,
    pocketsEnabled: state.pocketsEnabled,
    setPocketsEnabled,
  }
}
