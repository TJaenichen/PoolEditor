# Pool Editor

A React component for creating and editing pool table training diagrams. Place balls, draw shots (straight and curved), simulate cue ball trajectories with bounces, and draw highlight areas — all exportable as JSON.

## Install

```bash
npm install github:TJaenichen/PoolEditor
```

Peer dependencies: `react >= 18`, `react-dom >= 18`, `konva >= 9`, `react-konva >= 18`.

## Quick Start

```tsx
import { PoolEditor } from 'pool-editor'

function App() {
  return (
    <PoolEditor
      width={1100}
      simulationBounces={3}
      onChange={(state) => {
        // Send to your API
        fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        })
      }}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialState` | `Partial<PoolTableState>` | `undefined` | Pre-populate the editor with saved state |
| `onChange` | `(state: PoolTableState) => void` | `undefined` | Fires on every edit with the full state |
| `readOnly` | `boolean` | `false` | Disables all editing (view-only mode) |
| `width` | `number \| string` | `900` | Width of the editor canvas in pixels |
| `simulationBounces` | `number` | `0` | Default number of cushion bounces for simulation (0–10) |
| `className` | `string` | `undefined` | CSS class for the root container |
| `style` | `CSSProperties` | `undefined` | Inline styles for the root container |

## Tools

- **Select** — Click to select balls, shots, or areas. Drag to reposition.
- **Place Ball** — Pick a ball from the palette, click the table to place it.
- **Place Cue** — Click to position the cue stick; drag the handle to rotate.
- **Straight Shot** — Click start point, click end point → arrow drawn.
- **Curve Shot** — Click to add control points, double-click to finish → smooth bezier curve.
- **Draw Area** — Click to add polygon vertices, double-click to close the shape.
- **Eraser** — Click any item to remove it.

## Templates

Click **8-Ball Rack** or **9-Ball Rack** in the ball palette to pre-fill a standard setup.

## Simulation

1. Place a cue ball and draw at least one shot line from it.
2. Set the bounce count (0–10) in the Simulation panel.
3. Click **Simulate** — the trajectory animates across the table with bounce reflections.

## JSON Format

The `PoolTableState` is a plain JSON object:

```json
{
  "version": "1",
  "balls": [
    { "id": "cue", "number": 0, "position": { "x": 225, "y": 225 } }
  ],
  "cue": { "position": { "x": 225, "y": 225 }, "angle": 0 },
  "shots": [],
  "areas": []
}
```

## Utility Exports

```ts
import {
  toJSON,          // (state) => JSON string
  fromJSON,        // (json) => PoolTableState
  createEmptyState,
  eightBallRack,   // () => { balls, cue }
  nineBallRack,
  computeTrajectory,
  BALL_COLORS,
  TABLE,
} from 'pool-editor'
```

## Development

```bash
pnpm install
pnpm run dev     # Dev server at http://localhost:5173
pnpm run build   # Builds dist/pool-editor.js + UMD + .d.ts
```

## License

MIT
