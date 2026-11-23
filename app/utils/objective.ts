// Objectif : courir 10 km à la Route du Louvre (Lens). Date à confirmer auprès de l'organisation.
export const OBJECTIVE = {
  name: 'Route du Louvre',
  city: 'Lens',
  distanceKm: 10,
  date: '2027-05-09',
  dateConfirmed: false,
  planStart: '2026-11-23',
  weeklyOutings: 3,
} as const

export interface Scenario {
  id: 'prudent' | 'realiste' | 'optimiste'
  label: string
  /** Perte cumulée visée au 15 avril 2027 puis au 15 octobre 2027 (kg) */
  lossApril: number
  lossOctober: number
}

export const SCENARIOS: Scenario[] = [
  { id: 'prudent', label: 'Prudent', lossApril: 10, lossOctober: 18 },
  { id: 'realiste', label: 'Réaliste', lossApril: 12.5, lossOctober: 23 },
  { id: 'optimiste', label: 'Optimiste', lossApril: 15, lossOctober: 28 },
]

export const AXIS_START = '2026-11-23'
export const AXIS_END = '2027-10-31'
export const DATE_APRIL = '2027-04-15'
export const DATE_OCTOBER = '2027-10-15'

const DAY_MS = 86_400_000

/** Instant (midi local) d'une date AAAA-MM-JJ : évite les décalages d'heure d'été */
export function dayTime(iso: string): number {
  return new Date(`${iso}T12:00:00`).getTime()
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime()
}

/** Jours entiers entre aujourd'hui et une date (négatif si passée) */
export function daysUntil(iso: string, now = new Date()): number {
  return Math.round((dayTime(iso) - startOfDay(now)) / DAY_MS)
}

/** Perte visée (kg, positive) à un instant donné : segments linéaires départ → avril → octobre, puis palier */
export function scenarioLoss(sc: Scenario, t: number): number {
  const t0 = dayTime(AXIS_START)
  const t1 = dayTime(DATE_APRIL)
  const t2 = dayTime(DATE_OCTOBER)
  if (t <= t0) return 0
  if (t <= t1) return sc.lossApril * ((t - t0) / (t1 - t0))
  if (t <= t2) return sc.lossApril + (sc.lossOctober - sc.lossApril) * ((t - t1) / (t2 - t1))
  return sc.lossOctober
}

export function scenarioWeight(sc: Scenario, startKg: number, t: number): number {
  return startKg - scenarioLoss(sc, t)
}

/** Poids de départ : première pesée depuis le début du plan, sinon le poids de départ de l'objectif */
export function startWeight(
  entries: Array<{ weight_kg: number; measured_at: string }>,
  fallbackKg: number | null | undefined,
): number | null {
  const from = dayTime(OBJECTIVE.planStart) - DAY_MS / 2
  const first = [...entries]
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    .find((e) => new Date(e.measured_at).getTime() >= from)
  return first?.weight_kg ?? fallbackKg ?? null
}

/** Bornes de la semaine en cours : lundi 00:00 inclus → lundi suivant exclu */
export function weekBounds(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start, end }
}

export function formatLongDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
