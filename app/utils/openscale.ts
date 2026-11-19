// Lecture d'un export CSV d'openScale (appli Android open source pour balances connectées)
export type ScaleRow = { measuredAt: Date; weightKg: number; fatPct: number | null; waterPct: number | null }

export type ParsedCsv = { rows: ScaleRow[]; skipped: number }

function parseDate(raw: string): Date | null {
  const s = raw.trim().replace(/^"|"$/g, '')
  // 2026-11-19 07:30[:00] ou 2026-11-19T07:30
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (m) return new Date(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +(m[6] ?? 0))
  // 19.11.2026 07:30 ou 19/11/2026 07:30
  m = s.match(/^(\d{2})[./](\d{2})[./](\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (m) return new Date(+m[3]!, +m[2]! - 1, +m[1]!, +m[4]!, +m[5]!, +(m[6] ?? 0))
  // date seule
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return new Date(+m[1]!, +m[2]! - 1, +m[3]!, 7, 0)
  return null
}

const num = (s: string | undefined): number | null => {
  if (s === undefined) return null
  const n = Number(s.trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function splitLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (const ch of line) {
    if (ch === '"') quoted = !quoted
    else if (ch === sep && !quoted) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

export function parseOpenScaleCsv(text: string): ParsedCsv {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return { rows: [], skipped: 0 }
  const sep = (lines[0]!.match(/;/g)?.length ?? 0) > (lines[0]!.match(/,/g)?.length ?? 0) ? ';' : ','
  const header = splitLine(lines[0]!, sep).map((h) => h.trim().toLowerCase())
  const col = (name: string) => header.indexOf(name)
  const iDate = col('datetime') >= 0 ? col('datetime') : col('date')
  const iWeight = col('weight')
  if (iDate < 0 || iWeight < 0) return { rows: [], skipped: lines.length - 1 }
  const iFat = col('fat')
  const iWater = col('water')

  const rows: ScaleRow[] = []
  let skipped = 0
  for (const line of lines.slice(1)) {
    const cells = splitLine(line, sep)
    const date = parseDate(cells[iDate] ?? '')
    const weight = num(cells[iWeight])
    if (!date || weight === null || weight < 20 || weight > 400) { skipped++; continue }
    const fat = iFat >= 0 ? num(cells[iFat]) : null
    const water = iWater >= 0 ? num(cells[iWater]) : null
    rows.push({
      measuredAt: date,
      weightKg: Math.round(weight * 10) / 10,
      fatPct: fat !== null && fat >= 1 && fat <= 80 ? fat : null,
      waterPct: water !== null && water > 0 && water <= 100 ? water : null,
    })
  }
  return { rows, skipped }
}
