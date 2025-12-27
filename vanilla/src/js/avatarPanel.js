/**
 * Avatar Panel
 * Manages a single avatar panel with its own SDK instance and controls
 */

import { Logger, updateStatus } from './logger.js'
import { AudioRecorder } from './audioRecorder.js'
import { AvatarSDKManager } from './avatarSDK.js'
import { resampleAudio, resampleAudioWithWebAudioAPI, convertToInt16PCM, convertToUint8Array } from '../utils/audioUtils.js'

export class AvatarPanel {
  constructor(panelId, container, globalSDKInitialized, onRemove, getSampleRateFn = null) {
    this.panelId = panelId
    this.container = container
    this.globalSDKInitialized = globalSDKInitialized
    this.onRemove = onRemove
    this.getSampleRateFn = getSampleRateFn // Function to get current sample rate from App
    this.currentPlaybackMode = 'sdk'
    this.shouldContinueSendingData = false
    this.conversationState = null

    // FPS monitoring (每个面板独立监控)
    this.fpsFrameCount = 0
    this.fpsLastTime = performance.now()
    this.fps = 0
    this.fpsAnimationFrameId = null

    // CPU和GPU使用率由App全局管理，这里只存储显示元素引用

    // Operation state flags
    this.isProcessing = {
      loadCharacter: false,
      connect: false,
      startRecord: false,
      stopRecord: false,
      interrupt: false,
      disconnect: false,
      unload: false,
      loadAudio: false,
    }

    // Initialize logger
    this.logger = new Logger(null) // Logger will use its own container

    // Initialize audio recorder
    this.audioRecorder = new AudioRecorder()

    // Initialize SDK manager
    this.sdkManager = new AvatarSDKManager(this.logger)

    // Check interval reference (for cleanup)
    this.checkInterval = null

    // Create panel HTML structure
    this.createPanelHTML()

    // Bind events
    this.bindEvents()
  }

