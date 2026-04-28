Original prompt: make a 2d orbital mechanic simulator

2026-04-28
- Scaffolded a new Vite + TypeScript browser project in `/Users/nathankratz/Games/orbital-mechanics-sim`.
- Replacing the starter with a deterministic 2D orbital sandbox: star, planet, moon, probe, burn controls, telemetry, prediction path, and testing hooks.
- Build passes with the custom simulator UI and renderer in place.
- Browser validation complete:
- `output/web-game-tuned/` confirmed the unburned parking orbit stays under planet influence after deterministic stepping.
- `output/web-game-burn-tuned/` confirmed a burn changes the orbit while keeping telemetry and on-screen motion aligned.
- Direct Playwright checks confirmed the control panel renders correctly, `#burn-btn` increments burns, and preset switching updates both DOM controls and `render_game_to_text`.
