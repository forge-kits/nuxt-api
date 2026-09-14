<script setup lang="ts">
import { computed } from 'vue'
import { useForgePermissions } from '../composables/useForgePermissions'

const props = withDefaults(defineProps<{
  perm: string | string[]
  all?: boolean
  guard?: string
}>(), {
  all: false,
})

const { can, canAll } = useForgePermissions(props.guard)

const perms = computed(() => Array.isArray(props.perm) ? props.perm : [props.perm])
const allowed = computed(() => props.all ? canAll(...perms.value) : can(...perms.value))
</script>

<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback" />
</template>
