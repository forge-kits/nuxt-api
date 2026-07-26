import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'

type TelegramWindow = typeof window & {
  Telegram?: { WebApp: { initData: string } }
}

export interface UploadResponse {
  url: string
  path?: string
  [key: string]: unknown
}

export const useForgeUpload = (uploadPath: string) => {
  const config = useRuntimeConfig()
  const { url, prefix, strategy, credentials } = config.public.forgeApi
  const baseURL = prefix ? `${url}${prefix}` : url

  const progress = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<UploadResponse | null>(null)

  function upload(file: File, extra?: Record<string, string>): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)
      if (extra) {
        for (const [k, v] of Object.entries(extra)) formData.append(k, v)
      }

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${baseURL}${uploadPath}`)
      xhr.withCredentials = credentials

      if (strategy === 'telegram' && import.meta.client) {
        const initData = (window as TelegramWindow).Telegram?.WebApp?.initData ?? ''
        if (initData) xhr.setRequestHeader('X-Telegram-Init-Data', initData)
      }

      xhr.upload.onprogress = (e: ProgressEvent) => {
        if (e.lengthComputable) {
          progress.value = Math.round((e.loaded / e.total) * 100)
        }
      }

      xhr.onload = () => {
        loading.value = false
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as UploadResponse
            result.value = data
            resolve(data)
          }
          catch {
            const err = new Error('Invalid response from server')
            error.value = err.message
            reject(err)
          }
        }
        else {
          const err = new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`)
          error.value = err.message
          reject(err)
        }
      }

      xhr.onerror = () => {
        loading.value = false
        error.value = 'Network error'
        reject(new Error('Network error'))
      }

      loading.value = true
      error.value = null
      progress.value = 0
      xhr.send(formData)
    })
  }

  function reset(): void {
    progress.value = 0
    loading.value = false
    error.value = null
    result.value = null
  }

  return { progress, loading, error, result, upload, reset }
}
