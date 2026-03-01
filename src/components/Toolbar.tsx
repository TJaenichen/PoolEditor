import { useEditor } from '../context/EditorContext'
import { Tool } from '../types'

const TOOLS: { tool: Tool; label: string; title: string }[] = [
  { tool: 'select', label: 'SEL', title: 'Select & Move' },
  { tool: 'place-ball', label: 'BALL', title: 'Place Ball' },
  { tool: 'place-cue', label: 'CUE', title: 'Place Cue' },
  { tool: 'shot-straight', label: 'LINE', title: 'Straight Shot' },
  { tool: 'shot-curve', label: 'CURV', title: 'Curve Shot' },
  { tool: 'draw-area', label: 'AREA', title: 'Draw Area' },
  { tool: 'eraser', label: 'DEL', title: 'Eraser' },
]

const styles = {
  toolbar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '8px',
    background: '#2a2a3e',
    borderRadius: '6px',
  },
  button: {
    width: '44px',
    height: '44px',
    border: '1px solid #444',
    borderRadius: '4px',
    background: '#1a1a2e',
    color: '#ccc',
    fontSize: '10px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  active: {
    background: '#3a5fcd',
    color: '#fff',
    borderColor: '#5a7fef',
  },
}

export function Toolbar() {
  const { state, dispatch } = useEditor()

  return (
    <div style={styles.toolbar}>
      {TOOLS.map(({ tool, label, title }) => (
        <button
          key={tool}
          title={title}
          style={{
            ...styles.button,
            ...(state.activeTool === tool ? styles.active : {}),
          }}
          onClick={() => dispatch({ type: 'SET_TOOL', tool })}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
