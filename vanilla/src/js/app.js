/**
 * Main application logic
 * Supports multiple avatar panels
 */

import { AvatarPanel } from './avatarPanel.js'
import { AvatarKit, Environment } from '@spatialwalk/avatarkit'

/**
 * Main application class
 */
export class App {
  constructor() {
    this.panels = []
    this.panelsContainer = document.getElementById('panelsContainer')
    this.globalSDKInitialized = false
    this.sdkInitializing = false
    
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
    if (AvatarKit.isInitialized) {
      this.globalSDKInitialized = true
      this.updateSDKStatusUI()
      // 通知所有面板更新状态
      this.updateAllPanelsSDKStatus()
    }
  }

  async initializeGlobalSDK() {
    const statusText = document.getElementById('sdkStatusText')
    if (AvatarKit.isInitialized || this.sdkInitializing) {
      return
    }
    
    try {
      this.sdkInitializing = true
      if (statusText) {
        statusText.style.display = 'block'
        statusText.textContent = '⏳ 正在初始化 SDK...'
        statusText.style.color = '#ffeb3b'
      }
      
      await AvatarKit.initialize('demo', { environment: Environment.test })
      this.globalSDKInitialized = true
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
    const initButton = document.getElementById('btnInitSDK')
    
    if (this.globalSDKInitialized) {
      if (statusText) {
        statusText.textContent = '✅ SDK 已初始化'
        statusText.style.color = '#10b981'
        statusText.style.display = 'block'
      }
      if (initButton) {
        initButton.style.display = 'none'
      }
      if (this.initArrow) {
        this.initArrow.style.display = 'none'
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
    buttonContainer.style.cssText = 'margin-top: 12px; display: flex; align-items: center; gap: 12px; justify-content: center; flex-wrap: wrap;'
    
    // Create arrow pointing to init button
    const arrow = document.createElement('span')
    arrow.className = 'arrow-pointing-right'
    arrow.style.cssText = 'color: #ff0000; font-size: 48px; font-weight: bold; line-height: 1; display: ' + (this.globalSDKInitialized ? 'none' : 'inline-block') + ';'
    arrow.textContent = '→'
    
    const initButton = document.createElement('button')
    initButton.id = 'btnInitSDK'
    initButton.className = 'btn-init-sdk'
    initButton.textContent = '🔧 初始化 SDK'
    initButton.style.display = this.globalSDKInitialized ? 'none' : 'block'
    initButton.addEventListener('click', () => this.initializeGlobalSDK())
    
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
    
    buttonContainer.appendChild(arrow)
    buttonContainer.appendChild(initButton)
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

