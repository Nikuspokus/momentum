export const STEP_GOAL = 8000
// Longueur moyenne d'un pas ≈ 0,415 × taille ; pour 1,77 m : ~0,73 m
export const stepLengthM = (heightCm: number) => heightCm * 0.00415
export const metersToSteps = (m: number, heightCm: number) => Math.round(m / stepLengthM(heightCm))
