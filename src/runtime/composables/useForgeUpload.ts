import { ref } from 'vue'
import { useForgeHttp } from '../utils/forge-http'

export interface UploadResponse {
  url: string
  path?: string
  [key: string]: unknown
}

export const useForgeUpload = (uploadPath: string, guard?: string) => {
  const { baseURL, credentialsMode, buildHeaders } = useForgeHttp(guard)

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

      const headers = buildHeaders()
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${baseURL}${uploadPath}`)
      xhr.withCredentials = credentialsMode === 'include'

      for (const [k, v] of Object.entries(headers)) {
        xhr.setRequestHeader(k, v)
      }

      xhr.upload.onprogress = (e: ProgressEvent) => {
        if (e.lengthComputable) progress.value = Math.round((e.loaded / e.total) * 100)
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
