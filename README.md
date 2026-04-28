# Orbital Mechanics Simulator

A 2D orbital sandbox built with Vite and TypeScript. The simulator models a star, planet, moon, and probe with deterministic gravity updates, trajectory prediction, and interactive burn controls.

## Features

- preset scenarios for parking orbit, transfers, escape, and lunar capture
- live telemetry for dominant body, altitude, periapsis, apoapsis, and eccentricity
- planned-burn preview with time warp, focus switching, zoom, and fullscreen
- deterministic `window.advanceTime(ms)` and `window.render_game_to_text()` hooks for browser automation

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## GitHub Pages Build

```bash
npm run build:pages
```

This rebuilds the app with the correct repository base path and refreshes the tracked `docs/` folder that GitHub Pages publishes.

## Controls

- `Space`: pause or resume
- `B`: execute the planned burn
- `R`: reset the active scenario
- `F`: toggle fullscreen
- mouse wheel: zoom

## Deployment

The live site is published from the `docs/` folder on `main` at:

- [https://sw0l1y.github.io/orbital-mechanics-sim/](https://sw0l1y.github.io/orbital-mechanics-sim/)

After changing the simulator, run `npm run build:pages`, commit the updated `docs/` output, and push `main`.
