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
}

export function SimulationControls() {
  const { bounces, setBounces } = useSimulation()

  return (
    <div style={styles.panel}>
      <p style={styles.heading}>Bounces</p>
      <div style={styles.row}>
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
    </div>
  )
}
