# @forge-kits/nuxt

Nuxt module that bridges [forge-kits](https://pypi.org/project/forge-kits/) FastAPI backend with your Nuxt app.

**Two auth contexts, one module:**
- `useForgeAuth()` — regular users. Login, logout, current user. No roles, no permissions.
- `useForgeAuth('admin')` — admin panel. Independent session, full RBAC via `useForgePermissions`.

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
    prefix: '/api/v1',
    strategy: 'cookie', // 'cookie' | 'telegram'
  },
})
```

### All options

| Option | Default | Description |
|---|---|---|
| `url` | `http://localhost:8000` | Backend base URL |
| `prefix` | `/api/v1` | API prefix, prepended to every request |
| `strategy` | `cookie` | Auth strategy: `cookie` or `telegram` |
| `credentials` | `true` | Send cookies with every request |
| `auth.autoFetch` | `true` | Fetch current user on app start |
| `auth.user.login` | `/auth/login` | User login endpoint |
| `auth.user.logout` | `/auth/logout` | User logout endpoint |
| `auth.user.me` | `/auth/me` | User current-user endpoint |
| `auth.admin.login` | `/admin/auth/login` | Admin login endpoint |
| `auth.admin.logout` | `/admin/auth/logout` | Admin logout endpoint |
| `auth.admin.me` | `/admin/auth/me` | Admin current-user endpoint |

---

## User auth — Cookie

The server sets a signed `httpOnly` session cookie. Every request sends `credentials: 'include'` automatically. On app start the module calls `/auth/me` and hydrates the user state.

### Login page

```vue
<!-- pages/login.vue -->
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
    <div>
      <input v-model="form.email" type="email" placeholder="Email" />
      <span v-if="errors.email">{{ errors.email }}</span>
    </div>
    <div>
      <input v-model="form.password" type="password" placeholder="Password" />
      <span v-if="errors.password">{{ errors.password }}</span>
    </div>
    <p v-if="serverError">{{ serverError }}</p>
    <button :disabled="loading">{{ loading ? 'Signing in…' : 'Sign in' }}</button>
  </form>
</template>
```

### Navbar / current user

```vue
<script setup lang="ts">
const { user, isAuthenticated, logout } = useForgeAuth()
</script>

<template>
  <nav>
    <template v-if="isAuthenticated">
      <span>{{ user?.email }}</span>
      <button @click="logout">Logout</button>
    </template>
    <NuxtLink v-else to="/login">Login</NuxtLink>
  </nav>
</template>
```

### Auth guard middleware

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useForgeAuth()
  if (!isAuthenticated.value) return navigateTo('/login')
})
```

**Backend:**

```python
# app/controllers/auth_controller.py
class AuthController(Controller):
    prefix = "/auth"

    @route.post("/login")
    async def login(self, body: LoginRequest, response: Response):
        user = await User.get_or_none(email=body.email)
        if not user or not user.check_password(body.password):
            raise HTTPException(401, "Invalid credentials")
        auth.set_cookie(response, user.auth_claims())
        return {"ok": True}

    @route.post("/logout")
    async def logout(self, response: Response):
        auth.delete_cookie(response)
        return {"ok": True}

    @route.get("/me")
    async def me(self, auth_user: CurrentUser):
        user = await User.find_or_fail(int(auth_user.id))
        return {"id": user.id, "email": user.email}
```

---

## User auth — Telegram Mini App

Reads `window.Telegram.WebApp.initData` and sends it as `X-Telegram-Init-Data` on every request. No login/logout — the user is resolved via `/auth/me` on app start.

```ts
// nuxt.config.ts
forgeApi: { strategy: 'telegram' }
```

```vue
<script setup lang="ts">
const {
  user,              // backend user (server-verified)
  isAuthenticated,
  fetchUser,
  tgUser,            // from initDataUnsafe — display only, untrusted
  tgUserId,
  tgUsername,
  tgFullName,
  tgPhotoUrl,
  tgLanguageCode,
  tgIsPremium,
  tgAllowsWriteToPm,
  isWebApp,
  tgReady,           // call WebApp.ready()
  tgHaptic,          // 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
  tgHapticSuccess,
} = useForgeAuth()

onMounted(tgReady)
</script>

<template>
  <div v-if="isAuthenticated">
    <img v-if="tgPhotoUrl" :src="tgPhotoUrl" />
    <p>{{ tgFullName }}</p>
    <p v-if="tgIsPremium">⭐ Premium</p>
  </div>
</template>
```

**Local development** — paste a real `initData` string to `.env`:

```env
VITE_TELEGRAM_INIT_DATA=user=%7B%22id%22%3A...&hash=abc123
```

---

## Admin auth & RBAC

Admin has its own independent session (`forge_admin` state, separate endpoints). The `/admin/auth/me` response must include `permissions` and `roles` arrays — the module uses them for all RBAC checks.

### Admin login page

```vue
<!-- pages/admin/login.vue -->
<script setup lang="ts">
const { login, isAuthenticated } = useForgeAuth('admin')
const { form, errors, serverError, loading, submit } = useForgeForm({
  email: '',
  password: '',
})

