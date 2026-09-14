import { ref } from 'vue'
import { useForgeApi } from './useForgeApi'

export interface CrudOptions {
  guard?: string
}

export const useForgeCrud = <T = Record<string, unknown>>(
  url: string,
  options: CrudOptions = {},
) => {
  const api = useForgeApi(options.guard)

  const loading = {
    list:   ref(false),
    get:    ref(false),
    create: ref(false),
    update: ref(false),
    remove: ref(false),
  }

  async function withLoading<R>(key: keyof typeof loading, fn: () => Promise<R>): Promise<R> {
    loading[key].value = true
    try {
      return await fn()
    }
    finally {
      loading[key].value = false
    }
  }

  const list = <R = T[]>(params?: Record<string, string | number | boolean>) =>
    withLoading('list', () => api.get<R>(url, { params }))

  const get = <R = T>(id: string | number) =>
    withLoading('get', () => api.get<R>(`${url}/${id}`))

  const create = <R = T>(body: unknown) =>
    withLoading('create', () => api.post<R>(url, body))

  const update = <R = T>(id: string | number, body: unknown) =>
    withLoading('update', () => api.patch<R>(`${url}/${id}`, body))

  const replace = <R = T>(id: string | number, body: unknown) =>
    withLoading('update', () => api.put<R>(`${url}/${id}`, body))

  const remove = <R = void>(id: string | number) =>
    withLoading('remove', () => api.delete<R>(`${url}/${id}`))

  return { list, get, create, update, replace, remove, loading }
}
