import { useRuntimeConfig } from '#imports'

export function useForgeHttp(guard?: string) {
  const config = useRuntimeConfig()
  const { url, prefix, credentials, guards, default: defaultGuard } = config.public.forgeApi
  const guardName = guard ?? defaultGuard
  const strategy = guards[guardName]?.strategy ?? 'cookie'

  const baseURL = prefix ? `${url}${prefix}` : url
  const credentialsMode = credentials ? 'include' as const : 'omit' as const

  function buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = { ...extra }
    if (strategy === 'telegram' && import.meta.client) {
      const initData = (window as any)?.Telegram?.WebApp?.initData
        ?? (import.meta.dev ? (import.meta.env.VITE_TELEGRAM_INIT_DATA ?? '') : '')
      if (initData) h['X-Telegram-Init-Data'] = initData
    }
    return h
  }

  return { baseURL, credentialsMode, buildHeaders }
}
