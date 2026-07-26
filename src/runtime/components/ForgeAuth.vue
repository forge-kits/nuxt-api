<script setup lang="ts">
import { useForgeAuth } from '../composables/useForgeAuth'
import type { AuthRole } from '../composables/useForgeAuth'

const props = withDefaults(defineProps<{
  role?: AuthRole
}>(), {
  role: 'client',
})

const { isAuthenticated } = useForgeAuth(props.role)
</script>

<template>
  <slot v-if="isAuthenticated" />
  <slot v-else name="fallback" />
</template>
