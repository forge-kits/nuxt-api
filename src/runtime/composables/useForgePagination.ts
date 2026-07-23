import { ref, onMounted } from 'vue'
import { useForgeApi } from './useForgeApi'

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
}

export interface PaginationLinks {
  prev: string | null
  next: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
  links: PaginationLinks
}

export interface PaginationOptions {
  perPage?: number
  immediate?: boolean   // fetch on mount (default: true)
}

export const useForgePagination = <T = Record<string, unknown>>(
  url: string,
  options: PaginationOptions = {},
) => {
  const api = useForgeApi()

  const data = ref<T[]>([]) as ReturnType<typeof ref<T[]>>
  const meta = ref<PaginationMeta | null>(null)
  const links = ref<PaginationLinks | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const page = ref(1)
  const perPage = ref<number | null>(options.perPage ?? null)

  const fetch = async (params: { page?: number; per_page?: number } = {}): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const resolvedPerPage = params.per_page ?? (perPage.value ?? undefined)
      const queryParams: Record<string, unknown> = { page: params.page ?? page.value }
      if (resolvedPerPage !== undefined) queryParams.per_page = resolvedPerPage

      const response = await api.get<PaginatedResponse<T>>(url, { params: queryParams })
      data.value = response.data
      meta.value = response.meta
      links.value = response.links
      perPage.value = response.meta.per_page
      if (params.page !== undefined) page.value = params.page
    }
    catch (err) {
      error.value = err as Error
    }
    finally {
      loading.value = false
    }
  }

  const nextPage = async (): Promise<void> => {
    if (!meta.value || page.value >= meta.value.last_page) return
    await fetch({ page: page.value + 1 })
  }

  const prevPage = async (): Promise<void> => {
    if (page.value <= 1) return
    await fetch({ page: page.value - 1 })
  }

  const goToPage = async (n: number): Promise<void> => {
    await fetch({ page: n })
  }

  if (options.immediate !== false) {
    onMounted(() => fetch())
  }

  return {
    data,
    meta,
    links,
    loading,
    error,
    page,
    perPage,
    fetch,
    nextPage,
    prevPage,
    goToPage,
  }
}
