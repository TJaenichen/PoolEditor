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
  checkbox: {
    cursor: 'pointer',
  },
  label: {
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
}

export function SimulationControls() {
  const {
    bounces, setBounces,
    physicsEnabled, setPhysicsEnabled,
    friction, setFriction,
    pocketsEnabled, setPocketsEnabled,
  } = useSimulation()

  return (
    <div style={styles.panel}>
      <p style={styles.heading}>Simulation</p>
      <div style={styles.row}>
        <span>Bounces</span>
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
      <div style={styles.row}>
        <input
          id="physics-toggle"
          type="checkbox"
          checked={physicsEnabled}
          onChange={(e) => setPhysicsEnabled(e.target.checked)}
          style={styles.checkbox}
        />
        <label htmlFor="physics-toggle" style={styles.label}>Physics</label>
      </div>
      {physicsEnabled && (
        <>
          <div style={styles.row}>
            <span>Friction</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(friction * 100)}
              onChange={(e) => setFriction(Number(e.target.value) / 100)}
              style={styles.slider}
            />
            <span style={{ minWidth: '28px', textAlign: 'right' }}>{Math.round(friction * 100)}%</span>
          </div>
          <div style={styles.row}>
            <input
              id="pockets-toggle"
              type="checkbox"
              checked={pocketsEnabled}
              onChange={(e) => setPocketsEnabled(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="pockets-toggle" style={styles.label}>Pockets</label>
          </div>
        </>
      )}
    </div>
  )
}
