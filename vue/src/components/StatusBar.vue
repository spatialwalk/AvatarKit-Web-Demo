<template>
  <div class="status" :class="type">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
import type { StatusType } from '../types'

defineProps<{
  message: string
  type: StatusType
}>()
</script>

<style scoped>
.status {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
}

.status.info {
  background: #dbeafe;
  color: #1e40af;
}

.status.success {
  background: #d1fae5;
  color: #065f46;
}

.status.error {
  background: #fee2e2;
  color: #991b1b;
}

.status.warning {
  background: #fef3c7;
  color: #92400e;
}
</style>

