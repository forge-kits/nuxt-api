export default defineNuxtConfig({
  modules: ['../src/module'],
  forgeApi: {
    url: 'http://localhost:8080',
    strategy: 'cookie',
  },
})
