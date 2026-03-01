import { useEditor } from '../context/EditorContext'

const styles = {
  panel: {
    padding: '8px',
    background: '#2a2a3e',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    minWidth: '160px',
  },
  heading: {
    color: '#aaa',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    margin: 0,
  },
  label: {
    color: '#999',
    fontSize: '11px',
    marginBottom: '2px',
  },
  input: {
    width: '100%',
    padding: '4px 6px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '3px',
    color: '#ccc',
    fontSize: '12px',
    outline: 'none',
  },
  deleteBtn: {
    padding: '6px',
    background: '#8b0000',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '11px',
    cursor: 'pointer',
    marginTop: '4px',
  },
  empty: {
    color: '#666',
    fontSize: '11px',
    fontStyle: 'italic' as const,
  },
}

export function PropertiesPanel() {
  const { state, dispatch } = useEditor()
  const { selectedId } = state
  const { balls, shots, areas } = state.tableState

  if (!selectedId) {
    return (
      <div style={styles.panel}>
        <p style={styles.heading}>Properties</p>
        <p style={styles.empty}>Select an item to edit</p>
      </div>
    )
  }

  const selectedBall = balls.find((b) => b.id === selectedId)
  const selectedShot = shots.find((s) => s.id === selectedId)
  const selectedArea = areas.find((a) => a.id === selectedId)

  return (
    <div style={styles.panel}>
      <p style={styles.heading}>Properties</p>

      {selectedBall && (
        <>
          <p style={styles.label}>Ball #{selectedBall.number}</p>
          <p style={styles.label}>
            Position: ({selectedBall.position.x.toFixed(0)}, {selectedBall.position.y.toFixed(0)})
          </p>
          <button style={styles.deleteBtn} onClick={() => dispatch({ type: 'REMOVE_BALL', id: selectedId })}>
            Remove Ball
          </button>
        </>
      )}

      {selectedShot && (
        <>
          <p style={styles.label}>Shot ({selectedShot.type})</p>
          <div>
            <span style={styles.label}>Label:</span>
            <input
              style={styles.input}
              value={selectedShot.label || ''}
              onChange={(e) => dispatch({ type: 'UPDATE_SHOT', id: selectedId, changes: { label: e.target.value } })}
              placeholder="Shot label..."
            />
          </div>
          <div>
            <span style={styles.label}>Color:</span>
            <input
              type="color"
              value={selectedShot.color || '#FFFF00'}
              onChange={(e) => dispatch({ type: 'UPDATE_SHOT', id: selectedId, changes: { color: e.target.value } })}
              style={{ ...styles.input, height: '28px', padding: '2px', cursor: 'pointer' }}
            />
          </div>
          <button style={styles.deleteBtn} onClick={() => dispatch({ type: 'REMOVE_SHOT', id: selectedId })}>
            Remove Shot
          </button>
        </>
      )}

      {selectedArea && (
        <>
          <p style={styles.label}>Area ({selectedArea.type}, {selectedArea.points.length} pts)</p>
          <div>
            <span style={styles.label}>Label:</span>
            <input
              style={styles.input}
              value={selectedArea.label || ''}
              onChange={(e) => dispatch({ type: 'UPDATE_AREA', id: selectedId, changes: { label: e.target.value } })}
              placeholder="Area label..."
            />
          </div>
          <div>
            <span style={styles.label}>Fill:</span>
            <input
              type="color"
              value={selectedArea.fill || '#ffff00'}
              onChange={(e) => dispatch({ type: 'UPDATE_AREA', id: selectedId, changes: { fill: e.target.value + '26' } })}
              style={{ ...styles.input, height: '28px', padding: '2px', cursor: 'pointer' }}
            />
          </div>
          <div>
            <span style={styles.label}>Stroke:</span>
            <input
              type="color"
              value={selectedArea.stroke || '#FFD700'}
              onChange={(e) => dispatch({ type: 'UPDATE_AREA', id: selectedId, changes: { stroke: e.target.value } })}
              style={{ ...styles.input, height: '28px', padding: '2px', cursor: 'pointer' }}
            />
          </div>
          <div>
            <span style={styles.label}>Opacity:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selectedArea.opacity ?? 0.6}
              onChange={(e) => dispatch({ type: 'UPDATE_AREA', id: selectedId, changes: { opacity: Number(e.target.value) } })}
              style={styles.input}
            />
          </div>
          <button style={styles.deleteBtn} onClick={() => dispatch({ type: 'REMOVE_AREA', id: selectedId })}>
            Remove Area
          </button>
        </>
      )}
    </div>
  )
}
