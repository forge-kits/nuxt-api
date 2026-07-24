import { describe, it, expect, vi } from 'vitest'
import { useForgeForm } from '../src/runtime/composables/useForgeForm'

describe('useForgeForm', () => {
  it('initializes form with given values', () => {
    const { form } = useForgeForm({ email: '', name: 'John' })
    expect(form.email).toBe('')
    expect(form.name).toBe('John')
  })

  it('calls fn with current form data on submit', async () => {
    const fn = vi.fn()
    const { form, submit } = useForgeForm({ email: '' })
    form.email = 'a@b.com'
    await submit(fn)
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }))
  })

  it('loading is true during submit and false after', async () => {
    const states: boolean[] = []
    const { loading, submit } = useForgeForm({ name: '' })
    await submit(async () => { states.push(loading.value) })
    states.push(loading.value)
    expect(states).toEqual([true, false])
  })

  it('maps Pydantic array errors to field-level errors', async () => {
    const { errors, submit } = useForgeForm({ email: '', password: '' })
    await submit(async () => {
      throw {
        data: {
          detail: [
            { loc: ['body', 'email'], msg: 'field required', type: 'missing' },
            { loc: ['body', 'password'], msg: 'too short', type: 'string_too_short' },
          ],
        },
      }
    })
    expect(errors.value.email).toBe('field required')
    expect(errors.value.password).toBe('too short')
  })

  it('sets serverError when detail is a string', async () => {
    const { serverError, submit } = useForgeForm({ email: '' })
    await submit(async () => {
      throw { data: { detail: 'Invalid credentials' } }
    })
    expect(serverError.value).toBe('Invalid credentials')
  })

  it('clears errors before each new submit', async () => {
    const { errors, submit } = useForgeForm({ email: '' })
    await submit(async () => {
      throw { data: { detail: [{ loc: ['body', 'email'], msg: 'required', type: 'missing' }] } }
    })
    expect(errors.value.email).toBe('required')
    await submit(async () => {})
    expect(errors.value).toEqual({})
  })

  it('rethrows unknown errors', async () => {
    const { submit } = useForgeForm({})
    await expect(submit(async () => { throw new Error('network') })).rejects.toThrow('network')
  })

  it('clearErrors resets both errors and serverError', async () => {
    const { serverError, errors, clearErrors, submit } = useForgeForm({ email: '' })
    await submit(async () => { throw { data: { detail: 'oops' } } })
    expect(serverError.value).toBe('oops')
    clearErrors()
    expect(serverError.value).toBeNull()
    expect(errors.value).toEqual({})
  })
})
