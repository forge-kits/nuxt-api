import { computed } from 'vue'

export const useForgeTg = () => {
  const tgWebApp = computed(() =>
    import.meta.client ? (window as any)?.Telegram?.WebApp ?? null : null,
  )

  const initDataUnsafe = computed(() => tgWebApp.value?.initDataUnsafe ?? null)
  const tgUser = computed(() => initDataUnsafe.value?.user ?? null)
  const tgUserId = computed<number | null>(() => tgUser.value?.id ?? null)
  const tgUsername = computed<string | null>(() => tgUser.value?.username ?? null)
  const tgFullName = computed<string | null>(() => {
    const first = tgUser.value?.first_name ?? ''
    const last = tgUser.value?.last_name ?? ''
    return `${first} ${last}`.trim() || null
  })
  const tgLanguageCode = computed<string | null>(() => tgUser.value?.language_code ?? null)
  const tgIsPremium = computed<boolean>(() => !!tgUser.value?.is_premium)
  const tgAllowsWriteToPm = computed<boolean>(() => !!tgUser.value?.allows_write_to_pm)
  const tgPhotoUrl = computed<string | null>(() => tgUser.value?.photo_url ?? null)

  const isWebApp = computed<boolean>(() => {
    if (!import.meta.client) return false
    const initData = tgWebApp.value?.initData
      ?? (import.meta.dev ? (import.meta.env.VITE_TELEGRAM_INIT_DATA ?? '') : '')
    return !!initData
  })

  const tgReady = (): void => { try { tgWebApp.value?.ready?.() } catch {} }

  const tgHaptic = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium'): void => {
    try { tgWebApp.value?.HapticFeedback?.impactOccurred(style) } catch {}
  }

  const tgHapticSuccess = (): void => {
    try { tgWebApp.value?.HapticFeedback?.notificationOccurred('success') } catch {}
  }

  return {
    tgUser,
    tgUserId,
    tgUsername,
    tgFullName,
    tgLanguageCode,
    tgIsPremium,
    tgAllowsWriteToPm,
    tgPhotoUrl,
    isWebApp,
    tgReady,
    tgHaptic,
    tgHapticSuccess,
  }
}
