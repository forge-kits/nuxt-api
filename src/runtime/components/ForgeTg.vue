<script setup lang="ts">
import { useForgeAuth } from '../composables/useForgeAuth'

const { isWebApp } = useForgeAuth()
</script>

<template>
  <slot v-if="isWebApp" />
  <slot v-else name="fallback" />
</template>
