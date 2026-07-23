<template>
  <div style="padding: 2rem; font-family: monospace">
    <h2>@forge-kits/nuxt playground</h2>

    <section>
      <h3>useForgeAuth</h3>
      <p>authenticated: {{ isAuthenticated }}</p>
      <p>user: {{ user }}</p>
      <button @click="login({ email: 'test@example.com', password: 'password' })">Login</button>
      <button @click="logout">Logout</button>
    </section>

    <section>
      <h3>useForgePagination</h3>
      <p>loading: {{ loading }}</p>
      <p>page: {{ page }} / {{ meta?.last_page }}</p>
      <p>total: {{ meta?.total }}</p>
      <pre>{{ data }}</pre>
      <button @click="prevPage" :disabled="page <= 1">Prev</button>
      <button @click="nextPage" :disabled="!meta || page >= meta.last_page">Next</button>
    </section>
  </div>
</template>

<script setup lang="ts">
const { user, isAuthenticated, login, logout } = useForgeAuth()
const { data, meta, loading, page, nextPage, prevPage } = useForgePagination('/posts')
</script>
