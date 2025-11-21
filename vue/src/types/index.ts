/**
 * Type definitions
 */

export { Environment } from '@spatialwalk/avatarkit'

export interface LogEntry {
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  time: string
}

export type StatusType = 'info' | 'success' | 'error' | 'warning'
