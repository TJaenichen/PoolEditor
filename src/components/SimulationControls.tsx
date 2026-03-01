import { useSimulation } from '../hooks/useSimulation'

const styles = {
  panel: {
    padding: '8px',
    background: '#2a2a3e',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  heading: {
    color: '#aaa',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    margin: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#ccc',
    fontSize: '12px',
  },
  slider: {
    flex: 1,
    cursor: 'pointer',
  },
  btn: {
    padding: '6px 12px',
    background: '#3a5fcd',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '6px 12px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#ccc',
    fontSize: '12px',
    cursor: 'pointer',
  },
}

export function SimulationControls() {
  const { bounces, simulation, runSimulation, clearSimulation, setBounces } = useSimulation()

  return (
    <div style={styles.panel}>
      <p style={styles.heading}>Simulation</p>
      <div style={styles.row}>
        <span>Bounces:</span>
        <input
          type="range"
          min={0}
          max={10}
          value={bounces}
          onChange={(e) => setBounces(Number(e.target.value))}
          style={styles.slider}
        />
        <span style={{ minWidth: '18px', textAlign: 'right' }}>{bounces}</span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button style={styles.btn} onClick={runSimulation}>
          Simulate
        </button>
        {simulation && (
          <button style={styles.btnSecondary} onClick={clearSimulation}>
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
