// Décodage des caractéristiques Bluetooth standard des balances (Weight Scale 0x181D / Body Composition 0x181B)
export function parseWeightMeasurement(view: DataView): number | null {
  const flags = view.getUint8(0)
  const imperial = (flags & 0x01) !== 0
  const raw = view.getUint16(1, true)
  if (raw === 0xffff) return null // valeur « non mesurée »
  const kg = imperial ? raw * 0.01 * 0.45359237 : raw * 0.005
  return Math.round(kg * 10) / 10
}

export function parseBodyFat(view: DataView): number | null {
  const raw = view.getUint16(2, true)
  if (raw === 0xffff) return null
  return Math.round(raw) / 10
}
