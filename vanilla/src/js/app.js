/**
 * Main application logic
 * Supports multiple avatar panels
 */

import { AvatarPanel } from './avatarPanel.js'
import { AvatarSDK, Environment } from '@spatialwalk/avatarkit'

/**
 * Main application class
 */
export class App {
  constructor() {
    this.panels = []
    this.panelsContainer = document.getElementById('panelsContainer')
    this.globalSDKInitialized = false
    this.sdkInitializing = false
    this.currentDrivingServiceMode = null
    
    // Check if already initialized
    this.checkSDKStatus()
    
    // Create init SDK button
    this.createInitSDKButton()
    
    // Initialize with one panel
    this.addPanel()
    
    // 不再需要内容区域的添加按钮，按钮已在header中创建
  }

  checkSDKStatus() {
    // Check if SDK is already initialized (might be initialized elsewhere)
    if (AvatarSDK.isInitialized) {
      this.globalSDKInitialized = true
      this.updateSDKStatusUI()
      // 通知所有面板更新状态
      this.updateAllPanelsSDKStatus()
    }
  }

  async initializeGlobalSDK(mode) {
    const statusText = document.getElementById('sdkStatusText')
    if (AvatarSDK.isInitialized || this.sdkInitializing) {
      return
    }
    
    try {
      this.sdkInitializing = true
      if (statusText) {
        statusText.style.display = 'block'
        statusText.textContent = '⏳ 正在初始化 SDK...'
        statusText.style.color = '#ffeb3b'
      }
      
      const sdk = await import('@spatialwalk/avatarkit')
      const DrivingServiceMode = sdk.DrivingServiceMode
      const drivingServiceMode = mode === 'host' ? DrivingServiceMode.host : DrivingServiceMode.sdk
      
      // Get selected environment
      const envSelect = document.getElementById('sdkEnvironmentSelect')
      const envValue = envSelect ? envSelect.value : 'intl'
      const selectedEnvironment = envValue === 'cn' ? Environment.cn : Environment.intl
      
      await AvatarSDK.initialize('app_mj8526em_9fpt9s', { 
        environment: selectedEnvironment,
        drivingServiceMode
      })
      
      // Set Session Token if provided
      const sessionTokenInput = document.getElementById('sdkSessionTokenInput')
      const sessionToken = sessionTokenInput ? sessionTokenInput.value.trim() : ''
      if (sessionToken) {
        console.log('Session Token set:', sessionToken)
        AvatarSDK.setSessionToken(sessionToken)
      }
      
      this.globalSDKInitialized = true
      this.currentDrivingServiceMode = mode
      this.updateSDKStatusUI()
    } catch (error) {
      console.error('Failed to initialize global SDK:', error)
      if (statusText) {
        statusText.textContent = '❌ SDK 初始化失败'
        statusText.style.color = '#ef4444'
      }
    } finally {
      this.sdkInitializing = false
    }
  }

  updateSDKStatusUI() {
    const statusText = document.getElementById('sdkStatusText')
    const initButtons = document.querySelectorAll('.btn-init-sdk')
    const envSelect = document.getElementById('sdkEnvironmentSelect')
    const envLabel = envSelect ? envSelect.previousElementSibling : null
    
    if (this.globalSDKInitialized) {
      if (statusText) {
        const modeName = this.currentDrivingServiceMode === 'host' ? 'Host Mode' : 'SDK Mode'
        const sdk = AvatarSDK.configuration
        const envName = sdk?.environment === Environment.cn ? 'CN' : 'International'
        statusText.textContent = `✅ SDK 已初始化 (${modeName}, ${envName})`
        statusText.style.color = '#10b981'
        statusText.style.display = 'block'
      }
      initButtons.forEach(btn => {
        btn.style.display = 'none'
      })
      if (this.initArrow) {
        this.initArrow.style.display = 'none'
      }
      if (envSelect) {
        envSelect.style.display = 'none'
      }
      if (envLabel && envLabel.tagName === 'LABEL') {
        envLabel.style.display = 'none'
      }
      const sessionTokenInput = document.getElementById('sdkSessionTokenInput')
      const sessionTokenLabel = sessionTokenInput ? sessionTokenInput.previousElementSibling : null
      const autoTokenButton = sessionTokenInput ? sessionTokenInput.nextElementSibling : null
      if (sessionTokenInput) {
        sessionTokenInput.style.display = 'none'
      }
      if (sessionTokenLabel && sessionTokenLabel.tagName === 'LABEL') {
        sessionTokenLabel.style.display = 'none'
      }
      if (autoTokenButton && autoTokenButton.tagName === 'BUTTON') {
        autoTokenButton.style.display = 'none'
      }
      // 通知所有面板更新 SDK 状态
      this.updateAllPanelsSDKStatus()
      this.updateHeaderAddButton()
    }
  }

