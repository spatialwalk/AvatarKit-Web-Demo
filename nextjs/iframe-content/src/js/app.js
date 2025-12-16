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
    
    // Check if panelsContainer exists
    if (!this.panelsContainer) {
      console.error('[App] panelsContainer not found. Make sure demo.html has the correct HTML structure.')
      return
    }
    
    this.globalSDKInitialized = false
    this.sdkInitializing = false
    this.currentDrivingServiceMode = null
    
    // Check if already initialized
    this.checkSDKStatus()
    
    // Create init SDK button
    this.createInitSDKButton()
    
    // Initialize with one panel
    this.addPanel()
    
    // Setup postMessage communication with parent window (Next.js app)
    this.setupPostMessage()
    
    // 不再需要内容区域的添加按钮，按钮已在header中创建
  }

  setupPostMessage() {
    // Listen for messages from parent window (Next.js app)
    window.addEventListener('message', (event) => {
      // In production, verify the origin for security
      // if (event.origin !== 'http://localhost:5177') return

      console.log('[iframe] Message from parent:', event.data)

      if (event.data.type === 'parent-ready') {
        // Notify parent that SDK iframe is ready
        window.parent.postMessage(
          { type: 'sdk-ready', message: 'SDK iframe is loaded and ready' },
          '*'
        )
      }

      // Handle other commands from parent
      if (event.data.type === 'command') {
        this.handleCommand(event.data)
      }
    })

    // Notify parent when iframe is loaded
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: 'iframe-loaded', message: 'Iframe content loaded' },
        '*'
      )
    }
  }

  handleCommand(command) {
    // Handle commands from parent Next.js app
    // Example: Load character, connect, etc.
    console.log('[iframe] Handling command:', command)
    
    // You can extend this to control SDK operations from Next.js
    // For example:
    // if (command.action === 'loadCharacter') {
    //   // Load character with command.characterId
    // }
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
      
      await AvatarSDK.initialize('demo', { 
        environment: selectedEnvironment,
        drivingServiceMode
      })
      
      // Set Session Token if provided
      const sessionTokenInput = document.getElementById('sdkSessionTokenInput')
      const sessionToken = sessionTokenInput ? sessionTokenInput.value.trim() : ''
      if (sessionToken) {
        AvatarSDK.setSessionToken(sessionToken)
        console.log('Session Token set')
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
      if (envLabel) {
        envLabel.style.display = 'none'
      }
      const sessionTokenInput = document.getElementById('sdkSessionTokenInput')
      const sessionTokenLabel = sessionTokenInput ? sessionTokenInput.previousElementSibling : null
      if (sessionTokenInput) {
        sessionTokenInput.style.display = 'none'
      }
      if (sessionTokenLabel && sessionTokenLabel.tagName === 'LABEL') {
        sessionTokenLabel.style.display = 'none'
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
      secondRow.appendChild(initButtonSDK)
      secondRow.appendChild(initButtonHost)
    }
    buttonContainer.appendChild(firstRow)
    buttonContainer.appendChild(secondRow)
    buttonContainer.appendChild(statusText)
    buttonContainer.appendChild(addPanelButton)
    header.appendChild(buttonContainer)
    
    // Store arrow reference for later updates
    this.initArrow = arrow
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