  createPanelHTML() {
    const panelHTML = `
      <div class="avatar-panel" data-panel-id="${this.panelId}">
        <div class="avatar-panel-header">
          <h3>Avatar Panel ${this.panelId}</h3>
          ${this.onRemove ? '<button class="btn-remove" title="Remove Panel">×</button>' : ''}
        </div>
        
        <div class="avatar-panel-content">
          <div class="avatar-panel-controls">
            <div id="status-${this.panelId}" class="status info">Ready</div>
            
            <div class="control-panel">
              <h2>🎮 Control Panel</h2>
              <div class="form-group">
                <label>Environment</label>
                <div id="environment-${this.panelId}" style="padding: 8px 12px; background: #f0f0f0; border-radius: 6px; color: #666; font-size: 14px;">-</div>
              </div>
              <div class="form-group">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
                  <label style="margin-bottom: 0; display: inline-block; line-height: 22px">Character ID</label>
                  <button id="btnAddCharacterId-${this.panelId}" style="padding: 0; margin: 0; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; line-height: 22px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0" title="Add new Character ID">➕</button>
                  <a href="https://docs.spatialreal.ai/overview/test-avatars" target="_blank" rel="noopener noreferrer" style="padding: 0; margin: 0; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; line-height: 22px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; text-decoration: none;" title="Get test character IDs">🔗</a>
                </div>
                <select id="characterId-${this.panelId}">
                </select>
              </div>
              <button id="btnLoadCharacter-${this.panelId}" class="btn btn-primary" disabled>1. Load Character</button>
              <button id="btnConnect-${this.panelId}" class="btn btn-primary" disabled>2. Connect Service</button>
              <button id="btnLoadAudio-${this.panelId}" class="btn btn-primary" disabled style="display: none;">Load Audio</button>
              <button id="btnStartRecord-${this.panelId}" class="btn btn-primary" disabled>3. Start Recording</button>
              <button id="btnStopRecord-${this.panelId}" class="btn btn-danger" disabled>Stop Recording / Play Data</button>
              <button id="btnInterrupt-${this.panelId}" class="btn btn-warning" disabled>Interrupt</button>
              <button id="btnDisconnect-${this.panelId}" class="btn btn-danger" disabled>Disconnect</button>
              <button id="btnUnload-${this.panelId}" class="btn btn-danger" disabled>Unload Character</button>
              <button id="btnToggleLogs-${this.panelId}" class="btn btn-primary" style="margin-top: 12px;">📋 Show Logs</button>
            </div>
            
          </div>
          
          <!-- Log Drawer -->
          <div class="log-drawer" id="logDrawer-${this.panelId}">
            <div class="log-drawer-header">
              <h2>📋 Logs</h2>
              <button class="btn-close-drawer" id="btnCloseLogDrawer-${this.panelId}" title="Close Log Panel">×</button>
            </div>
            <div class="log-panel" id="logPanel-${this.panelId}"></div>
            <div class="log-drawer-footer">
              <button class="btn btn-primary btn-clear-log" id="btnClearLog-${this.panelId}">Clear Logs</button>
            </div>
          </div>
          <div class="avatar-panel-canvas">
            <div class="canvas-container" data-panel-id="${this.panelId}">
              <div class="performance-display" id="performanceDisplay-${this.panelId}">
                <div class="fps-display" id="fpsDisplay-${this.panelId}">FPS: --</div>
              </div>
              <div style="position: absolute; top: 12px; left: 12px; display: flex; gap: 8px; z-index: 1000;">
                <button id="btnSetBackground-${this.panelId}" title="Set Background" style="width: 32px; height: 32px; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 50%; cursor: pointer; display: none; font-size: 16px; transition: all 0.2s;" disabled>🖼️</button>
                <button id="btnRemoveBackground-${this.panelId}" title="Remove Background" style="width: 32px; height: 32px; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 50%; cursor: pointer; display: none; font-size: 16px; transition: all 0.2s;" disabled>🗑️</button>
            </div>
              <!-- Play/Pause button (bottom left) -->
              <button id="btnPlayPause-${this.panelId}" title="Play/Pause" style="position: absolute; bottom: 12px; left: 12px; width: 72px; height: 72px; background: transparent; color: white; border: none; cursor: pointer; display: none; font-size: 36px; z-index: 1000; transition: all 0.2s;" disabled>▶️</button>
              
              <!-- Volume control (above transform button, right side) -->
              <div style="position: absolute; right: 12px; bottom: 60px; display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 1000;">
                <span style="font-size: 18px; color: white; background: rgba(0, 0, 0, 0.7); padding: 4px; border-radius: 4px; display: none; width: 28px; height: 28px; text-align: center; line-height: 20px;" id="volumeIcon-${this.panelId}">🔊</span>
                <input type="range" id="volumeSlider-${this.panelId}" min="0" max="100" value="100" orient="vertical" style="width: 36px; height: 120px; cursor: pointer; writing-mode: bt-lr; -webkit-appearance: slider-vertical; display: none;" disabled>
                <span id="volumeValue-${this.panelId}" style="font-size: 12px; color: white; background: rgba(0, 0, 0, 0.7); padding: 2px 6px; border-radius: 4px; min-width: 36px; text-align: center; display: none;">100%</span>
              </div>
              
              <!-- Transform button (bottom right) -->
              <button id="btnTransform-${this.panelId}" class="transform-button" title="Transform Settings" style="position: absolute; bottom: 12px; right: 12px; width: 36px; height: 36px; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 50%; cursor: pointer; display: none; font-size: 18px; z-index: 1000; transition: all 0.2s;">⚙️</button>
            </div>
          </div>
        </div>
        
        <!-- Add Character ID Modal -->
        <div id="addCharacterIdModal-${this.panelId}" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; align-items: center; justify-content: center;">
          <div class="modal-content" style="background: white; padding: 24px; border-radius: 12px; min-width: 400px; max-width: 90%;">
            <h3 style="margin-top: 0; margin-bottom: 16px;">Add New Character ID</h3>
            <input type="text" id="newCharacterIdInput-${this.panelId}" placeholder="Enter Character ID" style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; margin-bottom: 16px; box-sizing: border-box;">
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button id="btnCancelAddId-${this.panelId}" style="padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
              <button id="btnConfirmAddId-${this.panelId}" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">Add</button>
            </div>
          </div>
        </div>
        
        <!-- Load Audio Modal -->
        <div id="loadAudioModal-${this.panelId}" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; align-items: center; justify-content: center;">
          <div class="modal-content" style="background: white; padding: 24px; border-radius: 12px; min-width: 400px; max-width: 90%;">
            <h3 style="margin-top: 0; margin-bottom: 16px;">Load Audio File</h3>
            <p style="margin-bottom: 16px; font-size: 14px; color: #666;">Select a PCM audio file to send to the avatar (PCM16 format recommended)</p>
            <input type="file" id="audioFileInput-${this.panelId}" accept=".pcm,audio/*" style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; margin-bottom: 16px; box-sizing: border-box;">
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button id="btnCancelLoadAudio-${this.panelId}" style="padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
              <button id="btnConfirmLoadAudio-${this.panelId}" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;" disabled>Load</button>
            </div>
          </div>
        </div>
        
        <!-- Transform Settings Modal -->
        <div id="transformModal-${this.panelId}" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; align-items: center; justify-content: center;">
          <div class="modal-content" style="background: white; padding: 24px; border-radius: 12px; min-width: 400px; max-width: 90%; max-height: 90vh; overflow-y: auto;">
            <h3 style="margin-top: 0; margin-bottom: 16px;">Transform Settings</h3>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">X Position (-1 to 1)</label>
              <input type="number" id="transformX-${this.panelId}" step="0.1" min="-1" max="1" value="0" style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">-1 = left edge, 0 = center, 1 = right edge</p>
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">Y Position (-1 to 1)</label>
              <input type="number" id="transformY-${this.panelId}" step="0.1" min="-1" max="1" value="0" style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">-1 = bottom edge, 0 = center, 1 = top edge</p>
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">Scale Factor</label>
              <input type="number" id="transformScale-${this.panelId}" step="0.1" min="0.1" max="5" value="1" style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">1.0 = original size, 2.0 = double size, 0.5 = half size</p>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button id="btnCancelTransform-${this.panelId}" style="padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
              <button id="btnConfirmTransform-${this.panelId}" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">Apply</button>
            </div>
          </div>
        </div>
      </div>
    `

    this.container.insertAdjacentHTML('beforeend', panelHTML)
    
    // Store element references
    this.elements = {
      status: document.getElementById(`status-${this.panelId}`),
      logPanel: document.getElementById(`logPanel-${this.panelId}`),
      btnLoadCharacter: document.getElementById(`btnLoadCharacter-${this.panelId}`),
      btnConnect: document.getElementById(`btnConnect-${this.panelId}`),
      btnLoadAudio: document.getElementById(`btnLoadAudio-${this.panelId}`),
      btnStartRecord: document.getElementById(`btnStartRecord-${this.panelId}`),
      btnStopRecord: document.getElementById(`btnStopRecord-${this.panelId}`),
      btnInterrupt: document.getElementById(`btnInterrupt-${this.panelId}`),
      btnDisconnect: document.getElementById(`btnDisconnect-${this.panelId}`),
      btnUnload: document.getElementById(`btnUnload-${this.panelId}`),
      volumeSlider: document.getElementById(`volumeSlider-${this.panelId}`),
      volumeValue: document.getElementById(`volumeValue-${this.panelId}`),
      volumeIcon: document.getElementById(`volumeIcon-${this.panelId}`),
      btnToggleLogs: document.getElementById(`btnToggleLogs-${this.panelId}`),
      btnClearLog: document.getElementById(`btnClearLog-${this.panelId}`),
      btnCloseLogDrawer: document.getElementById(`btnCloseLogDrawer-${this.panelId}`),
      logDrawer: document.getElementById(`logDrawer-${this.panelId}`),
      btnRemove: this.onRemove ? this.container.querySelector(`[data-panel-id="${this.panelId}"] .btn-remove`) : null,
      canvasContainer: document.querySelector(`.canvas-container[data-panel-id="${this.panelId}"]`),
      fpsDisplay: document.getElementById(`fpsDisplay-${this.panelId}`),
      environmentDisplay: document.getElementById(`environment-${this.panelId}`),
      characterId: document.getElementById(`characterId-${this.panelId}`),
      btnAddCharacterId: document.getElementById(`btnAddCharacterId-${this.panelId}`),
      addCharacterIdModal: document.getElementById(`addCharacterIdModal-${this.panelId}`),
      newCharacterIdInput: document.getElementById(`newCharacterIdInput-${this.panelId}`),
      btnCancelAddId: document.getElementById(`btnCancelAddId-${this.panelId}`),
      btnConfirmAddId: document.getElementById(`btnConfirmAddId-${this.panelId}`),
      loadAudioModal: document.getElementById(`loadAudioModal-${this.panelId}`),
      audioFileInput: document.getElementById(`audioFileInput-${this.panelId}`),
      btnCancelLoadAudio: document.getElementById(`btnCancelLoadAudio-${this.panelId}`),
      btnConfirmLoadAudio: document.getElementById(`btnConfirmLoadAudio-${this.panelId}`),
      btnSetBackground: document.getElementById(`btnSetBackground-${this.panelId}`),
      btnRemoveBackground: document.getElementById(`btnRemoveBackground-${this.panelId}`),
      btnPlayPause: document.getElementById(`btnPlayPause-${this.panelId}`),
      btnTransform: document.getElementById(`btnTransform-${this.panelId}`),
      transformModal: document.getElementById(`transformModal-${this.panelId}`),
      transformX: document.getElementById(`transformX-${this.panelId}`),
      transformY: document.getElementById(`transformY-${this.panelId}`),
      transformScale: document.getElementById(`transformScale-${this.panelId}`),
      btnCancelTransform: document.getElementById(`btnCancelTransform-${this.panelId}`),
      btnConfirmTransform: document.getElementById(`btnConfirmTransform-${this.panelId}`),
    }

    // Set logger logPanel
    this.logger.logPanel = this.elements.logPanel

    // Start FPS monitoring (每个面板独立监控)
    this.startFPSMonitoring()

    // CPU和GPU监控由App全局管理，这里不需要启动
    this.updateStatus = (message, type) => updateStatus(this.elements.status, message, type)

     // 初始化时检查全局 SDK 状态并更新按钮
     this.checkSDKStatus()
     
     // 更新环境显示
     this.updateEnvironmentDisplay()
  }

