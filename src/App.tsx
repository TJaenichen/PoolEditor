import { PoolEditor } from './index'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
      <PoolEditor
        width={1100}
        simulationBounces={3}
        onChange={(state) => console.log('state changed', state)}
      />
    </div>
  )
}
