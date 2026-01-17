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
    this.selectedSampleRate = 16000 // Default sample rate
    
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
    // Example: Load avatar, connect, etc.
    console.log('[iframe] Handling command:', command)
    
    // You can extend this to control SDK operations from Next.js
    // For example:
    // if (command.action === 'loadAvatar') {
    //   // Load avatar with command.avatarId
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
        statusText.textContent = '⏳ Initializing SDK...'
        statusText.style.color = '#ffeb3b'
      }
      
      const sdk = await import('@spatialwalk/avatarkit')
      const DrivingServiceMode = sdk.DrivingServiceMode
      const drivingServiceMode = mode === 'host' ? DrivingServiceMode.host : DrivingServiceMode.sdk
      
      // Get selected environment
      const envSelect = document.getElementById('sdkEnvironmentSelect')
      const envValue = envSelect ? envSelect.value : 'intl'
      const selectedEnvironment = envValue === 'cn' ? Environment.cn : Environment.intl
      
      // Get selected sample rate
      const sampleRateSelect = document.getElementById('sdkSampleRateSelect')
      const sampleRate = sampleRateSelect ? parseInt(sampleRateSelect.value, 10) : 16000
      this.selectedSampleRate = sampleRate
      
      // 如果还没有 token，自动生成一个默认 token
      const sessionTokenInput = document.getElementById('sdkSessionTokenInput')
      if (sessionTokenInput && !sessionTokenInput.value.trim()) {
        await this.generateDefaultToken(sessionTokenInput, envSelect)
      }
      
      // Get App ID
      const appIdInput = document.getElementById('sdkAppIdInput')
      const appId = appIdInput ? appIdInput.value : 'app_mj8526em_9fpt9s'
      
      await AvatarSDK.initialize(appId, { 
        environment: selectedEnvironment,
        drivingServiceMode,
        audioFormat: {
          channelCount: 1,
          sampleRate: sampleRate
        }
      })
      
      // Set Session Token if provided
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
        statusText.textContent = '❌ SDK initialization failed'
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
        statusText.textContent = `✅ SDK initialized (${modeName}, ${envName})`
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
      const sampleRateSelect = document.getElementById('sdkSampleRateSelect')
      const sampleRateLabel = sampleRateSelect ? sampleRateSelect.previousElementSibling : null
      if (sampleRateSelect) {
        sampleRateSelect.style.display = 'none'
      }
      if (sampleRateLabel && sampleRateLabel.tagName === 'LABEL') {
        sampleRateLabel.style.display = 'none'
      }
      // Session Token input should remain visible after SDK initialization
      // so users can inject token at any time
      const sessionTokenInput = document.getElementById('sdkSessionTokenInput')
      const injectTokenButton = sessionTokenInput ? sessionTokenInput.nextElementSibling : null
      if (sessionTokenInput) {
        // Keep it visible and editable
        sessionTokenInput.disabled = false
      }
      if (injectTokenButton && injectTokenButton.tagName === 'BUTTON') {
        // Keep Inject button visible and enabled
        injectTokenButton.disabled = false
        injectTokenButton.style.opacity = '1'
        injectTokenButton.style.cursor = 'pointer'
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
    
    // Create Sample Rate selector
    const sampleRateLabel = document.createElement('label')
    sampleRateLabel.textContent = 'Sample Rate:'
    sampleRateLabel.style.cssText = 'color: white; font-size: 14px; margin-right: 4px;'
    
    const sampleRateSelect = document.createElement('select')
    sampleRateSelect.id = 'sdkSampleRateSelect'
    sampleRateSelect.style.cssText = 'padding: 8px 12px; border-radius: 6px; border: none; font-size: 14px; background: white; color: #333; cursor: pointer;'
    sampleRateSelect.disabled = this.globalSDKInitialized
    sampleRateSelect.innerHTML = `
      <option value="8000">8000 Hz</option>
      <option value="16000" selected>16000 Hz</option>
      <option value="22050">22050 Hz</option>
      <option value="24000">24000 Hz</option>
      <option value="32000">32000 Hz</option>
      <option value="44100">44100 Hz</option>
      <option value="48000">48000 Hz</option>
    `
    
    // Create App ID input
    const appIdLabel = document.createElement('label')
    appIdLabel.textContent = 'App ID:'
    appIdLabel.style.cssText = 'color: white; font-size: 14px; margin-right: 4px;'
    
    const appIdInput = document.createElement('input')
    appIdInput.id = 'sdkAppIdInput'
    appIdInput.type = 'text'
    appIdInput.placeholder = 'App ID'
    appIdInput.value = 'app_mj8526em_9fpt9s'
    appIdInput.disabled = this.globalSDKInitialized
    appIdInput.style.cssText = 'padding: 8px 12px; border-radius: 6px; border: none; font-size: 14px; background: white; color: #333; min-width: 300px;'
    
    // Create Session Token input
    const sessionTokenLabel = document.createElement('label')
    sessionTokenLabel.textContent = 'Session Token:'
    sessionTokenLabel.style.cssText = 'color: white; font-size: 14px; margin-right: 4px;'
    
    const sessionTokenInput = document.createElement('input')
    sessionTokenInput.id = 'sdkSessionTokenInput'
    sessionTokenInput.type = 'text'
    sessionTokenInput.placeholder = 'Session Token (manual input or auto-generated)'
    sessionTokenInput.style.cssText = 'padding: 8px 12px; border-radius: 6px; border: 1px solid #ccc; font-size: 14px; background: white; color: #333; min-width: 300px; cursor: text;'
    
    // Create Inject button for injecting token
    const injectTokenButton = document.createElement('button')
    injectTokenButton.textContent = 'Inject'
    injectTokenButton.title = 'Inject token to SDK'
    injectTokenButton.style.cssText = 'padding: 8px 16px; border-radius: 6px; border: none; font-size: 14px; background: #10b981; color: white; cursor: pointer; font-weight: 500; transition: all 0.2s;'
    injectTokenButton.disabled = false
    injectTokenButton.addEventListener('click', () => {
      this.injectToken(sessionTokenInput)
    })
    injectTokenButton.addEventListener('mouseenter', () => {
      injectTokenButton.style.background = '#059669'
    })
    injectTokenButton.addEventListener('mouseleave', () => {
      injectTokenButton.style.background = '#10b981'
    })
    
    // Second row: Init buttons
    const secondRow = document.createElement('div')
    secondRow.style.cssText = 'display: flex; align-items: center; gap: 12px; justify-content: center; flex-wrap: wrap;'
    
    const initButtonSDK = document.createElement('button')
    initButtonSDK.className = 'btn-init-sdk'
    initButtonSDK.textContent = '🔧 Initialize SDK (SDK Mode)'
    initButtonSDK.style.display = this.globalSDKInitialized ? 'none' : 'block'
    initButtonSDK.addEventListener('click', () => this.initializeGlobalSDK('sdk'))
    
    const initButtonHost = document.createElement('button')
    initButtonHost.className = 'btn-init-sdk'
    initButtonHost.textContent = '🔧 Initialize SDK (Host Mode)'
    initButtonHost.style.display = this.globalSDKInitialized ? 'none' : 'block'
    initButtonHost.addEventListener('click', () => this.initializeGlobalSDK('host'))
    
    const statusText = document.createElement('span')
    statusText.id = 'sdkStatusText'
    statusText.style.cssText = 'color: #10b981; margin: 0; display: none;'
    statusText.textContent = '✅ SDK initialized'
    
    const addPanelButton = document.createElement('button')
    addPanelButton.id = 'btnAddPanelHeader'
    addPanelButton.className = 'btn-add-panel-header'
    addPanelButton.textContent = '+ Add Avatar Panel'
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
      firstRow.appendChild(sampleRateLabel)
      firstRow.appendChild(sampleRateSelect)
      firstRow.appendChild(appIdLabel)
      firstRow.appendChild(appIdInput)
      secondRow.appendChild(initButtonSDK)
      secondRow.appendChild(initButtonHost)
    }
    // Session Token input should always be visible (can be set at any time)
    firstRow.appendChild(sessionTokenLabel)
    firstRow.appendChild(sessionTokenInput)
    firstRow.appendChild(injectTokenButton)
    
    // Create Developer Platform link
    const devPlatformLink = document.createElement('a')
    devPlatformLink.href = 'https://dash.spatialreal.ai'
    devPlatformLink.target = '_blank'
    devPlatformLink.rel = 'noopener noreferrer'
    devPlatformLink.textContent = 'Developer Platform'
    devPlatformLink.style.cssText = 'color: white; font-size: 14px; text-decoration: underline; cursor: pointer; margin-left: 8px;'
    firstRow.appendChild(devPlatformLink)
    buttonContainer.appendChild(firstRow)
    buttonContainer.appendChild(secondRow)
    buttonContainer.appendChild(statusText)
    buttonContainer.appendChild(addPanelButton)
    header.appendChild(buttonContainer)
    
    // Store arrow reference for later updates
    this.initArrow = arrow
    this.envSelect = envSelect
    this.sampleRateSelect = sampleRateSelect
  }
  
  // Get current sample rate (for use by panels)
  getSampleRate() {
    return this.selectedSampleRate
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
      this.panels.length > 0 ? () => this.removePanel(panelId) : undefined,
      () => this.getSampleRate() // Pass function to get sample rate
    )
    this.panels.push({ id: panelId, panel })
    this.updateHeaderAddButton()
  }

  removePanel(panelId) {
    if (this.panels.length <= 1) {
      return // Keep at least one panel
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

  async generateDefaultToken(sessionTokenInput, envSelect) {
    if (!sessionTokenInput || !envSelect) return null
    
    try {
      // Get environment
      const envValue = envSelect.value
      const isCN = envValue === 'cn'
      const consoleApiHost = isCN ? 'console.open.spatialwalk.top' : 'console.ap-northeast.spatialwalk.cloud'
      
      // Calculate expireAt (current timestamp + 1 hour)
      const expireAt = Math.floor(Date.now() / 1000) + 3600
      
      // API Key (hardcoded for token generation)
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
        return token
      } else {
        throw new Error('Token not found in response')
      }
    } catch (error) {
      console.error('Failed to generate default token:', error)
      return null
    }
  }

  injectToken(sessionTokenInput) {
    if (!sessionTokenInput) return
    
    const token = sessionTokenInput.value.trim()
    if (!token) {
      alert('Please enter a session token')
      return
    }
    
    if (!AvatarSDK.isInitialized) {
      alert('SDK not initialized yet. Please initialize SDK first.')
      return
    }
    
    try {
      AvatarSDK.setSessionToken(token)
      console.log('Session token injected to SDK')
      alert('Session token injected successfully')
    } catch (error) {
      console.error('Failed to inject token:', error)
      alert(`Failed to inject token: ${error.message}`)
    }
  }

}

// Initialize application after page load
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App()
  
  // 页面加载时自动生成默认 token
  const sessionTokenInput = document.getElementById('sdkSessionTokenInput')
  const envSelect = document.getElementById('sdkEnvironmentSelect')
  if (sessionTokenInput && envSelect && !sessionTokenInput.value.trim()) {
    await app.generateDefaultToken(sessionTokenInput, envSelect)
  }
})

