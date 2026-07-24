import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { useForgeAuth } from '../composables/useForgeAuth'

export default defineNuxtPlugin(async () => {
  const { auth } = useRuntimeConfig().public.forgeApi
  if (!auth.autoFetch) return
  const { fetchUser } = useForgeAuth()
  await fetchUser()
})
