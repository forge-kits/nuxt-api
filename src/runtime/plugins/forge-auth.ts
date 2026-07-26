import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { useForgeAuth } from '../composables/useForgeAuth'

export default defineNuxtPlugin(async () => {
  const { auth } = useRuntimeConfig().public.forgeApi
  const tasks: Promise<void>[] = []
  if (auth.client.autoFetch) tasks.push(useForgeAuth('client').fetchUser())
  if (auth.guard.autoFetch) tasks.push(useForgeAuth('guard').fetchUser())
  await Promise.all(tasks)
})
