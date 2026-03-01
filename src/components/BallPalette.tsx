import { useEditor } from '../context/EditorContext'
import { BALL_COLORS } from '../types'
import { eightBallRack, nineBallRack } from '../utils/templates'

const styles = {
  palette: {
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '4px',
  },
  ball: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '2px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 'bold' as const,
    color: '#fff',
    transition: 'border-color 0.15s',
  },
  selected: {
    borderColor: '#FFD700',
  },
  placed: {
    opacity: 0.35,
    cursor: 'default' as const,
  },
  templateBtn: {
    padding: '6px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#ccc',
    fontSize: '11px',
    cursor: 'pointer',
  },
}

export function BallPalette() {
  const { state, dispatch } = useEditor()
  const placedNumbers = new Set(state.tableState.balls.map((b) => b.number))

  function selectBallNumber(num: number) {
    if (placedNumbers.has(num)) return
    dispatch({ type: 'SET_SELECTED_BALL_NUMBER', num })
    if (state.activeTool !== 'place-ball') {
      dispatch({ type: 'SET_TOOL', tool: 'place-ball' })
    }
  }

  function loadTemplate(templateFn: () => { balls: typeof state.tableState.balls; cue: NonNullable<typeof state.tableState.cue> }) {
    const template = templateFn()
    dispatch({ type: 'CLEAR_ALL' })
    for (const ball of template.balls) {
      dispatch({ type: 'ADD_BALL', ball })
    }
    dispatch({ type: 'SET_CUE', cue: template.cue })
    dispatch({ type: 'SET_TOOL', tool: 'select' })
  }

  return (
    <div style={styles.palette}>
      <p style={styles.heading}>Balls</p>
      <div style={styles.grid}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => {
          const colors = BALL_COLORS[num]
          const isPlaced = placedNumbers.has(num)
          const isSelected = state.selectedBallNumber === num && state.activeTool === 'place-ball'
          return (
            <div
              key={num}
              title={num === 0 ? 'Cue Ball' : `Ball ${num}`}
              style={{
                ...styles.ball,
                background: colors.fill,
                ...(isSelected ? styles.selected : {}),
                ...(isPlaced ? styles.placed : {}),
              }}
              onClick={() => selectBallNumber(num)}
            >
              <span style={{ color: num === 0 || num === 1 || num === 5 || num === 9 || num === 13 ? '#000' : '#fff', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                {num === 0 ? 'C' : num}
              </span>
            </div>
          )
        })}
      </div>
      <p style={{ ...styles.heading, marginTop: '4px' }}>Templates</p>
      <button style={styles.templateBtn} onClick={() => loadTemplate(eightBallRack)}>
        8-Ball Rack
      </button>
      <button style={styles.templateBtn} onClick={() => loadTemplate(nineBallRack)}>
        9-Ball Rack
      </button>
    </div>
  )
}
