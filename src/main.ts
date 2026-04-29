import './style.css'
import {
  PRESETS,
  TIME_SCALE_OPTIONS,
  type BurnPlan,
  type FocusId,
  type PredictionResult,
  computeOrbitalMetrics,
  computePrediction,
  computeSoiRadii,
  createSimulation,
  describeImpact,
  executeBurn,
  getEntityLabel,
  getEntityPosition,
  getDominantBody,
  getPlannedBurnVector,
  getPresetById,
  round,
  setBurnPlan,
  stepSimulation,
} from './sim.ts'
import { createStarfield, renderScene, type CameraState } from './render.ts'


const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('Missing app root')
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Missing element: ${selector}`)
  }
  return element
}

app.innerHTML = `
  <div class="shell">
    <aside class="control-panel">
      <div class="panel-copy">
        <p class="eyebrow">Orbital Sandbox</p>
        <h1>2D Orbital Mechanics Simulator</h1>
        <p class="lede">Plan a burn, inspect the projected path, and push the probe through star, planet, and moon gravity wells.</p>
      </div>

      <div class="card">
        <label class="field">
          <span>Scenario</span>
          <select id="preset-select"></select>
        </label>
        <p id="preset-summary" class="muted"></p>
        <p id="preset-objective" class="objective"></p>
      </div>

      <div class="card">
        <div class="field">
          <div class="field-row">
            <span>Burn magnitude</span>
            <strong id="burn-magnitude-value">0.00</strong>
          </div>
          <input id="burn-magnitude" type="range" min="0" max="8" step="0.05" />
        </div>
        <div class="field">
          <div class="field-row">
            <span>Burn angle</span>
            <strong id="burn-angle-value">0°</strong>
          </div>
          <input id="burn-angle" type="range" min="-180" max="180" step="1" />
        </div>
        <div class="field">
          <div class="field-row">
            <span>Time warp</span>
            <strong id="time-scale-value">1x</strong>
          </div>
          <input id="time-scale" type="range" min="0" max="${TIME_SCALE_OPTIONS.length - 1}" step="1" />
        </div>
        <div class="field">
          <div class="field-row">
            <span>Camera focus</span>
            <select id="focus-select">
              <option value="star">Star</option>
              <option value="planet">Planet</option>
              <option value="moon">Moon</option>
              <option value="probe">Probe</option>
            </select>
          </div>
        </div>
        <div class="field">
          <div class="field-row">
            <span>Zoom</span>
            <strong id="zoom-value">1.00x</strong>
          </div>
          <input id="zoom" type="range" min="0.65" max="2.25" step="0.01" />
        </div>
      </div>

      <div class="button-row">
        <button id="burn-btn" class="primary" type="button">Execute Burn</button>
        <button id="pause-btn" type="button">Run</button>
        <button id="step-btn" type="button">Step +5s</button>
        <button id="reset-btn" type="button">Reset</button>
      </div>

      <div class="toggles">
        <label><input id="prediction-toggle" type="checkbox" checked /> Show prediction</label>
        <label><input id="trails-toggle" type="checkbox" checked /> Show trails</label>
      </div>

      <div class="card stats-card">
        <div class="soi-indicator">
          <span class="soi-dot" id="soi-dot"></span>
          <span class="stat-label">Orbiting</span>
          <strong id="metric-body">—</strong>
        </div>
        <div class="stats-grid">
          <div>
            <span class="stat-label">Altitude</span>
            <strong id="metric-altitude">0</strong>
          </div>
          <div>
            <span class="stat-label">Speed</span>
            <strong id="metric-speed">0</strong>
          </div>
          <div>
            <span class="stat-label pe-label">Periapsis</span>
            <strong id="metric-periapsis" class="pe-value">—</strong>
          </div>
          <div>
            <span class="stat-label ap-label">Apoapsis</span>
            <strong id="metric-apoapsis" class="ap-value">—</strong>
          </div>
          <div>
            <span class="stat-label">Eccentricity</span>
            <strong id="metric-eccentricity">0</strong>
          </div>
          <div>
            <span class="stat-label">Period</span>
            <strong id="metric-period">—</strong>
          </div>
          <div class="stats-full">
            <span class="stat-label">Orbit class</span>
            <strong id="metric-class">—</strong>
          </div>
        </div>
      </div>

      <div class="card shortcuts">
        <p><strong>Keys</strong> Space pause or run, <span class="mono">B</span> burn, <span class="mono">R</span> reset, <span class="mono">F</span> fullscreen, wheel zoom.</p>
        <p id="status-line" class="muted"></p>
      </div>
    </aside>

    <section class="viewport-panel">
      <div class="viewport-header">
        <div>
          <p class="eyebrow">Live View</p>
          <h2 id="focus-label">Focused on Tethys</h2>
        </div>
        <div class="header-metrics">
          <div>
            <span class="stat-label">Sim time</span>
            <strong id="sim-time">0.0s</strong>
          </div>
          <div>
            <span class="stat-label">Burns</span>
            <strong id="burn-count">0</strong>
          </div>
        </div>
      </div>
      <div class="canvas-shell">
        <canvas id="sim-canvas" aria-label="2D orbital mechanics simulator"></canvas>
      </div>
    </section>
  </div>
