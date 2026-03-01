# Pool Editor

Vite library-mode React component for pool table shot training and planning. Not a game — balls are placed statically, users draw shot lines and areas to plan training scenarios.

## Tech Stack
- React 18 + TypeScript, react-konva + konva for canvas rendering
- Vite 5 library mode — builds to ESM + UMD in `dist/`
- React Context + useReducer for state management (no external deps)
- **pnpm** for package management (npm is broken on this machine)

## Project Structure
- `src/components/` — PoolEditor (main), Toolbar, BallPalette, SimulationControls, PropertiesPanel
- `src/layers/` — Konva layers: Table, Ball, Cue, Shot, Area, Simulation
- `src/context/EditorContext.tsx` — central reducer with all editor actions
- `src/utils/` — physics (trajectory), spline (bezier), serialization, templates
- `src/hooks/useSimulation.ts` — bounce count hook
- `src/types/index.ts` — all shared interfaces and constants

## Key Patterns
- Table coordinates are 900×450 abstract units (TABLE constants in types)
- `stateRef` pattern in PoolEditor keyboard handler to avoid stale closures
- Konva refs for real-time visual updates during drag (crosshair lines)
- Trajectory/simulation is derived data computed in render, not stored in state (for shot lines)
- Cue trajectory auto-computes via useEffect when cue or bounce count changes
- All interactive elements use `listening={false}` on overlay/decoration elements to avoid blocking clicks
- `isEmptySpace` check in stage click handler prevents tool actions when clicking existing shapes

## Build & Dev
```bash
pnpm install
pnpm run dev      # dev sandbox at localhost:5173
pnpm run build    # produces dist/pool-editor.js + dist/pool-editor.umd.cjs
```

## GitHub
- Repo: https://github.com/TJaenichen/PoolEditor.git
- `gh` CLI is available for GitHub operations
