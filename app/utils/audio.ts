// Petits bips via WebAudio (le contexte doit être créé après un geste de l'utilisateur)
export function playBeep(ctx: AudioContext | null, freqs: number[]) {
  if (ctx) {
    let t = ctx.currentTime
    for (const f of freqs) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = f
      gain.gain.value = 0.25
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.16)
      t += 0.22
    }
  }
  navigator.vibrate?.(freqs.length * 150)
}
