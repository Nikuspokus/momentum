// Plan de reprise marche/trot sur 12 semaines, 3 séances par semaine.
// Progression volontairement lente pour ménager les articulations.
export type Segment = { type: 'walk' | 'run'; sec: number }

export type PlanSession = {
  id: string
  week: number
  session: number
  title: string
  segments: Segment[]
  totalSec: number
}

// [répétitions, secondes de trot, secondes de marche entre deux trots]
const WEEKS: Array<[number, number, number]> = [
  [8, 60, 120],
  [8, 90, 120],
  [6, 120, 120],
  [6, 180, 120],
  [5, 240, 120],
  [4, 300, 120],
  [4, 360, 90],
  [3, 480, 90],
  [3, 600, 90],
  [2, 900, 120],
  [2, 1080, 120],
  [1, 1800, 0],
]

const WARMUP_SEC = 300
const COOLDOWN_SEC = 300
export const SESSIONS_PER_WEEK = 3

function label(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m} min ${s}` : `${m} min`
}

function build(week: number, session: number, [reps, run, walk]: [number, number, number]): PlanSession {
  const segments: Segment[] = [{ type: 'walk', sec: WARMUP_SEC }]
  for (let i = 0; i < reps; i++) {
    segments.push({ type: 'run', sec: run })
    if (i < reps - 1 && walk > 0) segments.push({ type: 'walk', sec: walk })
  }
  segments.push({ type: 'walk', sec: COOLDOWN_SEC })
  const title =
    reps === 1 ? `${label(run)} de trot continu` : `${reps} × ${label(run)} de trot, ${label(walk)} de marche`
  return {
    id: `${week}-${session}`,
    week,
    session,
    title,
    segments,
    totalSec: segments.reduce((sum, s) => sum + s.sec, 0),
  }
}

export const PLAN: PlanSession[] = WEEKS.flatMap((cfg, w) =>
  Array.from({ length: SESSIONS_PER_WEEK }, (_, s) => build(w + 1, s + 1, cfg)),
)
