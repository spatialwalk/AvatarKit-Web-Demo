/**
 * Logger Hook
 */

import { useState, useCallback } from 'react'
import type { LogEntry, StatusType } from '../types'

export function useLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [statusMessage, setStatusMessage] = useState('Waiting for initialization...')
  const [statusClass, setStatusClass] = useState<StatusType>('info')

  const log = useCallback((level: LogEntry['level'], message: string, data?: any) => {
    const time = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, { level, message, time }])
    // Only output errors to console (for debugging)
    // Info and success messages are shown in UI panel only
    if (level === 'error') {
      console.error(`[ERROR]`, message, data || '')
    }
  }, [])

  const updateStatus = useCallback((message: string, type: StatusType = 'info') => {
    setStatusMessage(message)
    setStatusClass(type)
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return {
    logs,
    statusMessage,
    statusClass,
    log,
    updateStatus,
    clear: clearLogs,
  }
}

