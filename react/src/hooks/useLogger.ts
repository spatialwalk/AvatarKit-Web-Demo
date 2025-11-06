/**
 * 日志 Hook
 */

import { useState, useCallback } from 'react'
import type { LogEntry, StatusType } from '../types'

export function useLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [statusMessage, setStatusMessage] = useState('等待初始化...')
  const [statusClass, setStatusClass] = useState<StatusType>('info')

  const log = useCallback((level: LogEntry['level'], message: string, data?: any) => {
    const time = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, { level, message, time }])
    const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'
    console[consoleMethod](`[${level.toUpperCase()}]`, message, data || '')
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
    clearLogs,
  }
}

