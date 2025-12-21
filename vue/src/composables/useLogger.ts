/**
 * Logger Composable
 */

import { ref } from 'vue'
import type { LogEntry, StatusType } from '../types'

export function useLogger() {
  const logs = ref<LogEntry[]>([])
  const statusMessage = ref('Waiting for initialization...')
  const statusClass = ref<StatusType>('info')

  function log(level: LogEntry['level'], message: string) {
    const time = new Date().toLocaleTimeString()
    logs.value.push({ level, message, time })
  }

  function updateStatus(message: string, type: StatusType = 'info') {
    statusMessage.value = message
    statusClass.value = type
  }

  function clearLogs() {
    logs.value = []
  }

  return {
    logs,
    statusMessage,
    statusClass,
    log,
    updateStatus,
    clear: clearLogs,
  }
}

