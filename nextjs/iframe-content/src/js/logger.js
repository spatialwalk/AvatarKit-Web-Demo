/**
 * Logging system
 * Provides logging and status update functionality
 */

/**
 * Create log entry
 * @param {HTMLElement} logPanel - Log panel element
 * @param {string} level - Log level (info, success, warning, error)
 * @param {string} message - Log message
 * @param {*} data - Optional data object
 */
export function createLogEntry(logPanel, level, message, data = null) {
  const entry = document.createElement('div')
  entry.className = `log-entry log-level-${level}`
  const time = new Date().toLocaleTimeString()
  let text = `<span class="log-time">[${time}]</span> <strong>[${level.toUpperCase()}]</strong> ${message}`
  
  if (data) {
    text += `<br>&nbsp;&nbsp;&nbsp;&nbsp;${JSON.stringify(data, null, 2)}`
  }
  
  entry.innerHTML = text
  logPanel.appendChild(entry)
  logPanel.scrollTop = logPanel.scrollHeight
}

/**
 * Logger utility class
 */
export class Logger {
  constructor(logPanel) {
    this.logPanel = logPanel
  }

  /**
   * Log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {*} data - Optional data
   */
  log(level, message, data = null) {
    if (this.logPanel) {
      createLogEntry(this.logPanel, level, message, data)
    }
    
    // Always output to console for debugging
    if (level === 'error') {
      console.error(`[ERROR]`, message, data || '')
    } else if (level === 'warning') {
      console.warn(`[WARNING]`, message, data || '')
    } else {
      console.log(`[${level.toUpperCase()}]`, message, data || '')
    }
  }

  info(message, data = null) {
    this.log('info', message, data)
  }

  success(message, data = null) {
    this.log('success', message, data)
  }

  warning(message, data = null) {
    this.log('warning', message, data)
  }

  // Alias for warning (common logger API)
  warn(message, data = null) {
    this.warning(message, data)
  }

  error(message, data = null) {
    this.log('error', message, data)
  }

  /**
   * Clear logs
   */
  clear() {
    if (this.logPanel) {
      this.logPanel.innerHTML = ''
    }
  }
}

/**
 * Status update utility
 * @param {HTMLElement} statusEl - Status element
 * @param {string} message - Status message
 * @param {string} type - Status type (info, success, error, warning)
 */
export function updateStatus(statusEl, message, type = 'info') {
  statusEl.textContent = message
  statusEl.className = `status ${type}`
}

