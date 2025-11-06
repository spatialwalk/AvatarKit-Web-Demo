/**
 * 日志面板组件
 */

import type { LogEntry } from '../types'

interface LogPanelProps {
  logs: LogEntry[]
  onClear: () => void
}

export function LogPanel({ logs, onClear }: LogPanelProps) {
  return (
    <div className="control-panel">
      <h2>📋 日志</h2>
      <div className="log-panel">
        {logs.map((log, index) => (
          <div key={index} className={`log-entry log-level-${log.level}`}>
            <span className="log-time">[{log.time}]</span>
            <strong>[{log.level.toUpperCase()}]</strong>
            {log.message}
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={onClear}>
        清空日志
      </button>
    </div>
  )
}

