# Pool Editor

Vite library-mode React component for pool table shot training and planning. Not a game — balls are placed statically, users draw shot lines and areas to plan training scenarios.

## Tech Stack
- React 18 + TypeScript, react-konva + konva for canvas rendering
- Vite 5 library mode — builds to ESM + UMD in `dist/`
- React Context + useReducer for state management (no external deps)
- **pnpm** for package management (npm is broken on this machine)

## Project Structure
- `src/components/` — PoolEditor (main), Toolbar, BallPalette, SimulationControls, PropertiesPanel, ImportExport
- `src/layers/` — Konva layers: Table, Ball, Cue, Shot, Area, Simulation
- `src/context/EditorContext.tsx` — central reducer with all editor actions
- `src/utils/physics.ts` — wall-bounce trajectory + event-based physics simulation (ball-ball collisions, friction, pockets)
- `src/utils/spline.ts` — catmull-rom to bezier conversion for smooth curves
- `src/utils/serialization.ts` — JSON import/export and state creation
- `src/hooks/useSimulation.ts` — simulation state hook (bounces, physics, friction, pockets)
- `src/types/index.ts` — all shared interfaces and constants

## Key Patterns
- Table coordinates are 900x450 abstract units (TABLE constants in types)
- `stateRef` pattern in PoolEditor keyboard handler to avoid stale closures
- Trajectory/simulation is derived data computed in render, not stored in state (for shot lines)
- Cue trajectory auto-computes via useEffect when cue, bounces, balls, or physics settings change
- All interactive elements use `listening={false}` on overlay/decoration elements to avoid blocking clicks
- `isEmptySpace` check in stage click handler prevents tool actions when clicking existing shapes
- All shots are curves (straight = collinear midpoint) — unified rendering, no branch swap
- Physics simulation is event-based (quadratic collision detection, elastic equal-mass collisions)

## Tools (5 buttons)
- SEL, BALL, CUE, SHOT, AREA
- No eraser — Delete/d key handles removal
- No separate curve tool — shots always have draggable midpoint handle

## Build & Dev
```bash
pnpm install
pnpm run dev      # dev sandbox at localhost:5173
pnpm run build    # produces dist/pool-editor.js + dist/pool-editor.umd.cjs
```

## GitHub
- Repo: https://github.com/TJaenichen/PoolEditor.git
- `gh` CLI is available for GitHub operations
