import { defineNuxtPlugin } from '#imports'
import { useForgeAuth } from '../composables/useForgeAuth'

export default defineNuxtPlugin(async () => {
  const { fetchUser } = useForgeAuth()
  await fetchUser()
})
