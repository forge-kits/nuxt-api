<script setup lang="ts">
import { computed } from 'vue'
import { useForgePermissions } from '../composables/useForgePermissions'

const props = withDefaults(defineProps<{
  role: string | string[]
  all?: boolean
}>(), {
  all: false,
})

const { hasRole, hasAllRoles } = useForgePermissions()

const roles = computed(() => Array.isArray(props.role) ? props.role : [props.role])
const allowed = computed(() => props.all ? hasAllRoles(...roles.value) : hasRole(...roles.value))
</script>

<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback" />
</template>
