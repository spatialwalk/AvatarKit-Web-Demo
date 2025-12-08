/**
 * Avatar Panel
 * Manages a single avatar panel with its own SDK instance and controls
 */

import { Logger, updateStatus } from './logger.js'
import { AudioRecorder } from './audioRecorder.js'
import { AvatarSDKManager } from './avatarSDK.js'
import { resampleAudio, resampleAudioWithWebAudioAPI, convertToInt16PCM, convertToUint8Array } from '../utils/audioUtils.js'

const AUDIO_SAMPLE_RATE = 16000

export class AvatarPanel {
  constructor(panelId, container, globalSDKInitialized, onRemove) {
    this.panelId = panelId
    this.container = container
    this.globalSDKInitialized = globalSDKInitialized
    this.onRemove = onRemove
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
          <h3>角色面板 ${this.panelId}</h3>
          ${this.onRemove ? '<button class="btn-remove" title="移除面板">×</button>' : ''}
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
                </div>
                <select id="characterId-${this.panelId}">
                  <option value="b7ba14f6-f9aa-4f89-9934-3753d75aee39">b7ba14f6-f9aa-4f89-9934-3753d75aee39</option>
                  <option value="35692117-ece1-4f77-b014-02cfa22bfb7b">35692117-ece1-4f77-b014-02cfa22bfb7b</option>
                </select>
              </div>
               <div class="form-group">
                 <label>Session Token</label>
                 <div id="sessionToken-${this.panelId}" style="padding: 8px 12px; background: #f0f0f0; border-radius: 6px; color: #666; font-size: 14px;">-</div>
               </div>
              <button id="btnLoadCharacter-${this.panelId}" class="btn btn-primary" disabled>1. Load Character</button>
              <button id="btnConnect-${this.panelId}" class="btn btn-primary" disabled>2. Connect Service</button>
              <button id="btnStartRecord-${this.panelId}" class="btn btn-primary" disabled>3. Start Recording</button>
              <button id="btnStopRecord-${this.panelId}" class="btn btn-danger" disabled>Stop Recording / Play Data</button>
              <button id="btnInterrupt-${this.panelId}" class="btn btn-warning" disabled>Interrupt</button>
              <button id="btnDisconnect-${this.panelId}" class="btn btn-danger" disabled>Disconnect</button>
              <button id="btnUnload-${this.panelId}" class="btn btn-danger" disabled>Unload Character</button>
              <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
                <label for="volumeSlider-${this.panelId}" style="font-size: 14px; min-width: 60px;">🔊 Volume:</label>
                <input type="range" id="volumeSlider-${this.panelId}" min="0" max="100" value="100" style="flex: 1; cursor: pointer;" disabled>
                <span id="volumeValue-${this.panelId}" style="font-size: 14px; min-width: 40px; text-align: right;">100%</span>
              </div>
              <button id="btnToggleLogs-${this.panelId}" class="btn btn-primary" style="margin-top: 12px;">📋 显示日志</button>
            </div>
            
          </div>
          
          <!-- Log Drawer -->
          <div class="log-drawer" id="logDrawer-${this.panelId}">
            <div class="log-drawer-header">
              <h2>📋 Logs</h2>
              <button class="btn-close-drawer" id="btnCloseLogDrawer-${this.panelId}" title="关闭日志面板">×</button>
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
      </div>
    `

    this.container.insertAdjacentHTML('beforeend', panelHTML)
    
    // Store element references
    this.elements = {
      status: document.getElementById(`status-${this.panelId}`),
      logPanel: document.getElementById(`logPanel-${this.panelId}`),
      btnLoadCharacter: document.getElementById(`btnLoadCharacter-${this.panelId}`),
      btnConnect: document.getElementById(`btnConnect-${this.panelId}`),
      btnStartRecord: document.getElementById(`btnStartRecord-${this.panelId}`),
      btnStopRecord: document.getElementById(`btnStopRecord-${this.panelId}`),
      btnInterrupt: document.getElementById(`btnInterrupt-${this.panelId}`),
      btnDisconnect: document.getElementById(`btnDisconnect-${this.panelId}`),
      btnUnload: document.getElementById(`btnUnload-${this.panelId}`),
      volumeSlider: document.getElementById(`volumeSlider-${this.panelId}`),
      volumeValue: document.getElementById(`volumeValue-${this.panelId}`),
      btnToggleLogs: document.getElementById(`btnToggleLogs-${this.panelId}`),
      btnClearLog: document.getElementById(`btnClearLog-${this.panelId}`),
      btnCloseLogDrawer: document.getElementById(`btnCloseLogDrawer-${this.panelId}`),
      logDrawer: document.getElementById(`logDrawer-${this.panelId}`),
      btnRemove: this.onRemove ? this.container.querySelector(`[data-panel-id="${this.panelId}"] .btn-remove`) : null,
      canvasContainer: document.querySelector(`.canvas-container[data-panel-id="${this.panelId}"]`),
      fpsDisplay: document.getElementById(`fpsDisplay-${this.panelId}`),
      environmentDisplay: document.getElementById(`environment-${this.panelId}`),
      characterId: document.getElementById(`characterId-${this.panelId}`),
      sessionToken: document.getElementById(`sessionToken-${this.panelId}`),
      btnAddCharacterId: document.getElementById(`btnAddCharacterId-${this.panelId}`),
      addCharacterIdModal: document.getElementById(`addCharacterIdModal-${this.panelId}`),
      newCharacterIdInput: document.getElementById(`newCharacterIdInput-${this.panelId}`),
      btnCancelAddId: document.getElementById(`btnCancelAddId-${this.panelId}`),
      btnConfirmAddId: document.getElementById(`btnConfirmAddId-${this.panelId}`),
    }

    // Set logger logPanel
    this.logger.logPanel = this.elements.logPanel

    // Start FPS monitoring (每个面板独立监控)
    this.startFPSMonitoring()

    // CPU和GPU监控由App全局管理，这里不需要启动
    this.updateStatus = (message, type) => updateStatus(this.elements.status, message, type)

     // 初始化时检查全局 SDK 状态并更新按钮
     this.checkSDKStatus()
     
     // 更新环境显示和 Session Token 显示
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
       // 更新环境显示和 Session Token 显示
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
    
    // 同时更新 Session Token 显示
    this.updateSessionTokenDisplay()
  }
  
  // 更新 Session Token 显示
  async updateSessionTokenDisplay() {
    if (!this.elements.sessionToken) return
    
    try {
      const { AvatarSDK } = await import('@spatialwalk/avatarkit')
      if (AvatarSDK.isInitialized && AvatarSDK.configuration) {
        const token = AvatarSDK.configuration.sessionToken || ''
        this.elements.sessionToken.textContent = token || '-'
      } else {
        this.elements.sessionToken.textContent = '-'
      }
    } catch (error) {
      this.elements.sessionToken.textContent = '-'
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
    this.elements.btnStartRecord.addEventListener('click', () => this.handleStartRecord())
    this.elements.btnStopRecord.addEventListener('click', () => this.handleStopRecord())
    this.elements.btnInterrupt.addEventListener('click', () => this.handleInterrupt())
    this.elements.btnDisconnect.addEventListener('click', () => this.handleDisconnect())
    this.elements.volumeSlider.addEventListener('input', (e) => this.handleVolumeChange(e))
    this.elements.btnUnload.addEventListener('click', () => this.handleUnloadCharacter())
    this.elements.btnToggleLogs.addEventListener('click', () => this.toggleLogDrawer())
    this.elements.btnCloseLogDrawer.addEventListener('click', () => this.closeLogDrawer())
    this.elements.btnClearLog.addEventListener('click', () => this.logger.clear())
    
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
  }

  toggleLogDrawer() {
    if (this.elements.logDrawer) {
      this.elements.logDrawer.classList.toggle('open')
      const isOpen = this.elements.logDrawer.classList.contains('open')
      this.elements.btnToggleLogs.textContent = isOpen ? '📋 隐藏日志' : '📋 显示日志'
    }
  }

  closeLogDrawer() {
    if (this.elements.logDrawer) {
      this.elements.logDrawer.classList.remove('open')
      this.elements.btnToggleLogs.textContent = '📋 显示日志'
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
        this.elements.btnStartRecord.disabled = true
        this.elements.btnStopRecord.disabled = true
        this.elements.btnInterrupt.disabled = true
        this.elements.btnDisconnect.disabled = true
      } else {
        this.elements.btnConnect.disabled = true
        this.elements.btnStartRecord.disabled = true
        this.elements.btnStopRecord.disabled = false
        this.elements.btnInterrupt.disabled = true
        this.elements.btnDisconnect.disabled = true
      }
      this.elements.btnUnload.disabled = false
      
      // Enable volume slider after character is loaded
      if (this.elements.volumeSlider) {
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
      await this.audioRecorder.start()
      this.logger.success('Recording started')

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
          this.logger.info(`Recording completed, total length: ${audioBuffer.byteLength} bytes (${duration}s, ${AUDIO_SAMPLE_RATE / 1000}kHz PCM16)`)
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
    // Stop any ongoing data sending first
    if (this.shouldContinueSendingData) {
      this.shouldContinueSendingData = false
      // Wait a bit to ensure the previous sending loop has stopped
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    if (this.sdkManager.avatarView?.controller) {
      try {
        this.sdkManager.interrupt()
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (e) {
        // Ignore errors
      }
    }
    
    this.shouldContinueSendingData = true
    
    try {
      const characterId = this.elements.characterId.value.trim()
      const dataDir = `/src/data/${characterId}`
      
      const fileMap = {
        '35692117-ece1-4f77-b014-02cfa22bfb7b': {
          audio: 'audio_20251114042834_pHhATY2emf0w_1763065720879.pcm',
          flame: 'flame_20251114042841_veGlAmGfiEZ2_1763065740224.json',
        },
        'b7ba14f6-f9aa-4f89-9934-3753d75aee39': {
          audio: 'audio_20251113162847_qyozNRfGKI5C_1763022543772.pcm',
          flame: 'flame_20251113162847_qyozNRfGKI5C_1763022545208.json',
        },
      }
      
      const files = fileMap[characterId]
      if (!files) {
        throw new Error(`No data files configured for character ${characterId}`)
      }
      
      // Load audio file
      const audioFile = `${dataDir}/${files.audio}`
      const audioResponse = await fetch(audioFile)
      if (!audioResponse.ok) {
        throw new Error(`Failed to load audio file: ${audioResponse.status}`)
      }
      const audioArrayBuffer = await audioResponse.arrayBuffer()
      const rawAudioData = new Uint8Array(audioArrayBuffer)
      
      const int16Data = new Int16Array(rawAudioData.buffer, rawAudioData.byteOffset, rawAudioData.length / 2)
      const float32Data = new Float32Array(int16Data.length)
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0
      }
      
      // Resample from 24kHz to 16kHz using high-quality Web Audio API
      const resampledFloat32 = await resampleAudioWithWebAudioAPI(float32Data, 24000, AUDIO_SAMPLE_RATE)
      const resampledInt16 = convertToInt16PCM(resampledFloat32)
      const audioData = convertToUint8Array(resampledInt16)
      
      // Load animation file
      const flameFile = `${dataDir}/${files.flame}`
      const flameResponse = await fetch(flameFile)
      if (!flameResponse.ok) {
        throw new Error(`Failed to load animation file: ${flameResponse.status}`)
      }
      const json = await flameResponse.json()
      const keyframes = json.keyframes || []
      
      if (!keyframes || keyframes.length === 0) {
        throw new Error(`No keyframes found in animation file for character ${characterId}`)
      }
      
      const playbackRateBytesPerSecond = AUDIO_SAMPLE_RATE * 2 * 2
      const sendInterval = 30
      const bytesPerInterval = Math.floor(playbackRateBytesPerSecond * sendInterval / 1000)
      
      // Normal streaming flow: send audio and keyframes together in sync
      // 根据文档 Option B：先用 yieldAudioData() 获取 conversationId，然后用 yieldFramesData() 发送动画数据
      let audioOffset = 0
      let conversationId = null
      
      // Step 1: Send first audio chunk to get conversationId
      const initialChunkSize = Math.min(bytesPerInterval, audioData.length)
      const initialChunk = audioData.slice(0, initialChunkSize)
      audioOffset = initialChunkSize
      
      conversationId = this.sdkManager.yieldAudioData(initialChunk, false)
      if (!conversationId) {
        throw new Error('Failed to get conversationId from initial audio data')
      }
      this.logger.info(`Got conversationId: ${conversationId}`)
      
      // Step 2: Stream audio and corresponding keyframes together in sync
      Promise.resolve().then(async () => {
        let keyframeIndex = 0
        // 假设每秒30帧，计算每个音频块（30ms）对应的帧数
        const keyframesPerSecond = 30
        const framesPerChunk = Math.ceil(keyframesPerSecond * sendInterval / 1000) // 每个音频块约1帧
      
      while (audioOffset < audioData.length && this.shouldContinueSendingData) {
        const chunkEnd = Math.min(audioOffset + bytesPerInterval, audioData.length)
        const chunk = audioData.slice(audioOffset, chunkEnd)
        const isLast = chunkEnd >= audioData.length
        
        if (!this.shouldContinueSendingData) {
          break
        }
        
          // Send audio chunk
          const currentConversationId = this.sdkManager.yieldAudioData(chunk, isLast)
          if (currentConversationId) {
            conversationId = currentConversationId
          }
          
          // Immediately send corresponding keyframes for this audio chunk
          if (conversationId && keyframeIndex < keyframes.length) {
            const endIndex = Math.min(keyframeIndex + framesPerChunk, keyframes.length)
            const framesToSend = keyframes.slice(keyframeIndex, endIndex)
            if (framesToSend.length > 0) {
              this.sdkManager.yieldFramesData(framesToSend, conversationId)
              keyframeIndex = endIndex
            }
          }
          
          audioOffset = chunkEnd
          await new Promise(resolve => setTimeout(resolve, sendInterval))
        }
        
        // Send any remaining keyframes if audio finished but keyframes remain
        if (this.shouldContinueSendingData && keyframeIndex < keyframes.length && conversationId) {
          const remainingKeyframes = keyframes.slice(keyframeIndex)
          if (remainingKeyframes.length > 0) {
            this.sdkManager.yieldFramesData(remainingKeyframes, conversationId)
          }
        }
        
        if (this.shouldContinueSendingData) {
          this.logger.success(`Host mode: all data sent (${audioData.length} bytes audio, ${keyframes.length} keyframes)`)
        }
      })
    } catch (error) {
      this.logger.error('External data mode failed', error)
      throw error
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
        this.elements.volumeSlider.disabled = true
        this.elements.volumeValue.textContent = '100%'
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
    
    if (state === 'playing') {
      if (this.currentPlaybackMode === 'host') {
        this.elements.btnInterrupt.disabled = false
      }
    } else {
      if (state === 'idle') {
        if (this.currentPlaybackMode === 'host') {
          this.elements.btnStopRecord.disabled = false
          this.elements.btnInterrupt.disabled = true
          this.updateStatus('Playback completed, ready to play again', 'info')
        } else if (this.currentPlaybackMode === 'sdk') {
          if (this.sdkManager.isConnected) {
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

