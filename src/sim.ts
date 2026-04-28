export interface Vec {
  x: number
  y: number
}

export type BodyId = 'star' | 'planet' | 'moon'
export type FocusId = BodyId | 'probe'

export interface Body {
  id: BodyId
  name: string
  mass: number
  radius: number
  color: string
  glow: string
  position: Vec
  velocity: Vec
  trail: Vec[]
  fixed?: boolean
}

export interface Probe {
  name: string
  radius: number
  color: string
  glow: string
  position: Vec
  velocity: Vec
  trail: Vec[]
  impactBodyId: BodyId | null
}

export interface BurnPlan {
  magnitude: number
  angleDeg: number
}

export interface PresetDefinition {
  id: string
  name: string
  summary: string
  objective: string
  anchorId: BodyId
  parentId: BodyId
  orbitRadius: number
  phaseDeg: number
  speedFactor: number
  burnMagnitude: number
  burnAngleDeg: number
  recommendedZoom: number
  recommendedFocus: FocusId
  recommendedTimeScaleIndex: number
}

export interface SimulationState {
  presetId: string
  bodies: Body[]
  probe: Probe
  burnPlan: BurnPlan
  time: number
  burnsExecuted: number
  trailAccumulator: number
}

export interface OrbitalMetrics {
  dominantBodyId: BodyId
  dominantBodyName: string
  altitude: number
  distance: number
  speed: number
  relativeSpeed: number
  energy: number
  eccentricity: number
  periapsis: number | null
  apoapsis: number | null
  orbitClass: string
}

const GRAVITY_SOFTENING = 6
const FIXED_DT = 1 / 120
const TRAIL_SAMPLE_INTERVAL = 1 / 14
const MAX_TRAIL_POINTS = 720
const PREDICTION_DT = 1 / 60
const PREDICTION_STEPS = 2200
const PREDICTION_SAMPLE_STRIDE = 6

export const TIME_SCALE_OPTIONS = [0.25, 1, 5, 10, 25, 50, 100] as const

export const PRESETS: PresetDefinition[] = [
  {
    id: 'parking-orbit',
    name: 'Parking Orbit',
    summary: 'A stable low orbit around the ocean planet. Use small burns to shape the ellipse without leaving the planet well.',
    objective: 'Raise apoapsis or circularize after a short retro/prograde test burn.',
    anchorId: 'planet',
    parentId: 'star',
    orbitRadius: 28,
    phaseDeg: 110,
    speedFactor: 1,
    burnMagnitude: 0.35,
    burnAngleDeg: 0,
    recommendedZoom: 1.28,
    recommendedFocus: 'planet',
    recommendedTimeScaleIndex: 2,
  },
  {
    id: 'moon-transfer',
    name: 'Moon Transfer',
    summary: 'Start from low orbit around the planet with a stronger prograde burn aimed at a lunar encounter.',
    objective: 'Thread the transfer so the moon becomes the dominant body before apoapsis drifts away.',
    anchorId: 'planet',
    parentId: 'star',
    orbitRadius: 28,
    phaseDeg: 164,
    speedFactor: 1,
    burnMagnitude: 3.4,
    burnAngleDeg: -2,
    recommendedZoom: 1.05,
    recommendedFocus: 'planet',
    recommendedTimeScaleIndex: 3,
  },
  {
    id: 'free-return',
    name: 'Free Return',
    summary: 'A slightly canted burn that can loop the probe around the moon and bend it back toward the planet.',
    objective: 'Keep the burn light enough to remain planet-bound while still clipping the moon sphere of influence.',
    anchorId: 'planet',
    parentId: 'star',
    orbitRadius: 28,
    phaseDeg: 152,
    speedFactor: 1,
    burnMagnitude: 3.05,
    burnAngleDeg: 9,
    recommendedZoom: 1.05,
    recommendedFocus: 'planet',
    recommendedTimeScaleIndex: 3,
  },
  {
    id: 'escape-shot',
    name: 'Escape Shot',
    summary: 'A hard burn from low orbit that kicks the probe loose from the planet and into a solar trajectory.',
    objective: 'Tune the burn until the dominant body flips to the star and the predicted orbit stays cleanly hyperbolic.',
    anchorId: 'planet',
    parentId: 'star',
    orbitRadius: 28,
    phaseDeg: 206,
    speedFactor: 1,
    burnMagnitude: 6.8,
    burnAngleDeg: -4,
    recommendedZoom: 0.92,
    recommendedFocus: 'probe',
    recommendedTimeScaleIndex: 4,
  },
  {
    id: 'lunar-capture',
    name: 'Lunar Capture',
    summary: 'Begin high around the moon and pull the orbit tighter with a retrograde burn.',
    objective: 'Drop periapsis toward the moon without turning the path into an impact trajectory.',
    anchorId: 'moon',
    parentId: 'planet',
    orbitRadius: 14,
    phaseDeg: -36,
    speedFactor: 1,
    burnMagnitude: 0.65,
    burnAngleDeg: 180,
    recommendedZoom: 1.4,
    recommendedFocus: 'moon',
    recommendedTimeScaleIndex: 2,
  },
]

