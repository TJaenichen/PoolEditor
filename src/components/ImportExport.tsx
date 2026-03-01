import { useRef } from 'react'
import { useEditor } from '../context/EditorContext'
import { toJSON, fromJSON } from '../utils/serialization'

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
  button: {
    padding: '6px 0',
    border: '1px solid #444',
    borderRadius: '4px',
    background: '#1a1a2e',
    color: '#ccc',
    fontSize: '11px',
    cursor: 'pointer',
  },
}

export function ImportExport() {
  const { state, dispatch } = useEditor()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const json = toJSON(state.tableState)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pool-table.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const tableState = fromJSON(reader.result as string)
        dispatch({ type: 'LOAD_STATE', state: tableState })
      } catch {
        // silently ignore invalid files
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-imported
    e.target.value = ''
  }

  return (
    <div style={styles.panel}>
      <p style={styles.heading}>Table</p>
      <button style={styles.button} onClick={handleExport}>Export JSON</button>
      <button style={styles.button} onClick={handleImport}>Import JSON</button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}
