<template>
  <div class="control-panel">
    <h2>📋 Logs</h2>
    <div class="log-panel">
      <div
        v-for="(log, index) in logs"
        :key="index"
        class="log-entry"
        :class="`log-level-${log?.level || 'info'}`"
      >
        <span class="log-time">[{{ log?.time || '' }}]</span>
        <strong>[{{ log?.level?.toUpperCase() || 'INFO' }}]</strong>
        {{ log?.message || '' }}
      </div>
    </div>
    <button class="btn btn-primary" @click="onClear">
      Clear Logs
    </button>
  </div>
</template>

<script setup lang="ts">
import type { LogEntry } from '../types'

defineProps<{
  logs: LogEntry[]
}>()

const emit = defineEmits<{
  clear: []
}>()

const onClear = () => emit('clear')
</script>

<style scoped>
.control-panel {
  background: #f9fafb;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.log-panel {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #d4d4d4;
  margin-bottom: 15px;
}

.log-entry {
  margin-bottom: 4px;
  padding: 4px 0;
  border-bottom: 1px solid #333;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #888;
  margin-right: 8px;
}

.log-level-info {
  color: #4fc3f7;
}

.log-level-success {
  color: #66bb6a;
}

.log-level-warning {
  color: #ffb74d;
}

.log-level-error {
  color: #ef5350;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}
</style>

