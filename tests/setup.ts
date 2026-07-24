import { vi, beforeEach } from 'vitest'
import { resetStore, resetConfig } from './__mocks__/imports'

vi.stubGlobal('$fetch', vi.fn())

beforeEach(() => {
  resetStore()
  resetConfig()
  vi.mocked($fetch).mockReset()
  vi.unstubAllGlobals()
  vi.stubGlobal('$fetch', vi.fn())
})
