// Clé de jour locale (YYYY-MM-DD), pour regrouper les données par jour de l'utilisateur
export function localDayKey(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export function fmtNum(n: number, digits = 1): string {
  return n.toFixed(digits).replace('.', ',')
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function formatMinutes(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m} min ${s}` : `${m} min`
}

export function formatKm(meters: number): string {
  return `${fmtNum(meters / 1000, 2)} km`
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}
