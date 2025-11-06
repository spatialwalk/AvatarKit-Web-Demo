/**
 * 日志系统
 * 提供日志记录和状态更新功能
 */

/**
 * 创建日志条目
 * @param {HTMLElement} logPanel - 日志面板元素
 * @param {string} level - 日志级别 (info, success, warning, error)
 * @param {string} message - 日志消息
 * @param {*} data - 可选的数据对象
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
 * 日志工具类
 */
export class Logger {
  constructor(logPanel) {
    this.logPanel = logPanel
  }

  /**
   * 记录日志
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {*} data - 可选的数据
   */
  log(level, message, data = null) {
    createLogEntry(this.logPanel, level, message, data)
    
    // 同时输出到控制台
    const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'
    console[consoleMethod](`[${level.toUpperCase()}]`, message, data || '')
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

  error(message, data = null) {
    this.log('error', message, data)
  }

  /**
   * 清空日志
   */
  clear() {
    this.logPanel.innerHTML = ''
  }
}

/**
 * 状态更新工具
 * @param {HTMLElement} statusEl - 状态元素
 * @param {string} message - 状态消息
 * @param {string} type - 状态类型 (info, success, error, warning)
 */
export function updateStatus(statusEl, message, type = 'info') {
  statusEl.textContent = message
  statusEl.className = `status ${type}`
}

