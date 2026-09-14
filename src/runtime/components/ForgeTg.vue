<script setup lang="ts">
import { useForgeTg } from '../composables/useForgeTg'

const { isWebApp } = useForgeTg()
</script>

<template>
  <slot v-if="isWebApp" />
  <slot v-else name="fallback" />
</template>
