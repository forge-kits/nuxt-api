import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { useForgeAuth } from '../composables/useForgeAuth'

export default defineNuxtPlugin(async () => {
  const { guards } = useRuntimeConfig().public.forgeApi
  const tasks: Promise<void>[] = []
  for (const [name, guard] of Object.entries(guards)) {
    if (guard.autoFetch) tasks.push(useForgeAuth(name).fetchUser())
  }
  await Promise.all(tasks)
})