`

const presetSelect = requireElement<HTMLSelectElement>('#preset-select')
const presetSummary = requireElement<HTMLParagraphElement>('#preset-summary')
const presetObjective = requireElement<HTMLParagraphElement>('#preset-objective')
const burnMagnitudeInput = requireElement<HTMLInputElement>('#burn-magnitude')
const burnMagnitudeValue = requireElement<HTMLElement>('#burn-magnitude-value')
const burnAngleInput = requireElement<HTMLInputElement>('#burn-angle')
const burnAngleValue = requireElement<HTMLElement>('#burn-angle-value')
const timeScaleInput = requireElement<HTMLInputElement>('#time-scale')
const timeScaleValue = requireElement<HTMLElement>('#time-scale-value')
const focusSelect = requireElement<HTMLSelectElement>('#focus-select')
const zoomInput = requireElement<HTMLInputElement>('#zoom')
const zoomValue = requireElement<HTMLElement>('#zoom-value')
const burnButton = requireElement<HTMLButtonElement>('#burn-btn')
const pauseButton = requireElement<HTMLButtonElement>('#pause-btn')
const stepButton = requireElement<HTMLButtonElement>('#step-btn')
const resetButton = requireElement<HTMLButtonElement>('#reset-btn')
const predictionToggle = requireElement<HTMLInputElement>('#prediction-toggle')
const trailsToggle = requireElement<HTMLInputElement>('#trails-toggle')
const metricBody = requireElement<HTMLElement>('#metric-body')
const soiDot = requireElement<HTMLElement>('#soi-dot')
const metricAltitude = requireElement<HTMLElement>('#metric-altitude')
const metricSpeed = requireElement<HTMLElement>('#metric-speed')
const metricPeriapsis = requireElement<HTMLElement>('#metric-periapsis')
const metricApoapsis = requireElement<HTMLElement>('#metric-apoapsis')
const metricEccentricity = requireElement<HTMLElement>('#metric-eccentricity')
const metricPeriod = requireElement<HTMLElement>('#metric-period')
const metricClass = requireElement<HTMLElement>('#metric-class')
const statusLine = requireElement<HTMLElement>('#status-line')
const focusLabel = requireElement<HTMLElement>('#focus-label')
const simTimeLabel = requireElement<HTMLElement>('#sim-time')
const burnCountLabel = requireElement<HTMLElement>('#burn-count')
const canvas = requireElement<HTMLCanvasElement>('#sim-canvas')

const rawContext = canvas.getContext('2d')
if (!rawContext) {
  throw new Error('Canvas 2D context unavailable')
}
const ctx: CanvasRenderingContext2D = rawContext

const starfield = createStarfield()
let simulation = createSimulation()
let running = false
let timeScaleIndex = getPresetById(simulation.presetId).recommendedTimeScaleIndex
let focusId: FocusId = getPresetById(simulation.presetId).recommendedFocus
let desiredZoom = getPresetById(simulation.presetId).recommendedZoom
let canvasWidth = 0
let canvasHeight = 0
let predictionNeedsRefresh = true
let predictionTimer = 0
let predictionPoints: PredictionResult = computePrediction(simulation, true)
let soiRadii = computeSoiRadii(simulation.bodies)
let pePosition: { x: number; y: number } | null = null
let apPosition: { x: number; y: number } | null = null
const camera: CameraState = {
  center: getEntityPosition(simulation, focusId),
  zoom: desiredZoom,
}

function formatDistance(value: number | null): string {
  if (value === null) {
    return 'open'
  }
  return `${round(value, 1)} u`
}

function formatSpeed(value: number): string {
  return `${round(value, 2)} u/s`
}

function populatePresetOptions(): void {
  presetSelect.innerHTML = PRESETS.map((preset) => `<option value="${preset.id}">${preset.name}</option>`).join('')
}

function applyPresetDetails(): void {
  const preset = getPresetById(simulation.presetId)
  presetSelect.value = preset.id
  presetSummary.textContent = preset.summary
  presetObjective.textContent = preset.objective

  burnMagnitudeInput.value = `${simulation.burnPlan.magnitude}`
  burnAngleInput.value = `${simulation.burnPlan.angleDeg}`
  burnMagnitudeValue.textContent = `${round(simulation.burnPlan.magnitude, 2)} u/s`
  burnAngleValue.textContent = `${round(simulation.burnPlan.angleDeg, 0)}°`

  timeScaleIndex = preset.recommendedTimeScaleIndex
  timeScaleInput.value = `${timeScaleIndex}`
  timeScaleValue.textContent = `${TIME_SCALE_OPTIONS[timeScaleIndex]}x`

  focusId = preset.recommendedFocus
  focusSelect.value = focusId
  desiredZoom = preset.recommendedZoom
  zoomInput.value = `${desiredZoom}`
  zoomValue.textContent = `${round(desiredZoom, 2)}x`
}

function getCurrentTimeScale(): number {
  return TIME_SCALE_OPTIONS[timeScaleIndex]
}

function setBurnControls(burnPlan: BurnPlan): void {
  setBurnPlan(simulation, burnPlan)
  burnMagnitudeInput.value = `${simulation.burnPlan.magnitude}`
  burnAngleInput.value = `${simulation.burnPlan.angleDeg}`
  burnMagnitudeValue.textContent = `${round(simulation.burnPlan.magnitude, 2)} u/s`
  burnAngleValue.textContent = `${round(simulation.burnPlan.angleDeg, 0)}°`
  predictionNeedsRefresh = true
}

function loadPreset(presetId: string): void {
  simulation = createSimulation(presetId)
  running = false
  soiRadii = computeSoiRadii(simulation.bodies)
  applyPresetDetails()
  camera.center = getEntityPosition(simulation, focusId)
  camera.zoom = desiredZoom
  predictionPoints = computePrediction(simulation, true)
  const metrics = computeOrbitalMetrics(simulation)
  findOrbitMarkers(predictionPoints, metrics.energy < 0)
  predictionNeedsRefresh = false
  syncUi()
}

function syncCanvasSize(): void {
  const rect = canvas.getBoundingClientRect()
  const nextWidth = Math.max(1, Math.round(rect.width))
  const nextHeight = Math.max(1, Math.round(rect.height))
  if (nextWidth === canvasWidth && nextHeight === canvasHeight) {
    return
  }

  canvasWidth = nextWidth
  canvasHeight = nextHeight
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(nextWidth * dpr)
  canvas.height = Math.round(nextHeight * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

const SOI_COLORS: Record<string, string> = {
  star: '#f3b35f',
  planet: '#71d3d7',
  moon: '#d7dbf9',
}

function formatPeriod(seconds: number | null): string {
  if (seconds === null) return '—'
  if (seconds < 60) return `${round(seconds, 1)}s`
  if (seconds < 3600) return `${round(seconds / 60, 1)}m`
  return `${round(seconds / 3600, 2)}h`
}

function syncUi(): void {
  const metrics = computeOrbitalMetrics(simulation)
  const impactLabel = describeImpact(simulation)

  metricBody.textContent = metrics.dominantBodyName
  soiDot.style.background = SOI_COLORS[metrics.dominantBodyId] ?? '#fff'
  metricAltitude.textContent = `${round(metrics.altitude, 1)} u`
  metricSpeed.textContent = formatSpeed(metrics.speed)
  metricPeriapsis.textContent = formatDistance(metrics.periapsis)
  metricApoapsis.textContent = formatDistance(metrics.apoapsis)
  metricEccentricity.textContent = `${round(metrics.eccentricity, 3)}`
  metricPeriod.textContent = formatPeriod(metrics.period)
  metricClass.textContent = metrics.orbitClass

  pauseButton.textContent = running ? 'Pause' : 'Run'
  focusLabel.textContent = `Focused on ${getEntityLabel(simulation, focusId)}`
  simTimeLabel.textContent = `${round(simulation.time, 1)}s`
  burnCountLabel.textContent = `${simulation.burnsExecuted}`

  if (impactLabel) {
    statusLine.textContent = `Impact detected on ${impactLabel}. Reset the scenario to fly again.`
  } else {
    statusLine.textContent = `Probe under ${metrics.dominantBodyName} influence. Planned burn is referenced to local prograde.`
  }
}


function findOrbitMarkers(result: PredictionResult, isBoundOrbit: boolean): void {
  const { points, soiBodyIds } = result
  if (points.length < 3) {
    pePosition = null
    apPosition = null
    return
  }

  const dominantBody = getDominantBody(simulation)
  const startSoi = soiBodyIds[0]
  let minDist = Infinity
  let maxDist = -Infinity
  pePosition = null
  apPosition = null

  for (let i = 1; i < points.length; i += 1) {
    if (soiBodyIds[i] !== startSoi) break
    const dx = points[i].x - dominantBody.position.x
    const dy = points[i].y - dominantBody.position.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist) {
      minDist = dist
      pePosition = points[i]
    }
    if (isBoundOrbit && dist > maxDist) {
      maxDist = dist
      apPosition = points[i]
    }
  }
}

function refreshPrediction(force = false): void {
  predictionTimer += force ? 999 : 0
  if (!predictionNeedsRefresh && predictionTimer < 0.25) {
    return
  }
  predictionPoints = computePrediction(simulation, predictionToggle.checked)
  const metrics = computeOrbitalMetrics(simulation)
  findOrbitMarkers(predictionPoints, metrics.energy < 0)
  predictionNeedsRefresh = false
  predictionTimer = 0
}

function stepAndRefresh(seconds: number): void {
  stepSimulation(simulation, seconds)
  predictionNeedsRefresh = true
  refreshPrediction(true)
  syncUi()
}

function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen()
    return
  }
  void canvas.parentElement?.requestFullscreen()
}

function renderFrame(): void {
  syncCanvasSize()
  const targetCenter = getEntityPosition(simulation, focusId)
  camera.center = {
    x: camera.center.x + (targetCenter.x - camera.center.x) * 0.1,
    y: camera.center.y + (targetCenter.y - camera.center.y) * 0.1,
  }
  camera.zoom += (desiredZoom - camera.zoom) * 0.12

  renderScene(ctx, starfield, simulation.bodies, simulation.probe, camera, {
    width: canvasWidth,
    height: canvasHeight,
    showTrails: trailsToggle.checked,
    showPrediction: predictionToggle.checked,
    prediction: predictionPoints,
    burnVector: predictionToggle.checked ? getPlannedBurnVector(simulation) : { x: 0, y: 0 },
    highlightId: focusId,
    soiRadii,
    pePosition,
    apPosition,
  })
}

populatePresetOptions()
applyPresetDetails()
syncUi()
refreshPrediction(true)

presetSelect.addEventListener('change', () => {
  loadPreset(presetSelect.value)
})

burnMagnitudeInput.addEventListener('input', () => {
  setBurnControls({
    magnitude: Number(burnMagnitudeInput.value),
    angleDeg: simulation.burnPlan.angleDeg,
  })
  syncUi()
})

burnAngleInput.addEventListener('input', () => {
  setBurnControls({
    magnitude: simulation.burnPlan.magnitude,
    angleDeg: Number(burnAngleInput.value),
  })
  syncUi()
})

timeScaleInput.addEventListener('input', () => {
  timeScaleIndex = Number(timeScaleInput.value)
  timeScaleValue.textContent = `${TIME_SCALE_OPTIONS[timeScaleIndex]}x`
})

focusSelect.addEventListener('change', () => {
  focusId = focusSelect.value as FocusId
  focusLabel.textContent = `Focused on ${getEntityLabel(simulation, focusId)}`
})

zoomInput.addEventListener('input', () => {
  desiredZoom = Number(zoomInput.value)
  zoomValue.textContent = `${round(desiredZoom, 2)}x`
})

predictionToggle.addEventListener('change', () => {
  predictionNeedsRefresh = true
  refreshPrediction(true)
})

trailsToggle.addEventListener('change', () => {
  renderFrame()
})

burnButton.addEventListener('click', () => {
  executeBurn(simulation)
  running = true
  predictionNeedsRefresh = true
  refreshPrediction(true)
  syncUi()
})

pauseButton.addEventListener('click', () => {
  running = !running
  syncUi()
})

stepButton.addEventListener('click', () => {
  running = false
  stepAndRefresh(5)
})

resetButton.addEventListener('click', () => {
  loadPreset(simulation.presetId)
})

canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault()
    const direction = event.deltaY > 0 ? 0.92 : 1.08
    desiredZoom = Math.max(0.65, Math.min(2.25, desiredZoom * direction))
    zoomInput.value = `${desiredZoom}`
    zoomValue.textContent = `${round(desiredZoom, 2)}x`
  },
  { passive: false },
)

document.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
    return
  }

  if (event.key === ' ') {
    event.preventDefault()
    running = !running
    syncUi()
  } else if (event.key.toLowerCase() === 'b') {
    executeBurn(simulation)
    running = true
    predictionNeedsRefresh = true
    refreshPrediction(true)
    syncUi()
  } else if (event.key.toLowerCase() === 'r') {
    loadPreset(simulation.presetId)
  } else if (event.key.toLowerCase() === 'f') {
    event.preventDefault()
    toggleFullscreen()
  }
})

let lastFrame = performance.now()
function animate(timestamp: number): void {
  const deltaSeconds = Math.min(0.05, (timestamp - lastFrame) / 1000)
  lastFrame = timestamp

  if (running) {
    stepSimulation(simulation, deltaSeconds * getCurrentTimeScale())
    predictionTimer += deltaSeconds
    predictionNeedsRefresh = predictionNeedsRefresh || predictionTimer >= 0.25
    if (simulation.probe.impactBodyId) {
      running = false
    }
  }

  refreshPrediction()
  syncUi()
  renderFrame()
  window.requestAnimationFrame(animate)
}

window.requestAnimationFrame(animate)
