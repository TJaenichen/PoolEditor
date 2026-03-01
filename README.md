# Pool Editor

A React component for pool table shot training and planning. Place balls, draw shot lines, and visualize trajectories with physics simulation. Not a game — designed for planning training scenarios.

Built with React 18, TypeScript, and [react-konva](https://github.com/konvajs/react-konva) for canvas rendering. Packaged as a Vite library (ESM + UMD) with no external state management dependencies.

## Install

```bash
npm install github:TJaenichen/PoolEditor
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

## Quick Start

```tsx
import { PoolEditor } from 'pool-editor'

function App() {
  return (
    <PoolEditor
      width={1100}
      simulationBounces={3}
      onChange={(state) => {
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
| `simulationBounces` | `number` | `0` | Default bounce count for trajectory simulation (0-10) |
| `className` | `string` | `undefined` | CSS class for the root container |
| `style` | `CSSProperties` | `undefined` | Inline styles for the root container |

## Tools

- **SEL** — Select and move balls, cue, shots, and areas
- **BALL** — Pick a ball from the palette, click the table to place it
- **CUE** — Click and drag to place the cue stick with position and angle
- **SHOT** — Click start point, click end point. Drag the midpoint handle to curve it. Double-click a shot to reset to straight.
- **AREA** — Click to add polygon vertices, double-click to close the shape

### Keyboard Shortcuts

- **Arrow keys** — Move selected ball or cue (Shift for fine control)
- **Q / E** — Rotate selected cue (Shift for 1-degree increments)
- **Delete / D** — Remove selected element
- **Escape** — Deselect

## Templates

Click **8-Ball Rack** or **9-Ball Rack** in the ball palette to pre-fill a standard setup.

## Simulation

- **Bounces slider** (0-10) — Shows wall-bounce trajectory from the cue tip
- **Physics toggle** — Enables ball-to-ball elastic collision simulation
- **Friction slider** — Controls how far balls travel before stopping (physics mode)
- **Pockets toggle** — Enables pocket detection; balls reaching pockets are captured (physics mode, default on)

All trajectories update live as you move the cue, balls, or shot control points.

## Import / Export

- **Export JSON** — Downloads the current table state as a `.json` file
- **Import JSON** — Loads a previously saved table state from a `.json` file

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

## Table Coordinates

The playing surface uses abstract units: 900 wide x 450 tall. Ball radius is 11, pocket radius is 18. All positions in `PoolTableState` use these coordinates.

## Utility Exports

```ts
import {
  toJSON,            // (state) => JSON string
  fromJSON,          // (json) => PoolTableState
  createEmptyState,
  eightBallRack,     // () => { balls, cue }
  nineBallRack,
  computeTrajectory, // simple wall-bounce trajectory
  simulatePhysics,   // full physics with ball collisions
  BALL_COLORS,
  TABLE,
} from 'pool-editor'
```

## Development

```bash
pnpm install
pnpm run dev     # Dev server with hot reload
pnpm run build   # Builds dist/pool-editor.js + UMD + .d.ts
```

## License

MIT
