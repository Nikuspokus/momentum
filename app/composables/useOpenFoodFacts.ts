// Open Food Facts : base de données collaborative et gratuite de produits alimentaires.
// L'API est publique et accepte les appels depuis le navigateur.
export type FoodHit = {
  code: string
  name: string
  brand: string
  per100: { kcal: number; protein: number; carbs: number; fat: number }
  servingG: number | null
  packG: number | null
}

type OffProduct = {
  code?: string
  product_name?: string
  brands?: string
  serving_quantity?: number | string
  product_quantity?: number | string
  nutriments?: Record<string, number | string | undefined>
}

const FIELDS = 'code,product_name,brands,nutriments,serving_quantity,product_quantity'

function toHit(p: OffProduct): FoodHit | null {
  const n = p.nutriments ?? {}
  const kcal =
    n['energy-kcal_100g'] !== undefined
      ? Number(n['energy-kcal_100g'])
      : n['energy_100g'] !== undefined
        ? Number(n['energy_100g']) / 4.184 // kJ → kcal
        : NaN
  if (!p.product_name || !Number.isFinite(kcal)) return null
  const serving = Number(p.serving_quantity)
  const pack = Number(p.product_quantity)
  return {
    code: p.code ?? '',
    name: p.product_name,
    brand: (p.brands ?? '').split(',')[0]?.trim() ?? '',
    per100: {
      kcal,
      protein: Number(n['proteins_100g'] ?? 0) || 0,
      carbs: Number(n['carbohydrates_100g'] ?? 0) || 0,
      fat: Number(n['fat_100g'] ?? 0) || 0,
    },
    servingG: Number.isFinite(serving) && serving > 0 ? serving : null,
    packG: Number.isFinite(pack) && pack > 0 ? pack : null,
  }
}

export function useOpenFoodFacts() {
  async function searchFoods(query: string): Promise<FoodHit[]> {
    const url =
      'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1' +
      `&page_size=20&cc=fr&lc=fr&sort_by=unique_scans_n&fields=${FIELDS}` +
      `&search_terms=${encodeURIComponent(query)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Recherche indisponible, réessaie dans un instant.')
    const json = (await res.json()) as { products?: OffProduct[] }
    return (json.products ?? []).map(toHit).filter((h): h is FoodHit => h !== null)
  }

  async function findByBarcode(code: string): Promise<FoodHit | null> {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`,
    )
    if (!res.ok) throw new Error('Recherche indisponible, réessaie dans un instant.')
    const json = (await res.json()) as { status?: number; product?: OffProduct }
    return json.status === 1 && json.product ? toHit({ ...json.product, code }) : null
  }

  return { searchFoods, findByBarcode }
}
