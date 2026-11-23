<script setup lang="ts">
// Lecture directe d'une balance Bluetooth compatible avec les profils standard (Weight Scale, Body Composition)
const weight = useWeightStore()

type BtDevice = {
  name?: string
  gatt?: {
    connected: boolean
    connect: () => Promise<BtServer>
    disconnect: () => void
  }
}
type BtChar = {
  startNotifications: () => Promise<BtChar>
  addEventListener: (t: string, cb: (e: { target: { value: DataView } }) => void) => void
}
type BtService = { getCharacteristic: (c: string) => Promise<BtChar> }
type BtServer = { getPrimaryService: (s: string) => Promise<BtService> }
type BtNav = { requestDevice: (o: unknown) => Promise<BtDevice> }

const supported = typeof navigator !== 'undefined' && 'bluetooth' in navigator
const status = ref<'idle' | 'connecting' | 'waiting' | 'error'>('idle')
const message = ref<string | null>(null)
const live = ref<number | null>(null)
const fat = ref<number | null>(null)
const saved = ref(false)
let device: BtDevice | null = null

async function connect() {
  message.value = null
  saved.value = false
  live.value = null
  fat.value = null
  status.value = 'connecting'
  try {
    const bt = (navigator as unknown as { bluetooth: BtNav }).bluetooth
    device = await bt.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['weight_scale', 'body_composition'],
    })
    const server = await device.gatt!.connect()
    const service = await server.getPrimaryService('weight_scale')
    const ch = await service.getCharacteristic('weight_measurement')
    ch.addEventListener('characteristicvaluechanged', (e) => {
      const kg = parseWeightMeasurement(e.target.value)
      if (kg !== null) live.value = kg
    })
    await ch.startNotifications()
    try {
      const body = await server.getPrimaryService('body_composition')
      const bc = await body.getCharacteristic('body_composition_measurement')
      bc.addEventListener('characteristicvaluechanged', (e) => { fat.value = parseBodyFat(e.target.value) })
      await bc.startNotifications()
    } catch {
      /* composition corporelle non exposée : on garde le poids seul */
    }
    status.value = 'waiting'
  } catch (e) {
    status.value = 'error'
    const err = e as DOMException
    message.value =
      err.name === 'NotFoundError' && /service/i.test(err.message)
        ? "Cette balance n'utilise pas le profil Bluetooth standard (c'est fréquent). Utilise openScale puis l'import CSV."
        : err.name === 'NotFoundError'
          ? 'Aucune balance choisie.'
          : `Connexion impossible : ${err.message}`
  }
}

async function save() {
  if (live.value === null) return
  const ok = await weight.addFromScale(live.value, fat.value)
  if (ok) {
    saved.value = true
    disconnect()
  } else message.value = weight.error
}

function disconnect() {
  if (device?.gatt?.connected) device.gatt.disconnect()
  status.value = 'idle'
}

onBeforeUnmount(disconnect)
</script>

<template>
  <div class="stack">
    <p v-if="!supported" class="muted small">
      Ce navigateur ne sait pas se connecter en Bluetooth. Utilise Chrome sur Android.
    </p>
    <template v-else>
      <p class="muted small">
        Allume la balance, appuie sur « Connecter », choisis-la dans la liste, puis monte dessus. Fonctionne avec les balances
        qui suivent le profil Bluetooth standard ; sinon, passe par openScale et l'import CSV.
      </p>
      <button v-if="status === 'idle' || status === 'error'" class="btn btn-line btn-block" type="button" @click="connect">
        Connecter ma balance
      </button>
      <p v-if="status === 'connecting'" class="muted">Connexion en cours…</p>
      <template v-if="status === 'waiting'">
        <p class="reading num">{{ live !== null ? fmtNum(live) : '…' }}<span class="unit"> kg</span></p>
        <p v-if="fat !== null" class="muted small num">Masse grasse : {{ fmtNum(fat) }} %</p>
        <p v-if="live === null" class="muted small">Monte sur la balance, pieds nus et immobile.</p>
        <button class="btn btn-primary btn-block" type="button" :disabled="live === null" @click="save">Enregistrer cette pesée</button>
        <button class="btn btn-quiet" type="button" @click="disconnect">Annuler</button>
      </template>
      <p v-if="saved" class="strong">Pesée enregistrée.</p>
      <p v-if="message" class="error small">{{ message }}</p>
    </template>
  </div>
</template>

<style scoped>
.strong { font-weight: 700; }
.reading { font-size: 3rem; font-weight: 800; line-height: 1; }
.unit { font-size: 1rem; font-weight: 600; color: var(--ink-2); }
</style>
