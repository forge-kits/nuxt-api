<script setup lang="ts">
import { useForgeAuth } from '../composables/useForgeAuth'

const props = defineProps<{
  guard?: string
}>()

const { isAuthenticated } = useForgeAuth(props.guard)
</script>

<template>
  <slot v-if="isAuthenticated" />
  <slot v-else name="fallback" />
</template>
