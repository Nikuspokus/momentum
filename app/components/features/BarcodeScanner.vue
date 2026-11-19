<script setup lang="ts">
// Lecture de code-barres avec l'API native BarcodeDetector (Chrome sur Android).
const emit = defineEmits<{ detected: [code: string]; close: [] }>()

type Detector = { detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> }

const video = ref<HTMLVideoElement | null>(null)
const error = ref<string | null>(null)
const manual = ref('')

let stream: MediaStream | null = null
let raf = 0
let stopped = false

const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window

async function start() {
  if (!supported) return
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    if (!video.value) return
    video.value.srcObject = stream
    await video.value.play()
    const Ctor = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => Detector }).BarcodeDetector
    const detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
    let lastRun = 0
    const loop = async (now: number) => {
      if (stopped || !video.value) return
      if (now - lastRun > 200) {
        lastRun = now
        const codes = await detector.detect(video.value).catch(() => [])
        if (codes[0]) {
          emit('detected', codes[0].rawValue)
          return
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
  } catch {
    error.value = "Impossible d'accéder à la caméra. Autorise-la dans les réglages du navigateur ou saisis le code à la main."
  }
}

function submitManual() {
  const code = manual.value.replace(/\D/g, '')
  if (code.length >= 8) emit('detected', code)
}

onMounted(start)
onBeforeUnmount(() => {
  stopped = true
  cancelAnimationFrame(raf)
  stream?.getTracks().forEach((t) => t.stop())
})
</script>

<template>
  <div class="stack">
    <div v-if="supported && !error" class="viewfinder">
      <video ref="video" playsinline muted />
      <span class="frame" />
    </div>
    <p v-else-if="error" class="error small">{{ error }}</p>
    <p v-else class="muted small">
      Ce navigateur ne sait pas lire les codes-barres. Saisis les chiffres sous le code-barres.
    </p>

    <form class="row" @submit.prevent="submitManual">
      <input v-model="manual" type="text" inputmode="numeric" placeholder="Code-barres (8 à 13 chiffres)" aria-label="Code-barres">
      <button class="btn btn-ink" type="submit" :disabled="manual.replace(/\D/g, '').length < 8">Chercher</button>
    </form>
    <button class="btn btn-quiet" type="button" @click="emit('close')">Fermer la caméra</button>
  </div>
</template>

<style scoped>
.viewfinder { position: relative; border-radius: var(--radius); overflow: hidden; background: #000; aspect-ratio: 4 / 3; }
.viewfinder video { width: 100%; height: 100%; object-fit: cover; }
.frame {
  position: absolute; inset: 22% 10%; border: 3px solid var(--hivis); border-radius: 10px;
  box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.5);
}
</style>