if (isAuthenticated.value) navigateTo('/admin/dashboard')

async function handleLogin() {
  await submit(async (data) => {
    await login(data)
    navigateTo('/admin/dashboard')
  })
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <div>
      <input v-model="form.email" type="email" placeholder="Email" />
      <span v-if="errors.email">{{ errors.email }}</span>
    </div>
    <div>
      <input v-model="form.password" type="password" placeholder="Password" />
      <span v-if="errors.password">{{ errors.password }}</span>
    </div>
    <p v-if="serverError">{{ serverError }}</p>
    <button :disabled="loading">{{ loading ? 'Signing in…' : 'Admin sign in' }}</button>
  </form>
</template>
```

### Admin auth guard middleware

```ts
// middleware/admin-auth.ts
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useForgeAuth('admin')
  if (!isAuthenticated.value) return navigateTo('/admin/login')
})
```

### RBAC in templates — `<ForgeCan>` / `<ForgeRole>`

```vue
<!-- any permission from the list -->
<ForgeCan perm="edit:posts">
  <button>Edit</button>
</ForgeCan>

<!-- must have ALL permissions -->
<ForgeCan :perm="['edit:posts', 'publish:posts']" :all="true">
  <PublishPanel />
</ForgeCan>

<!-- role-based with fallback -->
<ForgeRole role="admin">
  <AdminPanel />
  <template #fallback>
    <p>Admins only.</p>
  </template>
</ForgeRole>

<!-- must have ALL roles -->
<ForgeRole :role="['admin', 'editor']" :all="true">
  <SuperPanel />
</ForgeRole>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `perm` / `role` | `string \| string[]` | — | Permission(s) or role(s) to check |
| `all` | `boolean` | `false` | Require all (AND) instead of any (OR) |

### RBAC in logic — `useForgePermissions`

```vue
<script setup lang="ts">
const { can, canAll, hasRole, hasAllRoles, permissions, roles } = useForgePermissions()
</script>

<template>
  <button v-if="can('edit:posts')">Edit</button>
  <button v-if="hasRole('admin')">Delete</button>
</template>
```

| Method | Returns `true` when |
|---|---|
| `can(...perms)` | admin has **any** of the permissions |
| `canAll(...perms)` | admin has **all** permissions |
| `hasRole(...roles)` | admin has **any** of the roles |
| `hasAllRoles(...roles)` | admin has **all** roles |

### RBAC route middleware

```ts
// pages/admin/posts/[id]/edit.vue
definePageMeta({
  middleware: [
    'admin-auth',
    PermissionMiddleware('edit:posts', { redirect: '/admin/403' }),
  ],
})

// require ALL permissions
definePageMeta({
  middleware: [PermissionAllMiddleware(['edit:posts', 'publish:posts'], { redirect: '/admin/403' })],
})

// role-based
definePageMeta({
  middleware: [RoleMiddleware('editor', { redirect: '/admin/403' })],
})

// require ALL roles
definePageMeta({
  middleware: [RoleAllMiddleware(['admin', 'editor'], { redirect: '/admin/403' })],
})
```

Without `redirect` option — throws `403 Forbidden`. With `redirect` — calls `navigateTo(redirect)`.

**Backend:**

```python
@route.get("/me")
async def me(self, auth_user: CurrentUser):
    admin = await Admin.find_or_fail(int(auth_user.id))
    return {
        "id":          admin.id,
        "email":       admin.email,
        "permissions": await admin.get_all_permissions(),
        "roles":       await admin.get_role_names(),
    }
```

---

## API calls — `useForgeApi`

Typed wrapper around `$fetch`. Automatically attaches `baseURL`, cookies/Telegram header, and `credentials`.

```vue
<script setup lang="ts">
interface Post { id: number; title: string; body: string }

const api = useForgeApi()

const posts = await api.get<Post[]>('/posts', { params: { page: 1, search: 'nuxt' } })
const post  = await api.post<Post>('/posts', { title: 'Hello', body: '...' })

await api.patch<Post>(`/posts/${post.id}`, { title: 'Updated' })
await api.put<Post>(`/posts/${post.id}`, { title: 'Replaced', body: '...' })
await api.delete(`/posts/${post.id}`)
</script>
```

---

## Forms — `useForgeForm`

Automatically maps FastAPI 422 Pydantic validation errors to field-level `errors`. Non-field errors go to `serverError`. Re-throws unknown errors so you can handle them upstream.

```vue
<script setup lang="ts">
const api = useForgeApi()
const { form, errors, serverError, loading, clearErrors, submit } = useForgeForm({
  title: '',
  body: '',
  tags: '',
})

async function handleSubmit() {
  await submit(async (data) => {
    await api.post('/posts', data)
    navigateTo('/posts')
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model="form.title" placeholder="Title" />
      <span v-if="errors.title">{{ errors.title }}</span>
    </div>
    <div>
      <textarea v-model="form.body" placeholder="Body" />
      <span v-if="errors.body">{{ errors.body }}</span>
    </div>
    <p v-if="serverError" class="error">{{ serverError }}</p>
    <button :disabled="loading">{{ loading ? 'Saving…' : 'Save' }}</button>
  </form>
</template>
```

