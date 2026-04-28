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

## Controls

- `Space`: pause or resume
- `B`: execute the planned burn
- `R`: reset the active scenario
- `F`: toggle fullscreen
- mouse wheel: zoom

## Deployment

GitHub Pages deployment is configured through [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). The workflow computes the correct Vite `base` path automatically so the site works both as a user site and as a project site.