  updateAllPanelsSDKStatus() {
    // 通知所有已存在的面板更新 SDK 状态
    this.panels.forEach(({ panel }) => {
      if (panel && typeof panel.updateSDKStatus === 'function') {
        panel.updateSDKStatus(this.globalSDKInitialized)
      }
    })
  }

  async generateTemporaryToken(sessionTokenInput, envSelect) {
    if (!sessionTokenInput || !envSelect) return
    
    try {
      // Get environment
      const envValue = envSelect.value
      const isCN = envValue === 'cn'
      const consoleApiHost = isCN ? 'console.open.spatialwalk.top' : 'console.ap-northeast.spatialwalk.cloud'
      
      // Calculate expireAt (current timestamp + 1 hour)
      const expireAt = Math.floor(Date.now() / 1000) + 3600
      
      // API Key
      const apiKey = 'sk-Z_8IsL6HU-2s5A-_QjwSagW_iiQx0TwtEiY5dLrgP68='
      
      // Make API request
      const response = await fetch(`https://${consoleApiHost}/v1/console/session-tokens`, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expireAt: expireAt,
          modelVersion: ''
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to generate token: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      const token = data.token || data.sessionToken || data.data?.token || data.data?.sessionToken
      
      if (token) {
        sessionTokenInput.value = token
        sessionTokenInput.dispatchEvent(new Event('input', { bubbles: true }))
        
        // 如果 SDK 已初始化，立即设置 token
        if (AvatarSDK.isInitialized) {
          AvatarSDK.setSessionToken(token)
          console.log('Temporary token generated and set to SDK')
        } else {
          console.log('Temporary token generated (will be set when SDK initializes)')
        }
      } else {
        throw new Error('Token not found in response')
      }
    } catch (error) {
      console.error('Failed to generate temporary token:', error)
      alert(`生成临时 token 失败: ${error.message}`)
    }
  }

  createInitSDKButton() {
    const header = document.querySelector('.header')
    if (!header) return

    const buttonContainer = document.createElement('div')
    buttonContainer.style.cssText = 'margin-top: 12px; display: flex; flex-direction: column; align-items: center; gap: 12px;'
    
    // Create arrow pointing to init button
    const arrow = document.createElement('span')
    arrow.className = 'arrow-pointing-right'
    arrow.style.cssText = 'color: #ff0000; font-size: 48px; font-weight: bold; line-height: 1; display: ' + (this.globalSDKInitialized ? 'none' : 'inline-block') + ';'
    arrow.textContent = '→'
    
    // First row: Environment and Session Token
    const firstRow = document.createElement('div')
    firstRow.style.cssText = 'display: flex; align-items: center; gap: 12px; justify-content: center; flex-wrap: wrap;'
    
    // Create environment selector
    const envLabel = document.createElement('label')
    envLabel.textContent = 'Environment:'
    envLabel.style.cssText = 'color: white; font-size: 14px; margin-right: 4px;'
    
    const envSelect = document.createElement('select')
    envSelect.id = 'sdkEnvironmentSelect'
    envSelect.style.cssText = 'padding: 8px 12px; border-radius: 6px; border: none; font-size: 14px; background: white; color: #333; cursor: pointer;'
    envSelect.disabled = this.globalSDKInitialized
    envSelect.innerHTML = `
      <option value="intl" selected>International</option>
      <option value="cn">CN</option>
    `
    
    // Create Session Token input
    const sessionTokenLabel = document.createElement('label')
    sessionTokenLabel.textContent = 'Session Token:'
    sessionTokenLabel.style.cssText = 'color: white; font-size: 14px; margin-right: 4px;'
    
    const sessionTokenInput = document.createElement('input')
    sessionTokenInput.id = 'sdkSessionTokenInput'
    sessionTokenInput.type = 'text'
    sessionTokenInput.placeholder = 'Session Token (optional)'
    sessionTokenInput.style.cssText = 'padding: 8px 12px; border-radius: 6px; border: none; font-size: 14px; background: white; color: #333; min-width: 200px;'
    sessionTokenInput.disabled = this.globalSDKInitialized
    
    // Create Auto button for generating temporary token
    const autoTokenButton = document.createElement('button')
    autoTokenButton.textContent = 'Auto'
    autoTokenButton.title = '生成临时token，有效期1小时'
    autoTokenButton.style.cssText = 'padding: 8px 16px; border-radius: 6px; border: none; font-size: 14px; background: #10b981; color: white; cursor: pointer; font-weight: 500; transition: all 0.2s;'
    autoTokenButton.disabled = this.globalSDKInitialized
    if (this.globalSDKInitialized) {
      autoTokenButton.style.opacity = '0.5'
      autoTokenButton.style.cursor = 'not-allowed'
    }
    autoTokenButton.addEventListener('click', async () => {
      await this.generateTemporaryToken(sessionTokenInput, envSelect)
    })
    autoTokenButton.addEventListener('mouseenter', () => {
      autoTokenButton.style.background = '#059669'
    })
    autoTokenButton.addEventListener('mouseleave', () => {
      autoTokenButton.style.background = '#10b981'
    })
    
    // Second row: Init buttons
    const secondRow = document.createElement('div')
    secondRow.style.cssText = 'display: flex; align-items: center; gap: 12px; justify-content: center; flex-wrap: wrap;'
    
    const initButtonSDK = document.createElement('button')
    initButtonSDK.className = 'btn-init-sdk'
    initButtonSDK.textContent = '🔧 初始化 SDK (SDK Mode)'
    initButtonSDK.style.display = this.globalSDKInitialized ? 'none' : 'block'
    initButtonSDK.addEventListener('click', () => this.initializeGlobalSDK('sdk'))
    
    const initButtonHost = document.createElement('button')
    initButtonHost.className = 'btn-init-sdk'
    initButtonHost.textContent = '🔧 初始化 SDK (Host Mode)'
    initButtonHost.style.display = this.globalSDKInitialized ? 'none' : 'block'
    initButtonHost.addEventListener('click', () => this.initializeGlobalSDK('host'))
    
    const statusText = document.createElement('span')
    statusText.id = 'sdkStatusText'
    statusText.style.cssText = 'color: #10b981; margin: 0; display: none;'
    statusText.textContent = '✅ SDK 已初始化'
    
    const addPanelButton = document.createElement('button')
    addPanelButton.id = 'btnAddPanelHeader'
    addPanelButton.className = 'btn-add-panel-header'
    addPanelButton.textContent = '+ 添加角色面板'
    addPanelButton.style.display = this.panels.length < 4 ? 'block' : 'none'
    addPanelButton.addEventListener('click', () => {
      this.addPanel()
      this.updatePanelRemoveHandlers()
      this.updateHeaderAddButton()
    })
    
    // Build structure
    if (!this.globalSDKInitialized) {
      firstRow.appendChild(arrow)
      firstRow.appendChild(envLabel)
      firstRow.appendChild(envSelect)
      firstRow.appendChild(sessionTokenLabel)
      firstRow.appendChild(sessionTokenInput)
      firstRow.appendChild(autoTokenButton)
      secondRow.appendChild(initButtonSDK)
      secondRow.appendChild(initButtonHost)
    }
    buttonContainer.appendChild(firstRow)
    buttonContainer.appendChild(secondRow)
    buttonContainer.appendChild(statusText)
    buttonContainer.appendChild(addPanelButton)
    header.appendChild(buttonContainer)
    
    // Store references for later updates
    this.initArrow = arrow
    this.envSelect = envSelect
  }

  updateHeaderAddButton() {
    const addPanelButton = document.getElementById('btnAddPanelHeader')
    if (addPanelButton) {
      addPanelButton.style.display = this.panels.length < 4 ? 'block' : 'none'
    }
  }

  addPanel() {
    const panelId = String(this.panels.length + 1)
    const panel = new AvatarPanel(
      panelId,
      this.panelsContainer,
      this.globalSDKInitialized,
      this.panels.length > 0 ? () => this.removePanel(panelId) : undefined
    )
    this.panels.push({ id: panelId, panel })
    this.updateHeaderAddButton()
  }

  removePanel(panelId) {
    if (this.panels.length <= 1) {
      return // 至少保留一个面板
    }
    
    const panelIndex = this.panels.findIndex(p => p.id === panelId)
    if (panelIndex !== -1) {
      const { panel } = this.panels[panelIndex]
      panel.destroy()
      this.panels.splice(panelIndex, 1)
      
      // Update remove handlers
      this.updatePanelRemoveHandlers()
      this.updateHeaderAddButton()
    }
  }

  updatePanelRemoveHandlers() {
    this.panels.forEach((p, index) => {
      p.panel.onRemove = index > 0 ? () => this.removePanel(p.id) : undefined
      if (p.panel.elements.btnRemove) {
        p.panel.elements.btnRemove.style.display = index > 0 ? 'block' : 'none'
      }
    })
  }

}

// Initialize application after page load
document.addEventListener('DOMContentLoaded', () => {
  new App()
})