| Return | Type | Description |
|---|---|---|
| `form` | `reactive<T>` | Two-way bound form data |
| `errors` | `Ref<Record<string, string>>` | Field errors from Pydantic 422 |
| `serverError` | `Ref<string \| null>` | Non-field error from `detail` string |
| `loading` | `Ref<boolean>` | `true` while submit is in-flight |
| `clearErrors()` | `() => void` | Reset all errors manually |
| `submit(fn)` | `(fn) => Promise<void>` | Run `fn`, catch and map backend errors |

---

## Pagination — `useForgePagination`

Fetches paginated data on mount. Backend must return the standard forge-kits envelope.

```vue
<script setup lang="ts">
interface Post { id: number; title: string }

const { data, meta, loading, error, page, nextPage, prevPage, goToPage } =
  useForgePagination<Post>('/posts', { perPage: 20 })
</script>

<template>
  <div v-if="loading">Loading…</div>
  <ul v-else>
    <li v-for="post in data" :key="post.id">{{ post.title }}</li>
  </ul>

  <div>
    <button :disabled="page <= 1" @click="prevPage">← Prev</button>
    <span>{{ page }} / {{ meta?.last_page }}</span>
    <button :disabled="!meta || page >= meta.last_page" @click="nextPage">Next →</button>
  </div>
</template>
```

| Option | Type | Default | Description |
|---|---|---|---|
| `perPage` | `number` | backend default | Items per page |
| `immediate` | `boolean` | `true` | Fetch on mount |

`PaginationMeta`: `{ current_page, per_page, total, last_page, from, to }`

Backend envelope: `{ data: T[], meta: PaginationMeta, links: { prev, next } }`

---

## File uploads — `useForgeUpload`

Uses `XMLHttpRequest` for real-time progress tracking. Cookies and Telegram header are sent automatically.

```vue
<script setup lang="ts">
const { progress, loading, error, result, upload, reset } = useForgeUpload('/files/upload')

async function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const res = await upload(file)
  console.log('URL:', res.url)
}

// with extra form fields
async function handleAvatar(file: File) {
  await upload(file, { category: 'avatars' })
}
</script>

<template>
  <input type="file" @change="handleFile" />
  <div v-if="loading">
    <progress :value="progress" max="100" />
    <span>{{ progress }}%</span>
  </div>
  <p v-if="error">{{ error }}</p>
  <img v-if="result?.url" :src="result.url" />
  <button v-if="result" @click="reset">Upload another</button>
</template>
```

| Return | Type | Description |
|---|---|---|
| `progress` | `Ref<number>` | 0–100, updated in real time |
| `loading` | `Ref<boolean>` | `true` while uploading |
| `error` | `Ref<string \| null>` | Error message if upload failed |
| `result` | `Ref<{ url, path?, ...} \| null>` | Server response |
| `upload(file, extra?)` | `Promise<UploadResponse>` | Start upload |
| `reset()` | `() => void` | Clear state |

---

## API reference

### Composables

| Composable | Signature | Returns |
|---|---|---|
| `useForgeAuth` | `(role?: 'user' \| 'admin')` | `user, isAuthenticated, login, logout, fetchUser, initData, initDataUnsafe, tgUser, tgUserId, tgUsername, tgFullName, tgPhotoUrl, tgLanguageCode, tgIsPremium, tgAllowsWriteToPm, isWebApp, tgReady, tgHaptic, tgHapticSuccess` |
| `useForgePermissions` | `()` | `permissions, roles, can, canAll, hasRole, hasAllRoles` |
| `useForgeApi` | `()` | `get, post, patch, put, delete` |
| `useForgeForm` | `<T>(initial: T)` | `form, errors, serverError, loading, clearErrors, submit` |
| `useForgePagination` | `<T>(url, opts?)` | `data, meta, links, loading, error, page, perPage, fetch, nextPage, prevPage, goToPage` |
| `useForgeUpload` | `(path: string)` | `progress, loading, error, result, upload, reset` |

### Components (admin RBAC only)

| Component | Props | Description |
|---|---|---|
| `<ForgeCan>` | `perm: string\|string[], all?: boolean` | Renders slot if admin has the permission(s) |
| `<ForgeRole>` | `role: string\|string[], all?: boolean` | Renders slot if admin has the role(s) |

Both accept a `#fallback` slot rendered when access is denied.

### Middleware factories (admin RBAC only)

| Factory | Signature | Description |
|---|---|---|
| `PermissionMiddleware` | `(perm, opts?)` | Any of the given permissions |
| `PermissionAllMiddleware` | `(perm, opts?)` | All of the given permissions |
| `RoleMiddleware` | `(role, opts?)` | Any of the given roles |
| `RoleAllMiddleware` | `(role, opts?)` | All of the given roles |

`opts`: `{ redirect?: string }`
