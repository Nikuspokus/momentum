// Charge une seule fois les données de l'app (poids, repas, séances) ; les stores évitent les rechargements
export function useAppData() {
  const weight = useWeightStore()
  const meals = useMealsStore()
  const workouts = useWorkoutsStore()

  return useAsyncData('app-data', async () => {
    await Promise.all([weight.load(), meals.load(), workouts.load()])
    return true
  })
}
