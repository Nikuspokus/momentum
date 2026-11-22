import type { RoutePoint } from '~/types/database'

export const SLOT_MS = 30 * 60_000
export const ACTIVE_HOUR_STEPS = 250 // seuil usuel d'une « heure active »
export const IDLE_SLOT_STEPS = 60 // moins de 60 pas en 30 min = immobile

export const slotFloor = (ms: number) => Math.floor(ms / SLOT_MS) * SLOT_MS

// Répartit des relevés de pas (début, fin, valeur) sur des créneaux de 30 minutes, au prorata du temps
export function distributeSamples(samples: Array<{ startDate: string; endDate: string; value: number }>): Map<number, number> {
  const out = new Map<number, number>()
  for (const s of samples) {
    const a = new Date(s.startDate).getTime()
    const b = new Date(s.endDate).getTime()
    if (!Number.isFinite(a) || !Number.isFinite(b) || s.value <= 0) continue
    if (b <= a) {
      const k = slotFloor(a)
      out.set(k, (out.get(k) ?? 0) + s.value)
      continue
    }
    for (let k = slotFloor(a); k < b; k += SLOT_MS) {
      const overlap = Math.min(b, k + SLOT_MS) - Math.max(a, k)
      if (overlap > 0) out.set(k, (out.get(k) ?? 0) + (s.value * overlap) / (b - a))
    }
  }
  return out
}

export type Bar = { startMs: number; label: string; steps: number; future: boolean }

const hm = (ms: number) => {
  const d = new Date(ms)
  return `${d.getHours()} h${d.getMinutes() ? String(d.getMinutes()).padStart(2, '0') : ''}`
}

// Barres d'une journée locale : 48 créneaux de 30 min, ou 24 si on regroupe par heure
export function dayBars(slots: Map<number, number>, day: Date, perHour: boolean): Bar[] {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
  const step = perHour ? 2 * SLOT_MS : SLOT_MS
  const n = perHour ? 24 : 48
  const now = Date.now()
  return Array.from({ length: n }, (_, i) => {
    const t = start + i * step
    const steps = perHour ? (slots.get(t) ?? 0) + (slots.get(t + SLOT_MS) ?? 0) : (slots.get(t) ?? 0)
    return { startMs: t, label: `${hm(t)}–${hm(t + step)}`, steps: Math.round(steps), future: t > now }
  })
}

export type DayInsights = {
  total: number
  peak: { label: string; steps: number } | null
  activeHours: number
  idle: { from: string; to: string; minutes: number } | null
}

// Analyse d'une journée à partir des barres de 30 min
export function analyseDay(bars30: Bar[]): DayInsights {
  const total = bars30.reduce((s, b) => s + b.steps, 0)
  let peak: DayInsights['peak'] = null
  let activeHours = 0
  for (let i = 0; i < bars30.length; i += 2) {
    const steps = bars30[i]!.steps + (bars30[i + 1]?.steps ?? 0)
    if (steps >= ACTIVE_HOUR_STEPS) activeHours++
    if (steps > 0 && (!peak || steps > peak.steps)) {
      peak = { label: `${hm(bars30[i]!.startMs)}–${hm(bars30[i]!.startMs + 2 * SLOT_MS)}`, steps }
    }
  }
  // Plus longue période immobile entre 8 h et 22 h (jusqu'à maintenant pour aujourd'hui)
  let best: { from: number; to: number } | null = null
  let run: { from: number; to: number } | null = null
  for (const b of bars30) {
    const h = new Date(b.startMs).getHours()
    const inDay = h >= 8 && h < 22 && !b.future
    if (inDay && b.steps < IDLE_SLOT_STEPS) {
      run = run ? { from: run.from, to: b.startMs + SLOT_MS } : { from: b.startMs, to: b.startMs + SLOT_MS }
      if (!best || run.to - run.from > best.to - best.from) best = { ...run }
    } else run = null
  }
  const idle = best && best.to - best.from >= 2 * SLOT_MS
    ? { from: hm(best.from), to: hm(best.to), minutes: Math.round((best.to - best.from) / 60_000) }
    : null
  return { total, peak, activeHours, idle }
}

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h} h${m ? String(m).padStart(2, '0') : ''}` : `${m} min`
}

// Allure moyenne en min:sec par km
export function pace(durationS: number, distanceM: number): string | null {
  if (distanceM < 100 || durationS <= 0) return null
  const spk = durationS / (distanceM / 1000)
  return `${Math.floor(spk / 60)}:${String(Math.round(spk % 60)).padStart(2, '0')} /km`
}

// Temps de chaque kilomètre complet (sorties enregistrées avec l'heure de chaque point)
export function kmSplits(route: RoutePoint[]): Array<{ km: number; sec: number }> {
  const out: Array<{ km: number; sec: number }> = []
  let dist = 0
  let lastKmT = 0
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!
    const b = route[i]!
    if (b[2] === undefined) return []
    dist += haversine({ lat: a[0], lng: a[1] }, { lat: b[0], lng: b[1] })
    while (dist >= (out.length + 1) * 1000) {
      out.push({ km: out.length + 1, sec: Math.round(b[2] - lastKmT) })
      lastKmT = b[2]
    }
  }
  return out
}