  // 检查全局 SDK 状态并更新按钮
  async checkSDKStatus() {
    // 如果已经初始化，立即启用按钮
    if (this.globalSDKInitialized) {
      this.elements.btnLoadCharacter.disabled = false
      return
    }

    // 定期检查全局 SDK 状态（因为初始化是异步的）
    this.checkInterval = setInterval(async () => {
      try {
        const { AvatarSDK } = await import('@spatialwalk/avatarkit')
        if (AvatarSDK.isInitialized) {
          this.globalSDKInitialized = true
          this.elements.btnLoadCharacter.disabled = false
          if (this.checkInterval) {
            clearInterval(this.checkInterval)
            this.checkInterval = null
          }
        }
      } catch (error) {
        // SDK 可能还没加载，继续检查
      }
    }, 100)

    // 超时后停止检查
    setTimeout(() => {
      if (this.checkInterval) {
        clearInterval(this.checkInterval)
        this.checkInterval = null
      }
    }, 10000)
  }

  // 更新 SDK 状态（由 App 类调用）
  updateSDKStatus(globalSDKInitialized) {
    this.globalSDKInitialized = globalSDKInitialized
    if (globalSDKInitialized) {
      // 停止检查定时器
      if (this.checkInterval) {
        clearInterval(this.checkInterval)
        this.checkInterval = null
      }
       // 启用加载按钮
       this.elements.btnLoadCharacter.disabled = false
       // 更新环境显示
       this.updateEnvironmentDisplay()
     }
   }
  
  // 更新环境显示
  async updateEnvironmentDisplay() {
    if (!this.elements.environmentDisplay) return
    
    try {
      const { AvatarSDK, Environment } = await import('@spatialwalk/avatarkit')
      if (AvatarSDK.isInitialized && AvatarSDK.configuration) {
        const env = AvatarSDK.configuration.environment
        const envName = env === Environment.cn ? 'CN' : 
                       env === Environment.intl ? 'International' : 
                       'Test'
        this.elements.environmentDisplay.textContent = envName
      } else {
        this.elements.environmentDisplay.textContent = '-'
      }
    } catch (error) {
      this.elements.environmentDisplay.textContent = '-'
    }
    
  }
  

