# @forge-kits/nuxt

Nuxt module that bridges [forge-kits](https://pypi.org/project/forge-kits/) FastAPI backend with your Nuxt app.

---

## Installation

```bash
npm install @forge-kits/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@forge-kits/nuxt'],
  forgeApi: {
    url: 'http://localhost:8000',
    prefix: '/api/v1',   // or false to omit
    default: 'api',      // default guard name
    guards: {
      api:   { strategy: 'cookie' },
      admin: { strategy: 'cookie' },
    },
  },
})
```

Guards mirror your Python `config/auth.py` – same names, same strategies. Secrets and model paths stay on the backend only.

### All options

| Option | Default | Description |
|---|---|---|
| `url` | `http://localhost:8000` | Backend base URL |
| `prefix` | `/api/v1` | API prefix. Set to `false` to omit |
| `credentials` | `true` | Send cookies with every request |
| `default` | `'api'` | Default guard used when none is specified |
| `guards` | `{ api: { strategy: 'cookie' } }` | Guard definitions |

### Guard options

| Option | Default | Description |
|---|---|---|
| `strategy` | — | `'cookie'` or `'telegram'` |
| `autoFetch` | `false` | Fetch user on app start |
| `endpoints.login` | `/auth/login` (default guard) or `/{name}/auth/login` | Override login path |
| `endpoints.logout` | convention | Override logout path |
| `endpoints.me` | convention | Override me path |

Endpoint convention:
- Default guard → `/auth/login`, `/auth/logout`, `/auth/me`
- Other guards → `/{name}/auth/login`, `/{name}/auth/logout`, `/{name}/auth/me`

`telegram` strategy only generates `me` – no `login` or `logout`.

---

## Auth — `useForgeAuth`

```ts
const { user, isAuthenticated, login, logout, fetchUser } = useForgeAuth()
// or for a specific guard:
const { user, isAuthenticated } = useForgeAuth('admin')
```

### Login page

```vue
<script setup lang="ts">
const { login, isAuthenticated } = useForgeAuth()
const { form, errors, serverError, loading, submit } = useForgeForm({
  email: '',
  password: '',
})

if (isAuthenticated.value) navigateTo('/')

async function handleLogin() {
  await submit(async (data) => {
    await login(data)
    navigateTo('/')
  })
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <input v-model="form.email" type="email" />
    <span v-if="errors.email">{{ errors.email }}</span>
    <input v-model="form.password" type="password" />
    <span v-if="errors.password">{{ errors.password }}</span>
    <p v-if="serverError">{{ serverError }}</p>
    <button :disabled="loading">{{ loading ? 'Signing in…' : 'Sign in' }}</button>
  </form>
</template>
```

| Return | Description |
|---|---|
| `user` | Backend-verified user or `null` |
| `isAuthenticated` | `computed(() => !!user.value)` |
| `login(creds)` | POST to login endpoint, then fetchUser |
| `logout()` | POST to logout endpoint, clears user |
| `fetchUser()` | GET `/me`, hydrates user state |

### Auth middleware

```ts
// factory (recommended)
definePageMeta({
  middleware: [ForgeAuthMiddleware({ redirect: '/login' })],
})

// specific guard
definePageMeta({
  middleware: [ForgeAuthMiddleware({ guard: 'admin', redirect: '/admin/login' })],
})

// manual
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useForgeAuth('admin')
  if (!isAuthenticated.value) return navigateTo('/admin/login')
})
```

### `<ForgeAuth>` component

Renders slot only when authenticated. Optional `guard` prop.

```vue
<ForgeAuth>
  <UserDashboard />
  <template #fallback>
    <NuxtLink to="/login">Login</NuxtLink>
  </template>
</ForgeAuth>

<ForgeAuth guard="admin">
  <AdminPanel />
  <template #fallback>
    <NuxtLink to="/admin/login">Admin login</NuxtLink>
  </template>
</ForgeAuth>
```

---

## Telegram Mini App — `useForgeTg`

Wraps `window.Telegram.WebApp`. Use for UI helpers independent of auth.

```vue
<script setup lang="ts">
const {
  tgUser,           // from initDataUnsafe — display only, not verified
  tgUserId,
  tgUsername,
  tgFullName,
  tgPhotoUrl,
  tgLanguageCode,
  tgIsPremium,
  tgAllowsWriteToPm,
  isWebApp,
  tgReady,          // call WebApp.ready()
  tgHaptic,         // 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
  tgHapticSuccess,
} = useForgeTg()

onMounted(tgReady)
</script>
```

Auth (`useForgeAuth`) with `strategy: 'telegram'` sends `X-Telegram-Init-Data` header automatically. The backend verifies it and returns the backend user. `useForgeTg` is for client-side WebApp UI only.

**Local development** – paste a real `initData` string to `.env`:

```env
VITE_TELEGRAM_INIT_DATA=user=%7B%22id%22%3A...&hash=abc123
```

### `<ForgeTg>` component

Renders slot only inside a Telegram Mini App.

```vue
<ForgeTg>
  <TelegramUI />
  <template #fallback>
    <p>Open in Telegram to continue.</p>
  </template>
</ForgeTg>
```

---

## RBAC — `useForgePermissions`

```ts
const { can, canAll, hasRole, hasAllRoles, permissions, roles } = useForgePermissions()
// or for a specific guard:
const { can } = useForgePermissions('admin')
```

The guard's `/me` response must include `permissions` and `roles` arrays.

| Method | Returns `true` when |
|---|---|
| `can(...perms)` | user has **any** of the permissions |
| `canAll(...perms)` | user has **all** permissions |
| `hasRole(...roles)` | user has **any** of the roles |
| `hasAllRoles(...roles)` | user has **all** roles |

### `<ForgeCan>` / `<ForgeRole>` components

```vue
<ForgeCan perm="edit:posts">
  <button>Edit</button>
</ForgeCan>

<ForgeCan :perm="['edit:posts', 'publish:posts']" :all="true">
  <PublishPanel />
</ForgeCan>

<ForgeRole role="admin">
  <AdminPanel />
  <template #fallback><p>Admins only.</p></template>
</ForgeRole>
```

Optional `guard` prop on both components.

### RBAC route middleware

```ts
definePageMeta({
  middleware: [
    PermissionMiddleware('edit:posts', { redirect: '/403' }),
  ],
})

definePageMeta({
  middleware: [PermissionAllMiddleware(['edit:posts', 'publish:posts'])],
})

definePageMeta({
  middleware: [RoleMiddleware('admin', { redirect: '/403' })],
})
```

Without `redirect` – throws `403 Forbidden`.

---

## API calls — `useForgeApi`

```ts
const api = useForgeApi()          // default guard
const api = useForgeApi('admin')   // specific guard

const posts = await api.get<Post[]>('/posts', { params: { page: 1 } })
const post  = await api.post<Post>('/posts', { title: 'Hello' })
await api.patch<Post>(`/posts/${id}`, { title: 'Updated' })
await api.put<Post>(`/posts/${id}`, { title: 'Replaced', body: '...' })
await api.delete(`/posts/${id}`)
```

---

## CRUD — `useForgeCrud`

Wraps the standard forge-kits Controller convention: `GET /url`, `POST /url`, `GET /url/{id}`, `PATCH /url/{id}`, `DELETE /url/{id}`.

```ts
const { list, get, create, update, replace, remove, loading } = useForgeCrud<Post>('/posts')

const posts  = await list({ page: 1, search: 'nuxt' })
const post   = await get(42)
const newPost = await create({ title: 'Hello' })
await update(42, { title: 'Updated' })
await replace(42, { title: 'Replaced', body: '...' })
await remove(42)
```

Per-action loading states:

```ts
loading.list.value    // true while list() is in-flight
loading.get.value
loading.create.value
loading.update.value
loading.remove.value
```

Two independent instances on the same page:

```ts
const posts    = useForgeCrud('/posts')
const comments = useForgeCrud('/comments')
// loading states are fully isolated
```

Optional `guard` option:

```ts
const crud = useForgeCrud('/admin/posts', { guard: 'admin' })
```

---

## Pagination — `useForgePagination`

Offset-based pagination. Fetches on mount (SSR-compatible).

```vue
<script setup lang="ts">
const { data, meta, loading, error, page, nextPage, prevPage, goToPage } =
  useForgePagination<Post>('/posts', { perPage: 20 })
</script>

<template>
  <ul>
    <li v-for="post in data" :key="post.id">{{ post.title }}</li>
  </ul>
  <button :disabled="page <= 1" @click="prevPage">← Prev</button>
  <span>{{ page }} / {{ meta?.last_page }}</span>
  <button :disabled="!meta || page >= meta.last_page" @click="nextPage">Next →</button>
</template>
```

Backend envelope: `{ data: T[], meta: { current_page, per_page, total, last_page, from, to }, links: { prev, next } }`

---

## Cursor pagination — `useForgeCursorPagination`

Cursor-based pagination with `loadMore` for infinite scroll.

```vue
<script setup lang="ts">
const { data, loading, hasMore, fetch, loadMore, reset } =
  useForgeCursorPagination<Post>('/posts', { perPage: 20 })
</script>

<template>
  <ul>
    <li v-for="post in data" :key="post.id">{{ post.title }}</li>
  </ul>
  <button v-if="hasMore" :disabled="loading" @click="loadMore">Load more</button>
</template>
```

| Return | Description |
|---|---|
| `data` | Accumulated items |
| `nextCursor` / `prevCursor` | Current cursors |
| `hasMore` | `true` when `next_cursor` is not null |
| `fetch(cursor?)` | Replace data with fresh page |
| `loadMore()` | Append next page to data |
| `reset()` | Clear data and meta |

Backend envelope: `{ data: T[], meta: { next_cursor, prev_cursor, per_page } }`

---

## Forms — `useForgeForm`

Maps FastAPI 422 Pydantic errors to field-level `errors`.

```ts
const { form, errors, serverError, loading, clearErrors, reset, submit } = useForgeForm({
  title: '',
  body: '',
})

await submit(async (data) => {
  await api.post('/posts', data)
  navigateTo('/posts')
})
```

| Return | Description |
|---|---|
| `form` | Reactive form data |
| `errors` | Field errors from Pydantic 422 |
| `serverError` | Non-field error from `detail` string |
| `loading` | `true` while submit is in-flight |
| `clearErrors()` | Reset all errors |
| `reset()` | Reset form to initial values and clear errors |
| `submit(fn)` | Run `fn`, catch and map backend errors |

---

## File uploads — `useForgeUpload`

Real-time progress via `XMLHttpRequest`.

```ts
const { progress, loading, error, result, upload, reset } = useForgeUpload('/files/upload')
// or for a specific guard:
const { upload } = useForgeUpload('/files/upload', 'admin')

const res = await upload(file)
console.log(res.url)

// with extra form fields
await upload(file, { category: 'avatars' })
```

---

## API reference

### Composables

| Composable | Signature |
|---|---|
| `useForgeAuth` | `(guard?: string)` |
| `useForgePermissions` | `(guard?: string)` |
| `useForgeApi` | `(guard?: string)` |
| `useForgeForm` | `<T>(initial: T)` |
| `useForgeCrud` | `<T>(url, opts?: { guard? })` |
| `useForgePagination` | `<T>(url, opts?: { perPage?, immediate?, guard? })` |
| `useForgeCursorPagination` | `<T>(url, opts?: { perPage?, immediate?, guard? })` |
| `useForgeUpload` | `(path, guard?: string)` |
| `useForgeTg` | `()` |

### Components

| Component | Props | Description |
|---|---|---|
| `<ForgeAuth>` | `guard?: string` | Renders slot if authenticated |
| `<ForgeTg>` | — | Renders slot only inside Telegram Mini App |
| `<ForgeCan>` | `perm: string\|string[], all?: boolean, guard?: string` | Permission check |
| `<ForgeRole>` | `role: string\|string[], all?: boolean, guard?: string` | Role check |

All components accept a `#fallback` slot.

### Middleware factories

| Factory | Signature |
|---|---|
| `ForgeAuthMiddleware` | `(opts?: { guard?, redirect? })` |
| `PermissionMiddleware` | `(perm, opts?: { guard?, redirect? })` |
| `PermissionAllMiddleware` | `(perm, opts?: { guard?, redirect? })` |
| `RoleMiddleware` | `(role, opts?: { guard?, redirect? })` |
| `RoleAllMiddleware` | `(role, opts?: { guard?, redirect? })` |
