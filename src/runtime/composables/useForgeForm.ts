import { reactive, ref } from 'vue'

interface PydanticError {
  loc: (string | number)[]
  msg: string
  type: string
}

interface FetchErrorData {
  detail?: PydanticError[] | string
}

export const useForgeForm = <T extends Record<string, unknown>>(initialValues: T) => {
  const form = reactive<T>({ ...initialValues }) as T
  const errors = ref<Record<string, string>>({})
  const serverError = ref<string | null>(null)
  const loading = ref(false)

  function clearErrors(): void {
    errors.value = {}
    serverError.value = null
  }

  async function submit(fn: (data: T) => Promise<void>): Promise<void> {
    clearErrors()
    loading.value = true
    try {
      await fn(form)
    }
    catch (err: unknown) {
      const data = (err as { data?: FetchErrorData })?.data

      if (data?.detail) {
        if (Array.isArray(data.detail)) {
          // Pydantic validation errors — map loc[-1] → message
          const mapped: Record<string, string> = {}
          for (const item of data.detail) {
            const field = item.loc?.[item.loc.length - 1]
            if (field !== undefined) mapped[String(field)] = item.msg
          }
          errors.value = mapped
          return
        }
        if (typeof data.detail === 'string') {
          serverError.value = data.detail
          return
        }
      }

      throw err
    }
    finally {
      loading.value = false
    }
  }

  return { form, errors, serverError, loading, clearErrors, submit }
}