  bindEvents() {
    if (this.elements.btnRemove) {
      this.elements.btnRemove.addEventListener('click', () => {
        if (this.onRemove) {
          this.onRemove()
        }
      })
    }

    this.elements.btnLoadCharacter.addEventListener('click', () => this.handleLoadCharacter())
    this.elements.btnConnect.addEventListener('click', () => this.handleConnect())
    if (this.elements.btnLoadAudio) {
      this.elements.btnLoadAudio.addEventListener('click', () => this.showLoadAudioModal())
    }
    this.elements.btnStartRecord.addEventListener('click', () => this.handleStartRecord())
    this.elements.btnStopRecord.addEventListener('click', () => this.handleStopRecord())
    this.elements.btnInterrupt.addEventListener('click', () => this.handleInterrupt())
    this.elements.btnDisconnect.addEventListener('click', () => this.handleDisconnect())
    this.elements.volumeSlider.addEventListener('input', (e) => this.handleVolumeChange(e))
    this.elements.btnUnload.addEventListener('click', () => this.handleUnloadCharacter())
    this.elements.btnToggleLogs.addEventListener('click', () => this.toggleLogDrawer())
    this.elements.btnCloseLogDrawer.addEventListener('click', () => this.closeLogDrawer())
    this.elements.btnClearLog.addEventListener('click', () => this.logger.clear())
    this.elements.btnSetBackground.addEventListener('click', () => this.handleSetBackground())
    this.elements.btnRemoveBackground.addEventListener('click', () => this.handleRemoveBackground())
    
    // Transform button events
    if (this.elements.btnTransform) {
      this.elements.btnTransform.addEventListener('click', () => this.showTransformModal())
    }
    if (this.elements.btnPlayPause) {
      this.elements.btnPlayPause.addEventListener('click', () => this.handlePlayPause())
    }
    if (this.elements.btnCancelTransform) {
      this.elements.btnCancelTransform.addEventListener('click', () => this.hideTransformModal())
    }
    if (this.elements.btnConfirmTransform) {
      this.elements.btnConfirmTransform.addEventListener('click', () => this.handleApplyTransform())
    }
    if (this.elements.transformModal) {
      this.elements.transformModal.addEventListener('click', (e) => {
        if (e.target === this.elements.transformModal) {
          this.hideTransformModal()
        }
      })
    }
    if (this.elements.transformX && this.elements.transformY && this.elements.transformScale) {
      // Allow Enter key to apply transform
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          this.hideTransformModal()
        } else if (e.key === 'Enter') {
          this.handleApplyTransform()
        }
      }
      this.elements.transformX.addEventListener('keydown', handleKeyDown)
      this.elements.transformY.addEventListener('keydown', handleKeyDown)
      this.elements.transformScale.addEventListener('keydown', handleKeyDown)
    }
    
    // Add Character ID modal events
    if (this.elements.btnAddCharacterId) {
      this.elements.btnAddCharacterId.addEventListener('click', () => this.showAddCharacterIdModal())
    }
    if (this.elements.btnCancelAddId) {
      this.elements.btnCancelAddId.addEventListener('click', () => this.hideAddCharacterIdModal())
    }
    if (this.elements.btnConfirmAddId) {
      this.elements.btnConfirmAddId.addEventListener('click', () => this.handleAddCharacterId())
    }
    if (this.elements.addCharacterIdModal) {
      this.elements.addCharacterIdModal.addEventListener('click', (e) => {
        if (e.target === this.elements.addCharacterIdModal) {
          this.hideAddCharacterIdModal()
        }
      })
    }
    if (this.elements.newCharacterIdInput) {
      this.elements.newCharacterIdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.hideAddCharacterIdModal()
        } else if (e.key === 'Enter') {
          this.handleAddCharacterId()
        }
      })
    }
    
    // Load Audio modal events
    if (this.elements.btnCancelLoadAudio) {
      this.elements.btnCancelLoadAudio.addEventListener('click', () => this.hideLoadAudioModal())
    }
    if (this.elements.btnConfirmLoadAudio) {
      this.elements.btnConfirmLoadAudio.addEventListener('click', () => this.handleLoadAudio())
    }
    if (this.elements.loadAudioModal) {
      this.elements.loadAudioModal.addEventListener('click', (e) => {
        if (e.target === this.elements.loadAudioModal) {
          this.hideLoadAudioModal()
        }
      })
    }
    if (this.elements.audioFileInput) {
      this.elements.audioFileInput.addEventListener('change', () => {
        const file = this.elements.audioFileInput.files[0]
        if (this.elements.btnConfirmLoadAudio) {
          this.elements.btnConfirmLoadAudio.disabled = !file
        }
      })
    }
  }

  toggleLogDrawer() {
    if (this.elements.logDrawer) {
      this.elements.logDrawer.classList.toggle('open')
      const isOpen = this.elements.logDrawer.classList.contains('open')
      this.elements.btnToggleLogs.textContent = isOpen ? '📋 Hide Logs' : '📋 Show Logs'
    }
  }

  closeLogDrawer() {
    if (this.elements.logDrawer) {
      this.elements.logDrawer.classList.remove('open')
      this.elements.btnToggleLogs.textContent = '📋 Show Logs'
    }
  }
  
  showAddCharacterIdModal() {
    if (this.elements.addCharacterIdModal && this.elements.newCharacterIdInput) {
      this.elements.addCharacterIdModal.style.display = 'flex'
      this.elements.newCharacterIdInput.value = ''
      setTimeout(() => {
        this.elements.newCharacterIdInput.focus()
      }, 100)
    }
  }
  
  hideAddCharacterIdModal() {
    if (this.elements.addCharacterIdModal && this.elements.newCharacterIdInput) {
      this.elements.addCharacterIdModal.style.display = 'none'
      this.elements.newCharacterIdInput.value = ''
    }
  }
  
  handleAddCharacterId() {
    if (!this.elements.newCharacterIdInput || !this.elements.characterId) {
      return
    }
    
    const newId = this.elements.newCharacterIdInput.value.trim()
    if (!newId) {
      return
    }
    
    // Check if ID already exists
    const select = this.elements.characterId
    const existingOptions = Array.from(select.options).map(opt => opt.value)
    
    if (existingOptions.includes(newId)) {
      this.logger.warn(`Character ID ${newId} already exists`)
      this.updateStatus(`Character ID already exists`, 'warning')
      return
    }
    
    // Add new option to select
    const option = document.createElement('option')
    option.value = newId
    option.textContent = newId
    select.appendChild(option)
    
    // Select the new ID
    select.value = newId
    select.dispatchEvent(new Event('change'))
    
    this.logger.info(`Added new Character ID: ${newId}`)
    this.updateStatus(`Added new Character ID: ${newId}`, 'success')
    
    // Close modal
    this.hideAddCharacterIdModal()
  }

  async handleLoadCharacter() {
    if (this.isProcessing.loadCharacter || this.sdkManager.avatarView) {
      return
    }

    // 检查全局 SDK 状态
    if (!this.globalSDKInitialized) {
      this.updateStatus('Please wait for SDK initialization', 'warning')
      this.logger.warn('Please wait for SDK initialization')
      return
    }

    // 确保 AvatarManager 已准备好（使用全局共享的实例）
    if (!this.sdkManager.avatarManager || !this.sdkManager.isInitialized) {
      // 确保 SDK 已加载
      if (!this.sdkManager.AvatarManager) {
        const loaded = await this.sdkManager.loadSDK()
        if (!loaded) {
          this.updateStatus('SDK not loaded', 'error')
          return
        }
      }
      this.sdkManager.avatarManager = this.sdkManager.AvatarManager.shared
      this.sdkManager.isInitialized = true
    }

    const characterId = this.elements.characterId.value.trim()
    if (!characterId) {
      this.logger.error('Please enter character ID')
      return
    }

    try {
      this.isProcessing.loadCharacter = true
      this.elements.btnLoadCharacter.disabled = true
      this.elements.btnUnload.disabled = true
      
      // Get current driving service mode from SDK configuration
      const sdk = await import('@spatialwalk/avatarkit')
      const currentMode = sdk.AvatarSDK.configuration?.drivingServiceMode || sdk.DrivingServiceMode.sdk
      const modeName = currentMode === sdk.DrivingServiceMode.sdk ? 'SDK mode (network)' : 'Host mode (external data)'
      
      this.updateStatus(`Loading character (${modeName})...`, 'info')
      
      // Set current playback mode for UI state management
      this.currentPlaybackMode = currentMode === sdk.DrivingServiceMode.sdk ? 'sdk' : 'host'

      // Verify canvas container exists
      if (!this.elements.canvasContainer) {
        this.updateStatus('Canvas container not found', 'error')
        this.logger.error('Canvas container not found')
        return
      }
      
      if (!(this.elements.canvasContainer instanceof HTMLElement)) {
        this.updateStatus(`Invalid canvas container: expected HTMLElement, got ${typeof this.elements.canvasContainer}`, 'error')
        this.logger.error(`Invalid canvas container: expected HTMLElement, got ${typeof this.elements.canvasContainer}`)
        return
      }

      await this.sdkManager.loadCharacter(
        characterId,
        this.elements.canvasContainer,
        (state) => this.onConnectionState(state),
        (state) => this.onConversationState(state),
        (error) => this.onError(error)
      )

      this.updateStatus('Character loaded successfully', 'success')
      
      if (this.currentPlaybackMode === 'sdk') {
        this.elements.btnConnect.disabled = false
        if (this.elements.btnLoadAudio) {
          this.elements.btnLoadAudio.style.display = 'inline-block'
          this.elements.btnLoadAudio.disabled = true
        }
        this.elements.btnStartRecord.disabled = true
        this.elements.btnStopRecord.disabled = true
        this.elements.btnInterrupt.disabled = true
        this.elements.btnDisconnect.disabled = true
      } else {
        if (this.elements.btnLoadAudio) {
          this.elements.btnLoadAudio.style.display = 'none'
        }
        this.elements.btnConnect.disabled = true
        this.elements.btnStartRecord.disabled = true
        this.elements.btnStopRecord.disabled = false
        this.elements.btnInterrupt.disabled = true
        this.elements.btnDisconnect.disabled = true
      }
      this.elements.btnUnload.disabled = false
      
      // Show and enable volume slider after character is loaded
      if (this.elements.volumeSlider) {
        this.elements.volumeSlider.style.display = 'block'
        this.elements.volumeSlider.disabled = false
        // Set initial volume from SDK
        try {
          const currentVolume = this.sdkManager.getVolume()
          const volumePercent = Math.round(currentVolume * 100)
          this.elements.volumeSlider.value = volumePercent
          this.elements.volumeValue.textContent = `${volumePercent}%`
        } catch (error) {
          // If getVolume fails, keep default 100%
          this.elements.volumeSlider.value = 100
          this.elements.volumeValue.textContent = '100%'
        }
      }
      if (this.elements.volumeIcon) {
        this.elements.volumeIcon.style.display = 'inline-block'
      }
      if (this.elements.volumeValue) {
        this.elements.volumeValue.style.display = 'block'
      }
      
      // Show background control buttons after character is loaded
      if (this.elements.btnSetBackground) {
        this.elements.btnSetBackground.style.display = 'inline-flex'
        this.elements.btnSetBackground.style.alignItems = 'center'
        this.elements.btnSetBackground.style.justifyContent = 'center'
        this.elements.btnSetBackground.disabled = false
      }
      if (this.elements.btnRemoveBackground) {
        this.elements.btnRemoveBackground.style.display = 'inline-flex'
        this.elements.btnRemoveBackground.style.alignItems = 'center'
        this.elements.btnRemoveBackground.style.justifyContent = 'center'
        this.elements.btnRemoveBackground.disabled = false
      }
      
      // Play/pause button will be shown/hidden based on conversation state in onConversationState
      // Don't show it here, let onConversationState handle it
      
      // Show transform button after character is loaded
      if (this.elements.btnTransform) {
        this.elements.btnTransform.style.display = 'flex'
        // Ensure flex layout for centering icon
        this.elements.btnTransform.style.alignItems = 'center'
        this.elements.btnTransform.style.justifyContent = 'center'
        this.elements.btnTransform.style.lineHeight = '1'
      }
    } catch (error) {
      this.logger.error('Character load failed', error)
      this.updateStatus(`Load failed: ${error.message}`, 'error')
      this.elements.btnLoadCharacter.disabled = false
    } finally {
      this.isProcessing.loadCharacter = false
    }
  }

  async handleConnect() {
    if (this.isProcessing.connect) {
      return
    }

    if (this.currentPlaybackMode !== 'sdk') {
      this.logger.warn('Connect is only available in SDK mode (network mode)')
      return
    }

    if (!this.sdkManager.avatarView) {
      this.logger.error('Please load character first')
      return
    }

    if (this.sdkManager.isConnected) {
      this.logger.warn('Already connected')
      return
    }
    
    try {
      this.isProcessing.connect = true
      this.elements.btnConnect.disabled = true
      this.updateStatus('Connecting...', 'info')
      await this.sdkManager.connect()
      this.updateStatus('Connected', 'success')
      if (this.elements.btnLoadAudio && this.currentPlaybackMode === 'sdk') {
        this.elements.btnLoadAudio.disabled = false
      }
    } catch (error) {
      this.logger.error('Connection failed', error)
      this.updateStatus(`Connection failed: ${error.message}`, 'error')
      this.elements.btnConnect.disabled = false
    } finally {
      this.isProcessing.connect = false
    }
  }

  async handleStartRecord() {
    if (this.isProcessing.startRecord || this.audioRecorder.isRecording) {
      return
    }

    if (this.currentPlaybackMode === 'sdk' && !this.sdkManager.isConnected) {
      this.logger.error('Please connect to service first')
      return
    }

    if (!this.sdkManager.avatarView) {
      this.logger.error('Please load character first')
      return
    }

    try {
      this.isProcessing.startRecord = true
      this.elements.btnStartRecord.disabled = true
      this.updateStatus('Recording...', 'success')
      
      // Get sample rate from App (default to 16000 if not available)
      const sampleRate = this.getSampleRateFn ? this.getSampleRateFn() : 16000
      await this.audioRecorder.start(sampleRate)
      this.logger.success(`Recording started (${sampleRate} Hz)`)

      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = false
    } catch (error) {
      this.logger.error('Recording start failed', error)
      this.updateStatus(`Recording failed: ${error.message}`, 'error')
      this.elements.btnStartRecord.disabled = false
      this.elements.btnStopRecord.disabled = true
    } finally {
      this.isProcessing.startRecord = false
    }
  }

  showLoadAudioModal() {
    if (this.currentPlaybackMode !== 'sdk') {
      this.logger.warn('Load audio is only available in SDK mode')
      return
    }
    
    if (!this.sdkManager.isConnected) {
      this.logger.warn('Please connect to service first')
      return
    }
    
    if (!this.sdkManager.avatarView) {
      this.logger.warn('Please load character first')
      return
    }
    
    if (this.elements.loadAudioModal && this.elements.audioFileInput) {
      this.elements.loadAudioModal.style.display = 'flex'
      this.elements.audioFileInput.value = ''
      if (this.elements.btnConfirmLoadAudio) {
        this.elements.btnConfirmLoadAudio.disabled = true
      }
    }
  }

  hideLoadAudioModal() {
    if (this.elements.loadAudioModal && this.elements.audioFileInput) {
      this.elements.loadAudioModal.style.display = 'none'
      this.elements.audioFileInput.value = ''
      if (this.elements.btnConfirmLoadAudio) {
        this.elements.btnConfirmLoadAudio.disabled = true
      }
    }
  }

  async handleLoadAudio() {
    if (!this.elements.audioFileInput || !this.elements.audioFileInput.files[0]) {
      this.logger.warn('Please select an audio file')
      return
    }
    
    if (this.currentPlaybackMode !== 'sdk') {
      this.logger.warn('Load audio is only available in SDK mode')
      return
    }
    
    if (!this.sdkManager.isConnected) {
      this.logger.warn('Please connect to service first')
      return
    }
    
    if (!this.sdkManager.avatarView) {
      this.logger.warn('Please load character first')
      return
    }
    
    const file = this.elements.audioFileInput.files[0]
    
    try {
      this.isProcessing.loadAudio = true
      if (this.elements.btnConfirmLoadAudio) {
        this.elements.btnConfirmLoadAudio.disabled = true
      }
      
      this.logger.info(`Loading audio file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
      this.updateStatus('Loading audio file...', 'info')
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      
      // Get sample rate from App (default to 16000 if not available)
      const sampleRate = this.getSampleRateFn ? this.getSampleRateFn() : 16000
      const duration = (arrayBuffer.byteLength / 2 / sampleRate).toFixed(2)
      
      this.logger.info(`Audio file loaded: ${arrayBuffer.byteLength} bytes (${duration}s, ${sampleRate / 1000}kHz PCM16)`)
      
      // Send audio data to SDK
      if (this.sdkManager.avatarView?.controller) {
        this.sdkManager.sendAudio(arrayBuffer, true)
        this.logger.success('Audio file sent to avatar')
        this.updateStatus('Audio file sent', 'success')
        this.hideLoadAudioModal()
      } else {
        throw new Error('Avatar controller not available')
      }
    } catch (error) {
      this.logger.error('Failed to load audio file', error)
      this.updateStatus(`Failed to load audio: ${error.message}`, 'error')
    } finally {
      this.isProcessing.loadAudio = false
      if (this.elements.btnConfirmLoadAudio) {
        this.elements.btnConfirmLoadAudio.disabled = false
      }
    }
  }

  async handleStopRecord() {
    if (this.isProcessing.stopRecord) {
      return
    }

    if (this.currentPlaybackMode === 'sdk') {
      if (!this.audioRecorder.isRecording) {
        this.logger.warn('Not recording')
        return
      }
    } else {
      if (!this.sdkManager.avatarView) {
        this.logger.error('Please load character first')
        return
      }
    }

    try {
      this.isProcessing.stopRecord = true
      this.elements.btnStopRecord.disabled = true

      if (this.currentPlaybackMode === 'sdk') {
        const audioBuffer = await this.audioRecorder.stop()

        if (audioBuffer) {
          const duration = this.audioRecorder.getDuration()
          const sampleRate = this.getSampleRateFn ? this.getSampleRateFn() : 16000
          this.logger.info(`Recording completed, total length: ${audioBuffer.byteLength} bytes (${duration}s, ${sampleRate / 1000}kHz PCM16)`)
          this.sdkManager.sendAudio(audioBuffer, true)
          this.logger.success('Complete audio data sent')
        } else {
          this.logger.warn('Recording data is empty')
        }

        this.updateStatus('Recording stopped', 'info')
        this.logger.success('Recording stopped')

        this.elements.btnStartRecord.disabled = false
        this.elements.btnStopRecord.disabled = true
      } else {
        this.updateStatus('Loading and playing external data...', 'info')
        await this.handleExternalDataMode()
        if (this.shouldContinueSendingData) {
        this.updateStatus('External data playback started', 'success')
        this.elements.btnStopRecord.disabled = true
        this.elements.btnInterrupt.disabled = false
        } else {
        this.elements.btnStopRecord.disabled = false
        this.elements.btnInterrupt.disabled = true
        this.updateStatus('Playback interrupted', 'info')
        }
      }
    } catch (error) {
      this.logger.error('Operation failed', error)
      this.updateStatus(`Error: ${error.message}`, 'error')
      if (this.currentPlaybackMode === 'sdk') {
        this.elements.btnStartRecord.disabled = false
        this.elements.btnStopRecord.disabled = true
      } else {
        this.elements.btnStopRecord.disabled = false
      }
    } finally {
      this.isProcessing.stopRecord = false
    }
  }

  async handleExternalDataMode() {
    // Host mode: fetch audio and animation data from API
    try {
      this.logger.info('Fetching data from API...')
      this.updateStatus('Fetching data from API...', 'info')
      
      const response = await fetch('https://server-sdk-mock-demo.spatialwalk.cn/media')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // API 返回的数据结构: { audio: string, animations: string[] }
      // audio 和 animations 都是 base64 编码的字符串
      if (!data.audio || !data.animations) {
        throw new Error('Invalid data format: missing audio or animations')
      }
      
      // 将 base64 字符串解码为 Uint8Array
      const rawAudioData = this.base64ToUint8Array(data.audio)
      const animationsData = data.animations.map(anim => this.base64ToUint8Array(anim))
      
      // 获取目标采样率（初始化时选择的采样率）
      const targetSampleRate = this.getSampleRateFn ? this.getSampleRateFn() : 16000
      const sourceSampleRate = 24000 // API 返回的音频数据是 24kHz
      
      // 如果目标采样率与源采样率不同，需要进行重采样
      let audioData = rawAudioData
      if (targetSampleRate !== sourceSampleRate) {
        this.logger.info(`Resampling audio from ${sourceSampleRate}Hz to ${targetSampleRate}Hz...`)
        this.updateStatus(`Resampling audio (${sourceSampleRate}Hz → ${targetSampleRate}Hz)...`, 'info')
        
        // 1. 将 PCM16 Uint8Array 转换为 Float32Array
        const int16Array = new Int16Array(rawAudioData.buffer, rawAudioData.byteOffset, rawAudioData.length / 2)
        const float32Array = new Float32Array(int16Array.length)
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0
        }
        
        // 2. 使用 Web Audio API 进行高质量重采样
        const resampledFloat32 = await resampleAudioWithWebAudioAPI(float32Array, sourceSampleRate, targetSampleRate)
        
        // 3. 转换回 PCM16 格式
        const resampledInt16 = convertToInt16PCM(resampledFloat32)
        audioData = convertToUint8Array(resampledInt16)
        
        this.logger.success(`Audio resampled from ${sourceSampleRate}Hz to ${targetSampleRate}Hz`)
      }
      
      this.logger.success('Data fetched and decoded successfully')
      this.updateStatus('Playing data...', 'info')
      
      // 使用 SDK 播放数据
      // 1. 发送音频数据（最后一个 chunk 标记为结束）
      const conversationId = this.sdkManager.yieldAudioData(audioData, true)
      
      if (!conversationId) {
        throw new Error('Failed to get conversation ID from audio data')
      }
      
      // 2. 发送动画数据
      this.sdkManager.yieldFramesData(animationsData, conversationId)
      
      this.logger.success('Data playback started')
      this.updateStatus('Data playback started', 'success')
      this.shouldContinueSendingData = true
      
    } catch (error) {
      this.logger.error('Failed to fetch or play data from API', error)
      this.updateStatus(`Failed: ${error.message}`, 'error')
      throw error
    }
  }
  
  /**
   * 将 base64 字符串转换为 Uint8Array
   * @param {string} base64 - Base64 编码的字符串
   * @returns {Uint8Array}
   */
  base64ToUint8Array(base64) {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }
  
  showTransformModal() {
    if (this.elements.transformModal && this.elements.transformX && this.elements.transformY && this.elements.transformScale) {
      this.elements.transformModal.style.display = 'flex'
      
      // Try to get current transform values, fallback to defaults
      if (this.sdkManager.avatarView && this.sdkManager.avatarView.transform) {
        try {
          const currentTransform = this.sdkManager.avatarView.transform
          this.elements.transformX.value = String(currentTransform.x || 0)
          this.elements.transformY.value = String(currentTransform.y || 0)
          this.elements.transformScale.value = String(currentTransform.scale || 1)
        } catch (error) {
          // Fallback to defaults if transform is not available
          this.elements.transformX.value = '0'
          this.elements.transformY.value = '0'
          this.elements.transformScale.value = '1'
        }
      } else {
        // Default values
        this.elements.transformX.value = '0'
        this.elements.transformY.value = '0'
        this.elements.transformScale.value = '1'
      }
      
      setTimeout(() => {
        this.elements.transformX.focus()
      }, 100)
    }
  }
  
  hideTransformModal() {
    if (this.elements.transformModal) {
      this.elements.transformModal.style.display = 'none'
    }
  }
  
  handleApplyTransform() {
    if (!this.sdkManager.avatarView) {
      this.logger.warn('No character loaded')
      this.updateStatus('Please load character first', 'warning')
      return
    }
    
    try {
      const x = parseFloat(this.elements.transformX.value)
      const y = parseFloat(this.elements.transformY.value)
      const scale = parseFloat(this.elements.transformScale.value)
      
      // Validate values
      if (isNaN(x) || x < -1 || x > 1) {
        throw new Error('X position must be between -1 and 1')
      }
      if (isNaN(y) || y < -1 || y > 1) {
        throw new Error('Y position must be between -1 and 1')
      }
      if (isNaN(scale) || scale < 0.1 || scale > 5) {
        throw new Error('Scale must be between 0.1 and 5')
      }
      
      // Use transform property (getter/setter) instead of setTransform method
      if (!this.sdkManager.avatarView.transform) {
        throw new Error('transform property is not available in this SDK version')
      }
      this.sdkManager.avatarView.transform = { x, y, scale }
      this.logger.success(`Transform applied: x=${x}, y=${y}, scale=${scale}`)
      this.updateStatus(`Transform applied: x=${x}, y=${y}, scale=${scale}`, 'success')
      this.hideTransformModal()
    } catch (error) {
      this.logger.error('Failed to apply transform', error)
      this.updateStatus(`Transform failed: ${error.message}`, 'error')
    }
  }

  handleVolumeChange(event) {
    const volume = parseInt(event.target.value) / 100 // Convert 0-100 to 0.0-1.0
    try {
      if (this.sdkManager.avatarView?.controller) {
        this.sdkManager.setVolume(volume)
        this.elements.volumeValue.textContent = `${event.target.value}%`
      }
    } catch (error) {
      this.logger.error('Volume change failed', error)
      this.updateStatus(`Volume change failed: ${error.message}`, 'error')
    }
  }

  async handlePlayPause() {
    if (!this.sdkManager.avatarView) {
      this.logger.warn('No character loaded')
      return
    }

    try {
      if (this.conversationState === 'playing') {
        // Pause if currently playing
        this.sdkManager.pause()
        this.logger.info('Playback paused')
        this.updateStatus('Playback paused', 'info')
      } else if (this.conversationState === 'pausing' || this.conversationState === 'idle') {
        // Resume if paused or idle
        await this.sdkManager.resume()
        this.logger.info('Playback resumed')
        this.updateStatus('Playback resumed', 'info')
      }
    } catch (error) {
      this.logger.error('Play/Pause failed', error)
      this.updateStatus(`Play/Pause failed: ${error.message}`, 'error')
    }
  }

  handleInterrupt() {
    if (this.isProcessing.interrupt) {
      return
    }

    if (!this.sdkManager.avatarView) {
      this.logger.warn('No character loaded')
      return
    }

    try {
      this.isProcessing.interrupt = true
      this.elements.btnInterrupt.disabled = true
      
      if (this.currentPlaybackMode === 'host') {
        this.shouldContinueSendingData = false
      }
      
      this.sdkManager.interrupt()
      this.updateStatus('Current conversation interrupted', 'info')
      
      if (this.currentPlaybackMode === 'host') {
        this.elements.btnStopRecord.disabled = false
        this.elements.btnInterrupt.disabled = true
      } else if (this.currentPlaybackMode === 'sdk') {
        if (this.sdkManager.isConnected) {
          this.elements.btnStartRecord.disabled = false
          this.elements.btnStopRecord.disabled = true
        }
        this.elements.btnInterrupt.disabled = false
      }
      
      // Reset pause/resume button states
    } catch (error) {
      this.logger.error('Interrupt failed', error)
      this.updateStatus(`Interrupt failed: ${error.message}`, 'error')
      this.elements.btnInterrupt.disabled = false
    } finally {
      this.isProcessing.interrupt = false
    }
  }

  async handleDisconnect() {
    if (this.isProcessing.disconnect) {
      return
    }

    if (this.currentPlaybackMode !== 'sdk') {
      this.logger.warn('Disconnect is only available in SDK mode (network mode)')
      return
    }

    if (!this.sdkManager.isConnected) {
      this.logger.warn('Not connected')
      return
    }

    try {
      this.isProcessing.disconnect = true
      this.elements.btnDisconnect.disabled = true

      if (this.audioRecorder.isRecording) {
        await this.handleStopRecord()
      }

      await this.sdkManager.disconnect()
      this.updateStatus('Disconnected', 'info')

      this.elements.btnConnect.disabled = false
      if (this.elements.btnLoadAudio && this.currentPlaybackMode === 'sdk') {
        this.elements.btnLoadAudio.disabled = true
      }
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = false
    } catch (error) {
      this.logger.error('Disconnect failed', error)
      this.elements.btnDisconnect.disabled = false
    } finally {
      this.isProcessing.disconnect = false
    }
  }

  handleUnloadCharacter() {
    if (this.isProcessing.unload) {
      return
    }

    if (!this.sdkManager.avatarView) {
      this.logger.warn('No character loaded')
      return
    }

    try {
      this.isProcessing.unload = true
      this.elements.btnUnload.disabled = true

      // Stop external data playback if active
      if (this.currentPlaybackMode === 'host') {
        this.shouldContinueSendingData = false
      }

      if (this.audioRecorder.isRecording) {
        this.audioRecorder.stop().catch(() => {
          // Ignore errors
        })
      }

      if (this.sdkManager.isConnected) {
        this.sdkManager.disconnect().catch(() => {
          // Ignore errors
        })
      }

      this.sdkManager.unloadCharacter()
      this.updateStatus('Character unloaded', 'info')
      
      // Reset state
      this.currentPlaybackMode = 'sdk'
      this.conversationState = null
      this.shouldContinueSendingData = false
      
      this.elements.btnLoadCharacter.disabled = false
      this.elements.btnConnect.disabled = true
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = true
      if (this.elements.volumeSlider) {
        this.elements.volumeSlider.style.display = 'none'
        this.elements.volumeSlider.disabled = true
        this.elements.volumeValue.textContent = '100%'
      }
      if (this.elements.volumeIcon) {
        this.elements.volumeIcon.style.display = 'none'
      }
      if (this.elements.volumeValue) {
        this.elements.volumeValue.style.display = 'none'
      }
      if (this.elements.btnSetBackground) {
        this.elements.btnSetBackground.style.display = 'none'
        this.elements.btnSetBackground.disabled = true
      }
      if (this.elements.btnRemoveBackground) {
        this.elements.btnRemoveBackground.style.display = 'none'
        this.elements.btnRemoveBackground.disabled = true
      }
      
      // Hide transform button after character is unloaded
      if (this.elements.btnPlayPause) {
        this.elements.btnPlayPause.style.display = 'none'
        this.elements.btnPlayPause.disabled = true
      }
      if (this.elements.btnTransform) {
        this.elements.btnTransform.style.display = 'none'
      }
    } catch (error) {
      this.logger.error(`Unload character failed: ${error.message}`, error)
      this.updateStatus(`Unload character failed: ${error.message}`, 'error')
      this.elements.btnUnload.disabled = false
    } finally {
      this.isProcessing.unload = false
    }
  }

  onConnectionState(state) {
    if (this.currentPlaybackMode !== 'sdk') {
      return
    }
    
    if (!this.sdkManager.avatarView) {
      return
    }
    
    if (state === 'connected') {
      this.updateStatus('Connected', 'success')
      this.elements.btnConnect.disabled = true
      this.elements.btnStartRecord.disabled = false
      this.elements.btnInterrupt.disabled = false
      this.elements.btnDisconnect.disabled = false
      this.elements.btnUnload.disabled = false
    } else if (state === 'disconnected') {
      this.updateStatus('Disconnected', 'info')
      this.elements.btnConnect.disabled = false
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = false
    }
  }

  onConversationState(state) {
    this.conversationState = state
    
    if (!this.sdkManager.avatarView) {
      return
    }
    
    // Disable load audio and start record buttons when playing or pausing
    if (state === 'playing' || state === 'pausing') {
      if (this.elements.btnLoadAudio && this.currentPlaybackMode === 'sdk') {
        this.elements.btnLoadAudio.disabled = true
      }
      if (this.elements.btnStartRecord && this.currentPlaybackMode === 'sdk') {
        this.elements.btnStartRecord.disabled = true
      }
    }
    
    // Update play/pause button based on state
    if (this.elements.btnPlayPause) {
      if (state === 'playing') {
        // Show pause button when playing
        this.elements.btnPlayPause.style.display = 'flex'
        this.elements.btnPlayPause.textContent = '⏸️'
        this.elements.btnPlayPause.title = 'Pause'
        this.elements.btnPlayPause.disabled = false
      } else if (state === 'pausing') {
        // Show play button when paused
        this.elements.btnPlayPause.style.display = 'flex'
        this.elements.btnPlayPause.textContent = '▶️'
        this.elements.btnPlayPause.title = 'Resume'
        this.elements.btnPlayPause.disabled = false
      } else {
        // Hide button when idle
        this.elements.btnPlayPause.style.display = 'none'
      }
    }
    
    // Update button states based on conversation state
    if (state === 'playing' || state === 'pausing') {
      // Disable load audio and start record buttons when playing or pausing
      if (this.currentPlaybackMode === 'sdk') {
        if (this.elements.btnLoadAudio) {
          this.elements.btnLoadAudio.disabled = true
        }
        if (this.elements.btnStartRecord) {
          this.elements.btnStartRecord.disabled = true
        }
      }
      
      if (state === 'playing' && this.currentPlaybackMode === 'host') {
        this.elements.btnInterrupt.disabled = false
      }
    } else {
      // Enable buttons when idle
      if (state === 'idle') {
        if (this.currentPlaybackMode === 'host') {
          this.elements.btnStopRecord.disabled = false
          this.elements.btnInterrupt.disabled = true
          this.updateStatus('Playback completed, ready to play again', 'info')
        } else if (this.currentPlaybackMode === 'sdk') {
          if (this.sdkManager.isConnected) {
            if (this.elements.btnLoadAudio) {
              this.elements.btnLoadAudio.disabled = false
            }
            this.elements.btnStartRecord.disabled = false
            this.elements.btnStopRecord.disabled = true
            this.updateStatus('Ready to record', 'info')
          }
        }
      }
    }
  }

  onError(error) {
    this.updateStatus(`Error: ${error.message}`, 'error')
  }

  startFPSMonitoring() {
    const updateFPS = () => {
      this.fpsFrameCount++
      const currentTime = performance.now()
      const elapsed = currentTime - this.fpsLastTime

      if (elapsed >= 1000) {
        // 每秒更新一次FPS
        this.fps = Math.round((this.fpsFrameCount * 1000) / elapsed)
        this.fpsFrameCount = 0
        this.fpsLastTime = currentTime

        // 更新显示
        if (this.elements.fpsDisplay) {
          this.elements.fpsDisplay.textContent = `FPS: ${this.fps}`
        }
      }

      this.fpsAnimationFrameId = requestAnimationFrame(updateFPS)
    }

    this.fpsAnimationFrameId = requestAnimationFrame(updateFPS)
  }

  stopFPSMonitoring() {
    if (this.fpsAnimationFrameId !== null) {
      cancelAnimationFrame(this.fpsAnimationFrameId)
      this.fpsAnimationFrameId = null
    }
  }

  // CPU和GPU监控已移到App级别，这里不再需要

  handleSetBackground() {
    if (!this.sdkManager.avatarView) {
      this.logger.warn('No character loaded')
      return
    }
    
    try {
      // Set background image using the demo background image
      // Background methods are directly on AvatarView
      const backgroundImagePath = '/src/demo-background.png'
      this.sdkManager.avatarView.setBackgroundImage(backgroundImagePath)
      this.sdkManager.avatarView.isOpaque = true
      this.logger.success('Background image set')
      this.updateStatus('Background image set', 'success')
    } catch (error) {
      this.logger.error('Failed to set background', error)
      this.updateStatus(`Failed to set background: ${error.message}`, 'error')
    }
  }

  handleRemoveBackground() {
    if (!this.sdkManager.avatarView) {
      this.logger.warn('No character loaded')
      return
    }
    
    try {
      // Remove background image
      // Background methods are directly on AvatarView
      this.sdkManager.avatarView.setBackgroundImage(null)
      this.sdkManager.avatarView.isOpaque = false
      this.logger.success('Background image removed')
      this.updateStatus('Background image removed', 'success')
    } catch (error) {
      this.logger.error('Failed to remove background', error)
      this.updateStatus(`Failed to remove background: ${error.message}`, 'error')
    }
  }

  destroy() {
    // Stop FPS monitoring
    this.stopFPSMonitoring()

    // CPU和GPU监控由App全局管理，这里不需要停止

    // Stop recording if active (demo state management)
    if (this.audioRecorder.isRecording) {
      this.audioRecorder.stop().catch(() => {})
    }

    // Unload character - SDK will handle disconnect and other cleanup automatically
    if (this.sdkManager.avatarView) {
      this.sdkManager.unloadCharacter()
    }

    // Remove panel from DOM
    const panelElement = this.container.querySelector(`[data-panel-id="${this.panelId}"]`)
    if (panelElement) {
      panelElement.remove()
    }
  }
}

