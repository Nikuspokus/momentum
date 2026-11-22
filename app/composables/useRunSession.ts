import type { RoutePoint } from '~/types/database'
import type { Segment } from '~/utils/plan'

type Status = 'idle' | 'running' | 'paused' | 'done'

// Moteur d'une séance guidée : chrono par segments, bips et vibrations aux changements de phase,
// écran maintenu allumé, tracé GPS facultatif.
export function useRunSession(segments: Segment[]) {
  const status = ref<Status>('idle')
  const elapsed = ref(0) // secondes écoulées, hors pauses
  const distanceM = ref(0)
  const route = ref<RoutePoint[]>([])
  const startedAt = ref<Date | null>(null)
  const gpsEnabled = ref(true)
  const gpsError = ref<string | null>(null)

  const ends = segments.reduce<number[]>((acc, s) => {
    acc.push((acc.at(-1) ?? 0) + s.sec)
    return acc
  }, [])
  const totalSec = ends.at(-1) ?? 0

  const index = computed(() => {
    const i = ends.findIndex((end) => elapsed.value < end)
    return i === -1 ? segments.length - 1 : i
  })
  const current = computed(() => segments[index.value]!)
  const next = computed(() => segments[index.value + 1] ?? null)
  const remaining = computed(() => Math.max(0, (ends[index.value] ?? 0) - elapsed.value))
  const durationS = computed(() => Math.min(Math.round(elapsed.value), totalSec))

  let startTs = 0
  let pausedAt = 0
  let pausedTotal = 0
  let timer: ReturnType<typeof setInterval> | null = null
  let audio: AudioContext | null = null
  let watchId: number | null = null
  let wakeLock: WakeLockSentinel | null = null
  let lastIndex = -1
  let last: { lat: number; lng: number } | null = null

  function beep(freqs: number[]) {
    if (audio) {
      let t = audio.currentTime
      for (const f of freqs) {
        const osc = audio.createOscillator()
        const gain = audio.createGain()
        osc.frequency.value = f
        gain.gain.value = 0.25
        osc.connect(gain)
        gain.connect(audio.destination)
        osc.start(t)
        osc.stop(t + 0.18)
        t += 0.24
      }
    }
    navigator.vibrate?.(freqs.length * 200)
  }

  function tick() {
    // Calcul à partir de l'horloge : reste exact même si le navigateur ralentit les timers
    elapsed.value = (Date.now() - startTs - pausedTotal) / 1000
    if (elapsed.value >= totalSec) {
      finish(true)
      return
    }
    if (index.value !== lastIndex) {
      lastIndex = index.value
      beep(current.value.type === 'run' ? [880, 1100] : [520])
    }
  }

  function onPosition(p: GeolocationPosition) {
    if (p.coords.accuracy > 35) return // position trop imprécise
    const cur = { lat: p.coords.latitude, lng: p.coords.longitude }
    if (last) {
      const d = haversine(last, cur)
      if (d < 5) return // bruit GPS
      if (d > 80) { // saut aberrant
        last = cur
        return
      }
      distanceM.value += d
    }
    route.value.push([Number(cur.lat.toFixed(5)), Number(cur.lng.toFixed(5)), Math.round(elapsed.value)])
    last = cur
  }

  function startGps() {
    if (!gpsEnabled.value || !('geolocation' in navigator) || watchId !== null) return
    last = null
    watchId = navigator.geolocation.watchPosition(onPosition, (e) => { gpsError.value = e.message }, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 15_000,
    })
  }

  function stopGps() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    watchId = null
  }

  async function requestWake() {
    try {
      wakeLock = (await navigator.wakeLock?.request('screen')) ?? null
    } catch {
      wakeLock = null // non supporté ou refusé : sans gravité
    }
  }

  function onVisibility() {
    if (document.visibilityState === 'visible' && status.value === 'running') requestWake()
  }

  function start() {
    audio = new AudioContext() // doit être créé suite à un geste de l'utilisateur
    startTs = Date.now()
    pausedTotal = 0
    startedAt.value = new Date()
    status.value = 'running'
    document.addEventListener('visibilitychange', onVisibility)
    timer = setInterval(tick, 250)
    tick()
    startGps()
    requestWake()
  }

  function pause() {
    if (status.value !== 'running') return
    if (timer) clearInterval(timer)
    timer = null
    pausedAt = Date.now()
    status.value = 'paused'
    stopGps()
  }

  function resume() {
    if (status.value !== 'paused') return
    pausedTotal += Date.now() - pausedAt
    status.value = 'running'
    timer = setInterval(tick, 250)
    startGps()
  }

  function finish(completed = false) {
    if (timer) clearInterval(timer)
    timer = null
    stopGps()
    wakeLock?.release().catch(() => {})
    wakeLock = null
    document.removeEventListener('visibilitychange', onVisibility)
    if (completed) beep([660, 880, 1100])
    status.value = 'done'
  }

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    stopGps()
    wakeLock?.release().catch(() => {})
    document.removeEventListener('visibilitychange', onVisibility)
    audio?.close().catch(() => {})
  })

  return {
    status, elapsed, distanceM, route, startedAt, gpsEnabled, gpsError,
    totalSec, index, current, next, remaining, durationS,
    start, pause, resume, finish,
  }
}