const DEFAULT_PRESET_ID = PRESETS[0].id

function vec(x: number, y: number): Vec {
  return { x, y }
}

function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y }
}

function sub(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y }
}

function scale(v: Vec, factor: number): Vec {
  return { x: v.x * factor, y: v.y * factor }
}

function length(v: Vec): number {
  return Math.hypot(v.x, v.y)
}

function normalize(v: Vec): Vec {
  const magnitude = length(v)
  if (magnitude <= 1e-9) {
    return { x: 1, y: 0 }
  }
  return scale(v, 1 / magnitude)
}

function rotate(v: Vec, radians: number): Vec {
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  }
}

function perp(v: Vec): Vec {
  return { x: -v.y, y: v.x }
}

function dot(a: Vec, b: Vec): number {
  return a.x * b.x + a.y * b.y
}

function cross(a: Vec, b: Vec): number {
  return a.x * b.y - a.y * b.x
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function cloneVec(v: Vec): Vec {
  return { x: v.x, y: v.y }
}

function cloneBody(body: Body): Body {
  return {
    ...body,
    position: cloneVec(body.position),
    velocity: cloneVec(body.velocity),
    trail: body.trail.map(cloneVec),
  }
}

function cloneProbe(probe: Probe): Probe {
  return {
    ...probe,
    position: cloneVec(probe.position),
    velocity: cloneVec(probe.velocity),
    trail: probe.trail.map(cloneVec),
  }
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function createSystemBodies(): Body[] {
  const star = {
    id: 'star' as const,
    name: 'Helios',
    mass: 90000,
    radius: 34,
    color: '#f3b35f',
    glow: '#ffd08b',
    position: vec(0, 0),
    velocity: vec(0, 0),
    trail: [vec(0, 0)],
    fixed: true,
  }

  const planetOrbitRadius = 320
  const planetSpeed = Math.sqrt(star.mass / planetOrbitRadius)
  const planet = {
    id: 'planet' as const,
    name: 'Tethys',
    mass: 8000,
    radius: 14,
    color: '#71d3d7',
    glow: '#b8f3f3',
    position: vec(planetOrbitRadius, 0),
    velocity: vec(0, planetSpeed),
    trail: [vec(planetOrbitRadius, 0)],
  }

  const moonOrbitRadius = 74
  const moonSpeed = Math.sqrt(planet.mass / moonOrbitRadius)
  const moon = {
    id: 'moon' as const,
    name: 'Nysa',
    mass: 900,
    radius: 8,
    color: '#d7dbf9',
    glow: '#ffffff',
    position: vec(planetOrbitRadius + moonOrbitRadius, 0),
    velocity: vec(0, planetSpeed + moonSpeed),
    trail: [vec(planetOrbitRadius + moonOrbitRadius, 0)],
  }

  return [star, planet, moon]
}

export function getPresetById(id: string): PresetDefinition {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[0]
}

function getBodyById(bodies: Body[], id: BodyId): Body {
  const body = bodies.find((candidate) => candidate.id === id)
  if (!body) {
    throw new Error(`Missing body: ${id}`)
  }
  return body
}

function createProbeForPreset(bodies: Body[], preset: PresetDefinition): Probe {
  const anchor = getBodyById(bodies, preset.anchorId)
  const parent = getBodyById(bodies, preset.parentId)
  const baseRadial = normalize(sub(anchor.position, parent.position))
  const localRadial = rotate(baseRadial, degToRad(preset.phaseDeg))
  const orbitDirection = Math.sign(cross(sub(anchor.position, parent.position), sub(anchor.velocity, parent.velocity))) || 1
  const localTangential = scale(perp(localRadial), orbitDirection)
  const orbitalSpeed = Math.sqrt(anchor.mass / preset.orbitRadius) * preset.speedFactor

  return {
    name: 'Aster',
    radius: 5,
    color: '#ff8d72',
    glow: '#ffc8b8',
    position: add(anchor.position, scale(localRadial, preset.orbitRadius)),
    velocity: add(anchor.velocity, scale(localTangential, orbitalSpeed)),
    trail: [],
    impactBodyId: null,
  }
}

export function createSimulation(presetId = DEFAULT_PRESET_ID): SimulationState {
  const preset = getPresetById(presetId)
  const bodies = createSystemBodies()
  const probe = createProbeForPreset(bodies, preset)

  return {
    presetId: preset.id,
    bodies,
    probe,
    burnPlan: {
      magnitude: preset.burnMagnitude,
      angleDeg: preset.burnAngleDeg,
    },
    time: 0,
    burnsExecuted: 0,
    trailAccumulator: 0,
  }
}

function computeAccelerationAt(position: Vec, bodies: Body[]): Vec {
  let total = vec(0, 0)
  for (const body of bodies) {
    const delta = sub(body.position, position)
    const distanceSq = delta.x * delta.x + delta.y * delta.y + GRAVITY_SOFTENING * GRAVITY_SOFTENING
    const inverseDistance = 1 / Math.sqrt(distanceSq)
    const scaleFactor = body.mass * inverseDistance * inverseDistance * inverseDistance
    total = add(total, scale(delta, scaleFactor))
  }
  return total
}

function computeBodyAccelerations(bodies: Body[]): Map<BodyId, Vec> {
  const accelerations = new Map<BodyId, Vec>()

  for (const body of bodies) {
    if (body.fixed) {
      accelerations.set(body.id, vec(0, 0))
      continue
    }

    let total = vec(0, 0)
    for (const other of bodies) {
      if (other.id === body.id) {
        continue
      }
      const delta = sub(other.position, body.position)
      const distanceSq = delta.x * delta.x + delta.y * delta.y + GRAVITY_SOFTENING * GRAVITY_SOFTENING
      const inverseDistance = 1 / Math.sqrt(distanceSq)
      const scaleFactor = other.mass * inverseDistance * inverseDistance * inverseDistance
      total = add(total, scale(delta, scaleFactor))
    }
    accelerations.set(body.id, total)
  }

  return accelerations
}

function detectProbeImpact(probe: Probe, bodies: Body[]): BodyId | null {
  for (const body of bodies) {
    const radius = body.radius + probe.radius
    if (length(sub(probe.position, body.position)) <= radius) {
      return body.id
    }
  }
  return null
}

function integrateWorld(bodies: Body[], probe: Probe, dt: number): void {
  const bodyAccelStart = computeBodyAccelerations(bodies)
  const probeAccelStart = computeAccelerationAt(probe.position, bodies)

  for (const body of bodies) {
    if (body.fixed) {
      continue
    }
    const startAccel = bodyAccelStart.get(body.id)
    if (!startAccel) {
      continue
    }
    body.position = add(body.position, add(scale(body.velocity, dt), scale(startAccel, 0.5 * dt * dt)))
  }

  probe.position = add(probe.position, add(scale(probe.velocity, dt), scale(probeAccelStart, 0.5 * dt * dt)))

  const bodyAccelEnd = computeBodyAccelerations(bodies)
  const probeAccelEnd = computeAccelerationAt(probe.position, bodies)

  for (const body of bodies) {
    if (body.fixed) {
      continue
    }
    const startAccel = bodyAccelStart.get(body.id)
    const endAccel = bodyAccelEnd.get(body.id)
    if (!startAccel || !endAccel) {
      continue
    }
    body.velocity = add(body.velocity, scale(add(startAccel, endAccel), 0.5 * dt))
  }

  probe.velocity = add(probe.velocity, scale(add(probeAccelStart, probeAccelEnd), 0.5 * dt))
}

function appendTrailPoint(trail: Vec[], point: Vec): void {
  trail.push(cloneVec(point))
  if (trail.length > MAX_TRAIL_POINTS) {
    trail.splice(0, trail.length - MAX_TRAIL_POINTS)
  }
}

export function stepSimulation(state: SimulationState, deltaSeconds: number): void {
  if (state.probe.impactBodyId) {
    return
  }

  let remaining = deltaSeconds
  while (remaining > 1e-9) {
    const dt = Math.min(FIXED_DT, remaining)
    integrateWorld(state.bodies, state.probe, dt)
    state.time += dt
    state.trailAccumulator += dt

    if (state.trailAccumulator >= TRAIL_SAMPLE_INTERVAL) {
      for (const body of state.bodies) {
        appendTrailPoint(body.trail, body.position)
      }
      appendTrailPoint(state.probe.trail, state.probe.position)
      state.trailAccumulator = 0
    }

    const impactBodyId = detectProbeImpact(state.probe, state.bodies)
    if (impactBodyId) {
      state.probe.impactBodyId = impactBodyId
      state.probe.velocity = vec(0, 0)
      break
    }

    remaining -= dt
  }
}

export function getDominantBody(state: SimulationState): Body {
  let dominant = state.bodies[0]
  let strongestPull = -Infinity

  for (const body of state.bodies) {
    const delta = sub(body.position, state.probe.position)
    const pull = body.mass / Math.max(1, dot(delta, delta))
    if (pull > strongestPull) {
      strongestPull = pull
      dominant = body
    }
  }

  return dominant
}

function computeOrbitalClass(eccentricity: number, energy: number): string {
  if (energy >= 0) {
    return eccentricity > 1.02 ? 'escape' : 'borderline escape'
  }
  if (eccentricity < 0.08) {
    return 'near-circular'
  }
  if (eccentricity < 1) {
    return 'elliptic'
  }
  return 'unstable'
}

export function computeOrbitalMetrics(state: SimulationState): OrbitalMetrics {
  const dominantBody = getDominantBody(state)
  const relativePosition = sub(state.probe.position, dominantBody.position)
  const relativeVelocity = sub(state.probe.velocity, dominantBody.velocity)
  const mu = dominantBody.mass
  const radius = length(relativePosition)
  const relativeSpeed = length(relativeVelocity)
  const speed = length(state.probe.velocity)
  const energy = (relativeSpeed * relativeSpeed) / 2 - mu / Math.max(radius, 1)
  const angularMomentum = cross(relativePosition, relativeVelocity)
  const termOne = scale(relativePosition, (relativeSpeed * relativeSpeed - mu / Math.max(radius, 1)) / mu)
  const termTwo = scale(relativeVelocity, dot(relativePosition, relativeVelocity) / mu)
  const eccentricityVector = sub(termOne, termTwo)
  const eccentricity = length(eccentricityVector)

  let periapsis: number | null = null
  let apoapsis: number | null = null
  if (energy < 0) {
    const semiMajorAxis = -mu / (2 * energy)
    periapsis = semiMajorAxis * (1 - eccentricity)
    apoapsis = eccentricity < 1 ? semiMajorAxis * (1 + eccentricity) : null
  } else if (Math.abs(angularMomentum) > 1e-6) {
    periapsis = (angularMomentum * angularMomentum) / (mu * (1 + eccentricity))
  }

  return {
    dominantBodyId: dominantBody.id,
    dominantBodyName: dominantBody.name,
    altitude: radius - dominantBody.radius,
    distance: radius,
    speed,
    relativeSpeed,
    energy,
    eccentricity,
    periapsis,
    apoapsis,
    orbitClass: computeOrbitalClass(eccentricity, energy),
  }
}

export function setBurnPlan(state: SimulationState, burnPlan: BurnPlan): void {
  state.burnPlan = {
    magnitude: clamp(burnPlan.magnitude, 0, 8),
    angleDeg: clamp(burnPlan.angleDeg, -180, 180),
  }
}

export function getPlannedBurnVector(state: SimulationState): Vec {
  const dominantBody = getDominantBody(state)
  const relativeVelocity = sub(state.probe.velocity, dominantBody.velocity)
  const baseDirection = length(relativeVelocity) > 1e-5
    ? normalize(relativeVelocity)
    : normalize(perp(sub(state.probe.position, dominantBody.position)))
  return scale(rotate(baseDirection, degToRad(state.burnPlan.angleDeg)), state.burnPlan.magnitude)
}

export function executeBurn(state: SimulationState): void {
  if (state.probe.impactBodyId) {
    return
  }

  state.probe.velocity = add(state.probe.velocity, getPlannedBurnVector(state))
  state.burnsExecuted += 1
}

export function computePrediction(state: SimulationState, includePlannedBurn: boolean): Vec[] {
  const bodies = state.bodies.map(cloneBody)
  const probe = cloneProbe(state.probe)

  if (includePlannedBurn && !probe.impactBodyId) {
    probe.velocity = add(probe.velocity, getPlannedBurnVector(state))
  }

  const points: Vec[] = [cloneVec(probe.position)]
  for (let stepIndex = 0; stepIndex < PREDICTION_STEPS; stepIndex += 1) {
    integrateWorld(bodies, probe, PREDICTION_DT)
    if (stepIndex % PREDICTION_SAMPLE_STRIDE === 0) {
      points.push(cloneVec(probe.position))
    }
    if (detectProbeImpact(probe, bodies) || length(probe.position) > 2400) {
      break
    }
  }

  return points
}

export function getEntityPosition(state: SimulationState, focusId: FocusId): Vec {
  if (focusId === 'probe') {
    return cloneVec(state.probe.position)
  }
  return cloneVec(getBodyById(state.bodies, focusId).position)
}

export function getEntityLabel(state: SimulationState, focusId: FocusId): string {
  if (focusId === 'probe') {
    return state.probe.name
  }
  return getBodyById(state.bodies, focusId).name
}

export function describeImpact(state: SimulationState): string | null {
  if (!state.probe.impactBodyId) {
    return null
  }
  return getBodyById(state.bodies, state.probe.impactBodyId).name
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
