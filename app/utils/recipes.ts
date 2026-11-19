// Idées de repas équilibrées, adaptées à une perte de poids. Valeurs par portion : estimations indicatives.
import type { MealType } from '~/types/database'

export type Recipe = {
  id: string
  name: string
  type: MealType[]
  ingredients: string[]
  tags: string[] // catégories pour les exclusions (poisson, viande, gluten…)
  grams: number
  kcal: number
  protein: number
  carbs: number
  fat: number
}

const r = (
  id: string, name: string, type: MealType[], ingredients: string[], tags: string[],
  grams: number, kcal: number, protein: number, carbs: number, fat: number,
): Recipe => ({ id, name, type, ingredients, tags, grams, kcal, protein, carbs, fat })

const B: MealType[] = ['breakfast']
const M: MealType[] = ['lunch', 'dinner']
const S: MealType[] = ['snack']

export const RECIPES: Recipe[] = [
  r('b1', 'Omelette 2 œufs, pain complet et orange', B, ['oeufs', 'pain complet', 'orange'], ['gluten'], 350, 380, 22, 38, 14),
  r('b2', "Skyr, fruits rouges et flocons d'avoine", B, ['skyr', 'fruits rouges', "flocons d'avoine"], ['laitage', 'gluten'], 330, 330, 32, 38, 4),
  r('b3', 'Fromage blanc, pomme et noix', B, ['fromage blanc', 'pomme', 'noix'], ['laitage'], 280, 270, 22, 28, 8),
  r('b4', 'Porridge au lait et banane', B, ["flocons d'avoine", 'lait', 'banane'], ['laitage', 'gluten'], 380, 360, 14, 58, 8),
  r('b5', 'Tartines de pain complet, fromage frais et jambon', B, ['pain complet', 'fromage frais', 'jambon'], ['gluten', 'laitage', 'viande'], 200, 340, 20, 40, 10),
  r('m1', 'Poulet grillé, riz et brocoli', M, ['poulet', 'riz', 'brocoli'], ['viande'], 450, 520, 45, 58, 10),
  r('m2', 'Saumon, pommes de terre vapeur et haricots verts', M, ['saumon', 'pommes de terre', 'haricots verts'], ['poisson'], 480, 560, 38, 42, 24),
  r('m3', 'Steak haché 5 %, haricots verts et riz', M, ['steak haché', 'haricots verts', 'riz'], ['viande'], 450, 510, 38, 52, 14),
  r('m4', 'Wok de dinde aux légumes et nouilles', M, ['dinde', 'poivron', 'carotte', 'nouilles'], ['viande', 'gluten'], 450, 480, 40, 50, 12),
  r('m5', 'Salade de lentilles au thon', M, ['lentilles', 'thon', 'tomate', 'oignon'], ['poisson'], 400, 450, 36, 46, 12),
  r('m6', 'Omelette aux champignons, salade verte et pain complet', M, ['oeufs', 'champignons', 'salade', 'pain complet'], ['gluten'], 400, 430, 28, 30, 22),
  r('m7', 'Pâtes complètes, poulet et courgette', M, ['pâtes complètes', 'poulet', 'courgette'], ['viande', 'gluten'], 450, 540, 42, 66, 11),
  r('m8', 'Cabillaud, ratatouille et pommes de terre', M, ['cabillaud', 'courgette', 'aubergine', 'tomate', 'pommes de terre'], ['poisson'], 480, 420, 38, 44, 9),
  r('m9', 'Chili sin carne (haricots rouges) et riz', M, ['haricots rouges', 'tomate', 'poivron', 'riz'], [], 450, 470, 22, 74, 9),
  r('m10', 'Curry de pois chiches, épinards et riz', M, ['pois chiches', 'épinards', 'riz', 'lait de coco'], [], 450, 520, 20, 80, 13),
  r('m11', 'Salade de pois chiches, concombre, tomate et feta', M, ['pois chiches', 'concombre', 'tomate', 'feta'], ['laitage'], 380, 430, 18, 44, 19),
  r('m12', 'Soupe de légumes, 2 œufs durs et pain complet', M, ['légumes', 'oeufs', 'pain complet'], ['gluten'], 450, 380, 22, 40, 13),
  r('m13', 'Poisson blanc, purée de patate douce et épinards', M, ['cabillaud', 'patate douce', 'épinards'], ['poisson'], 480, 440, 36, 52, 8),
  r('m14', 'Poulet, salade de quinoa et légumes croquants', M, ['poulet', 'quinoa', 'concombre', 'carotte'], ['viande'], 420, 500, 44, 50, 12),
  r('m15', 'Salade niçoise : thon, œuf, haricots verts, pommes de terre', M, ['thon', 'oeufs', 'haricots verts', 'pommes de terre', 'tomate'], ['poisson'], 420, 460, 34, 38, 18),
  r('m16', 'Dinde, boulgour et poêlée de légumes', M, ['dinde', 'boulgour', 'courgette', 'poivron'], ['viande', 'gluten'], 450, 490, 42, 52, 11),
  r('s1', 'Yaourt grec nature et amandes', S, ['yaourt grec', 'amandes'], ['laitage'], 160, 190, 12, 8, 12),
  r('s2', 'Pomme et une poignée d\'amandes', S, ['pomme', 'amandes'], [], 200, 200, 5, 28, 9),
  r('s3', '2 œufs durs', S, ['oeufs'], [], 110, 155, 13, 1, 11),
  r('s4', 'Bâtonnets de carotte et houmous', S, ['carotte', 'houmous'], [], 180, 180, 6, 20, 8),
  r('s5', 'Fromage blanc et fruits', S, ['fromage blanc', 'fruits'], ['laitage'], 200, 150, 12, 18, 3),
]

// Minuscules, sans accents, sans pluriel : « Œufs » et « oeuf » se correspondent
export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/(s|x)$/, '')
}

export const parseList = (text: string): string[] =>
  [...new Set(text.split(/[,;\n]/).map((t) => norm(t)).filter(Boolean))]

const hit = (token: string, hay: string) => hay.includes(token) || token.includes(hay)

export type Suggestion = { recipe: Recipe; owned: string[]; missing: string[]; score: number }

// Classe les recettes : sans aliment exclu, dans le budget calorique restant, avec un maximum d'ingrédients déjà chez toi
export function suggest(opts: {
  type: MealType
  have: string[]
  avoid: string[]
  kcalLeft: number
  idealKcal: number
}): Suggestion[] {
  const out: Suggestion[] = []
  for (const recipe of RECIPES) {
    if (!recipe.type.includes(opts.type)) continue
    const ingredients = recipe.ingredients.map(norm)
    const haystack = [...ingredients, ...recipe.tags.map(norm)]
    if (opts.avoid.some((a) => haystack.some((h) => hit(a, h)))) continue
    if (recipe.kcal > opts.kcalLeft + 50) continue
    const owned = recipe.ingredients.filter((_, i) => opts.have.some((h) => hit(h, ingredients[i]!)))
    const missing = recipe.ingredients.filter((i) => !owned.includes(i))
    const haveScore = opts.have.length ? owned.length / recipe.ingredients.length : 0
    const kcalFit = 1 - Math.min(1, Math.abs(recipe.kcal - opts.idealKcal) / opts.idealKcal)
    const proteinBonus = Math.min(recipe.protein / recipe.kcal / 0.08, 1) * 0.2
    out.push({ recipe, owned, missing, score: haveScore * 1.5 + kcalFit + proteinBonus })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5)
}
