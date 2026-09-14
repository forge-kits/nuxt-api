import { ref, computed, onMounted, onServerPrefetch } from 'vue'
import { useNuxtApp } from '#imports'
import { useForgeApi } from './useForgeApi'

export interface CursorMeta {
  next_cursor: string | null
  prev_cursor: string | null
  per_page: number
}

export interface CursorPaginatedResponse<T> {
  data: T[]
  meta: CursorMeta
}

export interface CursorPaginationOptions {
  perPage?: number
  immediate?: boolean
  guard?: string
}

export const useForgeCursorPagination = <T = Record<string, unknown>>(
  url: string,
  options: CursorPaginationOptions = {},
) => {
  const api = useForgeApi(options.guard)

  const data = ref<T[]>([]) as ReturnType<typeof ref<T[]>>
  const meta = ref<CursorMeta | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const nextCursor = computed(() => meta.value?.next_cursor ?? null)
  const prevCursor = computed(() => meta.value?.prev_cursor ?? null)
  const hasMore = computed(() => !!nextCursor.value)

  const fetch = async (cursor?: string | null): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const params: Record<string, string | number> = {}
      if (cursor) params.cursor = cursor
      if (options.perPage) params.per_page = options.perPage

      const response = await api.get<CursorPaginatedResponse<T>>(url, { params })
      data.value = response.data
      meta.value = response.meta
    }
    catch (err) {
      error.value = err as Error
    }
    finally {
      loading.value = false
    }
  }

  const loadMore = async (): Promise<void> => {
    if (!hasMore.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      const params: Record<string, string | number> = { cursor: nextCursor.value! }
      if (options.perPage) params.per_page = options.perPage

      const response = await api.get<CursorPaginatedResponse<T>>(url, { params })
      data.value = [...data.value as T[], ...response.data] as T[]
      meta.value = response.meta
    }
    catch (err) {
      error.value = err as Error
    }
    finally {
      loading.value = false
    }
  }

  const reset = (): void => {
    data.value = [] as T[]
    meta.value = null
    error.value = null
  }

  if (options.immediate !== false) {
    onServerPrefetch(() => fetch())
    onMounted(() => {
      if (!useNuxtApp().isHydrating) fetch()
    })
  }

  return { data, meta, loading, error, nextCursor, prevCursor, hasMore, fetch, loadMore, reset }
}
