/**
 * Status bar component
 */

import type { StatusType } from '../types'

interface StatusBarProps {
  message: string
  type: StatusType
}

export function StatusBar({ message, type }: StatusBarProps) {
  return <div className={`status ${type}`}>{message}</div>
}

