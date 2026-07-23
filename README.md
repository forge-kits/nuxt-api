# @forge-kits/nuxt

Nuxt composables bridge for [forge-kits](https://github.com/netpeak-bg/fastapi-kit) (FastAPI backend).

## Installation

```bash
npm install @forge-kits/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@forge-kits/nuxt'],
  forgeApi: {
    baseUrl: 'http://localhost:8000',
    strategy: 'cookie', // 'cookie' | 'telegram'
  },
})
```

Defaults (override only what differs):

| Option | Default |
|---|---|
| `baseUrl` | `http://localhost:8000` |
| `prefix` | `/api/v1` |
| `strategy` | `cookie` |
| `auth.login` | `/auth/login` |
| `auth.logout` | `/auth/logout` |
| `auth.me` | `/auth/me` |

---

## Auth

### Cookie (default)

The server sets a signed `httpOnly` session cookie. Every request sends `credentials: 'include'` automatically. Session is restored after page refresh — the module calls `/auth/me` on app start.

```vue
<script setup>
const { user, isAuthenticated, login, logout } = useForgeAuth()
</script>

<template>
  <div v-if="isAuthenticated">Hello, {{ user.name }}</div>
  <button @click="login({ email: 'user@example.com', password: 'secret' })">Login</button>
  <button @click="logout">Logout</button>
</template>
```

### Telegram Mini App

Reads `window.Telegram.WebApp.initData` and sends it as `X-Telegram-Init-Data`. No explicit login needed — the user is resolved automatically on mount.

```ts
// nuxt.config.ts
forgeApi: { strategy: 'telegram' }
```

### Backend (FastAPI)

```python
# config/auth.py
from forgeapi import env

config = {
    "default": "api",
    "guards": {
        "api": {
            "strategy": "cookie",
            "secret": env("COOKIE_SECRET"),
            "max_age": 60 * 60 * 24 * 7,  # 7 days
            "httponly": True,
            "secure": False,  # True in production
            "samesite": "lax",
        },
    },
}
```

```python
# config/http.py
config = {
    "cors": ["http://localhost:3000"],  # explicit origin required for credentials
}
```

```python
# app/controllers/auth_controller.py
from fastapi import HTTPException, Response
from forgeapi.auth import auth, CurrentUser
from forgeapi.controllers import Controller, route

class AuthController(Controller):
    prefix = "/auth"
    tags = ["auth"]

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
        return {
            "id":          user.id,
            "email":       user.email,
            "name":        user.name,
            "permissions": await user.get_all_permissions(),
            "roles":       await user.get_role_names(),
        }
```

---

## Permissions & RBAC

`/auth/me` must return `permissions` and `roles`. Once it does:

```vue
<script setup>
const { can, canAll, hasRole, hasAllRoles } = useForgeAuth()
// or separately:
const { can, hasRole } = useForgePermissions()
</script>

<template>
  <button v-if="can('edit:posts')">Edit</button>
  <button v-if="hasRole('admin')">Admin panel</button>
  <button v-if="canAll('edit:posts', 'publish:posts')">Publish</button>
</template>
```

| Method | Returns `true` when |
|--------|-------------|
| `can(...perms)` | user has **any** of the permissions |
| `canAll(...perms)` | user has **all** permissions |
| `hasRole(...roles)` | user has **any** of the roles |
| `hasAllRoles(...roles)` | user has **all** roles |

---

## Route middleware

```vue
<script setup>
// throws 403 if permission missing
definePageMeta({ middleware: [PermissionMiddleware('edit:posts')] })
</script>
```

```vue
<script setup>
// throws 403 if role missing
definePageMeta({ middleware: [RoleMiddleware('admin')] })
</script>
```

Auth redirect middleware — write it yourself in `middleware/auth.ts`:

```ts
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useForgeAuth()
  if (!isAuthenticated.value) return navigateTo('/login')
})
```

---

## Forms

Automatically maps FastAPI 422 Pydantic errors to field-level `errors`.

```vue
<script setup>
const { form, errors, serverError, loading, submit } = useForgeForm({
  email: '',
  password: '',
})

const api = useForgeApi()

async function handleSubmit() {
  await submit(async (data) => {
    await api.post('/auth/login', data)
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.email" />
    <span v-if="errors.email">{{ errors.email }}</span>

    <input v-model="form.password" type="password" />
    <span v-if="errors.password">{{ errors.password }}</span>

    <p v-if="serverError">{{ serverError }}</p>
    <button :disabled="loading">Login</button>
  </form>
</template>
```

---

## API calls

```vue
<script setup>
const api = useForgeApi()

const posts = await api.get<Post[]>('/posts')
const post  = await api.post<Post>('/posts', { title: 'Hello' })
await api.patch(`/posts/${id}`, { title: 'Updated' })
await api.delete(`/posts/${id}`)
</script>
```

---

## Pagination

Connects to ForgeAPI paginated endpoints (`?page=1&per_page=20`). The max `per_page` is enforced on the backend (`config/pagination.py → max_limit`). When `perPage` is omitted, the backend default applies.

```vue
<script setup>
const { data, meta, loading, page, nextPage, prevPage } =
  useForgePagination<Post>('/posts')
</script>

<template>
  <div v-for="post in data" :key="post.id">{{ post.title }}</div>
  <button :disabled="page <= 1" @click="prevPage">Prev</button>
  <span>{{ page }} / {{ meta?.last_page }}</span>
  <button :disabled="!meta || page >= meta.last_page" @click="nextPage">Next</button>
</template>
```

---

## File uploads

Uses `XMLHttpRequest` for real-time upload progress.

```vue
<script setup>
const { progress, loading, error, result, upload } = useForgeUpload('/files/upload')

async function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const res = await upload(file)
  console.log('Uploaded to:', res.url)
}
</script>

<template>
  <input type="file" @change="handleFile" />
  <progress :value="progress" max="100" />
  <p v-if="error">{{ error }}</p>
  <img v-if="result?.url" :src="result.url" />
</template>
```

**Backend endpoint:**

```python
from fastapi import UploadFile
from forgeapi import Storage

@router.post("/files/upload")
async def upload_file(file: UploadFile, user: CurrentUser):
    data = await file.read()
    path = await Storage.put(f"uploads/{file.filename}", data)
    return {"url": Storage.url(path), "path": path}
```

---

## Local development

```bash
# build and install locally into another project
npm run build
npm install /path/to/nuxt-api

# watch mode + playground (recommended during development)
npm run dev

# publish to npm
npm run build
npm publish
```

---

## API reference

| Composable | Returns |
|---|---|
| `useForgeAuth()` | `user`, `isAuthenticated`, `login`, `logout`, `fetchUser`, `can`, `canAll`, `hasRole`, `hasAllRoles`, `permissions`, `roles` |
| `useForgePermissions()` | `permissions`, `roles`, `can`, `canAll`, `hasRole`, `hasAllRoles` |
| `useForgeApi()` | `get`, `post`, `patch`, `put`, `delete` |
| `useForgeForm(initial)` | `form`, `errors`, `serverError`, `loading`, `clearErrors`, `submit` |
| `useForgePagination(url, opts?)` | `data`, `meta`, `links`, `loading`, `error`, `page`, `perPage`, `fetch`, `nextPage`, `prevPage`, `goToPage` |
| `useForgeUpload(path)` | `progress`, `loading`, `error`, `result`, `upload`, `reset` |

| Util | Usage |
|---|---|
| `PermissionMiddleware(...perms)` | `definePageMeta({ middleware: [PermissionMiddleware('edit:posts')] })` |
| `RoleMiddleware(...roles)` | `definePageMeta({ middleware: [RoleMiddleware('admin')] })` |
