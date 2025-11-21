<template>
  <div style="display: flex; flex-direction: column; height: 100%;">
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
    <div class="log-drawer-footer">
      <button class="btn btn-primary" @click="onClear">
        Clear Logs
      </button>
    </div>
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
.log-panel {
  flex: 1;
  background: #1e1e1e;
  padding: 16px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #d4d4d4;
  min-height: 0;
}

.log-drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
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
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>

