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
    this.currentPlaybackMode = 'network'
    this.shouldContinueSendingData = false
    this.avatarState = null

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
      pause: false,
      resume: false,
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
                <select id="environment-${this.panelId}">
                  <option value="us">US</option>
                  <option value="cn">CN</option>
                  <option value="test" selected>Test</option>
                </select>
              </div>
              <div class="form-group">
                <label>Character ID</label>
                <select id="characterId-${this.panelId}">
                  <option value="b7ba14f6-f9aa-4f89-9934-3753d75aee39">b7ba14f6-f9aa-4f89-9934-3753d75aee39</option>
                  <option value="35692117-ece1-4f77-b014-02cfa22bfb7b">35692117-ece1-4f77-b014-02cfa22bfb7b</option>
                </select>
              </div>
              <div class="form-group">
                <label>Session Token</label>
                <input type="text" id="sessionToken-${this.panelId}" placeholder="Enter Session Token (optional)">
              </div>
              <button id="btnLoadNetwork-${this.panelId}" class="btn btn-primary" disabled>1. Load Character (Network)</button>
              <button id="btnLoadExternal-${this.panelId}" class="btn btn-primary" disabled>1. Load Character (External)</button>
              <button id="btnConnect-${this.panelId}" class="btn btn-primary" disabled>2. Connect Service</button>
              <button id="btnStartRecord-${this.panelId}" class="btn btn-primary" disabled>3. Start Recording</button>
              <button id="btnStopRecord-${this.panelId}" class="btn btn-danger" disabled>Stop Recording / Play Data</button>
              <button id="btnPause-${this.panelId}" class="btn btn-warning" disabled>⏸️ Pause</button>
              <button id="btnResume-${this.panelId}" class="btn btn-warning" disabled>▶️ Resume</button>
              <button id="btnInterrupt-${this.panelId}" class="btn btn-warning" disabled>Interrupt</button>
              <button id="btnDisconnect-${this.panelId}" class="btn btn-danger" disabled>Disconnect</button>
              <button id="btnUnload-${this.panelId}" class="btn btn-danger" disabled>Unload Character</button>
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
      </div>
    `

    this.container.insertAdjacentHTML('beforeend', panelHTML)
    
    // Store element references
    this.elements = {
      status: document.getElementById(`status-${this.panelId}`),
      logPanel: document.getElementById(`logPanel-${this.panelId}`),
      btnLoadNetwork: document.getElementById(`btnLoadNetwork-${this.panelId}`),
      btnLoadExternal: document.getElementById(`btnLoadExternal-${this.panelId}`),
      btnConnect: document.getElementById(`btnConnect-${this.panelId}`),
      btnStartRecord: document.getElementById(`btnStartRecord-${this.panelId}`),
      btnStopRecord: document.getElementById(`btnStopRecord-${this.panelId}`),
      btnPause: document.getElementById(`btnPause-${this.panelId}`),
      btnResume: document.getElementById(`btnResume-${this.panelId}`),
      btnInterrupt: document.getElementById(`btnInterrupt-${this.panelId}`),
      btnDisconnect: document.getElementById(`btnDisconnect-${this.panelId}`),
      btnUnload: document.getElementById(`btnUnload-${this.panelId}`),
      btnToggleLogs: document.getElementById(`btnToggleLogs-${this.panelId}`),
      btnClearLog: document.getElementById(`btnClearLog-${this.panelId}`),
      btnCloseLogDrawer: document.getElementById(`btnCloseLogDrawer-${this.panelId}`),
      logDrawer: document.getElementById(`logDrawer-${this.panelId}`),
      btnRemove: this.onRemove ? this.container.querySelector(`[data-panel-id="${this.panelId}"] .btn-remove`) : null,
      canvasContainer: this.container.querySelector(`[data-panel-id="${this.panelId}"] .canvas-container`),
      fpsDisplay: document.getElementById(`fpsDisplay-${this.panelId}`),
      environment: document.getElementById(`environment-${this.panelId}`),
      characterId: document.getElementById(`characterId-${this.panelId}`),
      sessionToken: document.getElementById(`sessionToken-${this.panelId}`),
    }

    // Set logger logPanel
    this.logger.logPanel = this.elements.logPanel

    // Start FPS monitoring (每个面板独立监控)
    this.startFPSMonitoring()

    // CPU和GPU监控由App全局管理，这里不需要启动
    this.updateStatus = (message, type) => updateStatus(this.elements.status, message, type)

    // 初始化时检查全局 SDK 状态并更新按钮
    this.checkSDKStatus()
  }

  // 检查全局 SDK 状态并更新按钮
  async checkSDKStatus() {
    // 如果已经初始化，立即启用按钮
    if (this.globalSDKInitialized) {
      this.elements.btnLoadNetwork.disabled = false
      this.elements.btnLoadExternal.disabled = false
      return
    }

    // 定期检查全局 SDK 状态（因为初始化是异步的）
    this.checkInterval = setInterval(async () => {
      try {
        const { AvatarKit } = await import('@spatialwalk/avatarkit')
        if (AvatarKit.isInitialized) {
          this.globalSDKInitialized = true
          this.elements.btnLoadNetwork.disabled = false
          this.elements.btnLoadExternal.disabled = false
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
      this.elements.btnLoadNetwork.disabled = false
      this.elements.btnLoadExternal.disabled = false
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

    this.elements.btnLoadNetwork.addEventListener('click', () => this.handleLoadCharacter('network'))
    this.elements.btnLoadExternal.addEventListener('click', () => this.handleLoadCharacter('external'))
    this.elements.btnConnect.addEventListener('click', () => this.handleConnect())
    this.elements.btnStartRecord.addEventListener('click', () => this.handleStartRecord())
    this.elements.btnStopRecord.addEventListener('click', () => this.handleStopRecord())
    this.elements.btnPause.addEventListener('click', () => this.handlePause())
    this.elements.btnResume.addEventListener('click', () => this.handleResume())
    this.elements.btnInterrupt.addEventListener('click', () => this.handleInterrupt())
    this.elements.btnDisconnect.addEventListener('click', () => this.handleDisconnect())
    this.elements.btnUnload.addEventListener('click', () => this.handleUnloadCharacter())
    this.elements.btnToggleLogs.addEventListener('click', () => this.toggleLogDrawer())
    this.elements.btnCloseLogDrawer.addEventListener('click', () => this.closeLogDrawer())
    this.elements.btnClearLog.addEventListener('click', () => this.logger.clear())
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

  async handleLoadCharacter(mode) {
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
      this.currentPlaybackMode = mode
      this.elements.btnLoadNetwork.disabled = true
      this.elements.btnLoadExternal.disabled = true
      this.elements.btnUnload.disabled = true
      this.updateStatus(`Loading character (${mode} mode)...`, 'info')

      await this.sdkManager.loadCharacter(
        characterId,
        this.elements.canvasContainer,
        mode,
        (state) => this.onConnectionState(state),
        (state) => this.onAvatarState(state),
        (error) => this.onError(error)
      )

      this.updateStatus('Character loaded successfully', 'success')
      
      if (mode === 'network') {
        this.elements.btnConnect.disabled = false
        this.elements.btnStartRecord.disabled = true
        this.elements.btnStopRecord.disabled = true
        this.elements.btnPause.disabled = true
        this.elements.btnResume.disabled = true
        this.elements.btnInterrupt.disabled = true
        this.elements.btnDisconnect.disabled = true
      } else {
        this.elements.btnConnect.disabled = true
        this.elements.btnStartRecord.disabled = true
        this.elements.btnStopRecord.disabled = false
        this.elements.btnPause.disabled = true
        this.elements.btnResume.disabled = true
        this.elements.btnInterrupt.disabled = true
        this.elements.btnDisconnect.disabled = true
      }
      this.elements.btnUnload.disabled = false
    } catch (error) {
      this.logger.error('Character load failed', error)
      this.updateStatus(`Load failed: ${error.message}`, 'error')
      this.elements.btnLoadNetwork.disabled = false
      this.elements.btnLoadExternal.disabled = false
    } finally {
      this.isProcessing.loadCharacter = false
    }
  }

  async handleConnect() {
    if (this.isProcessing.connect) {
      return
    }

    if (this.currentPlaybackMode !== 'network') {
      this.logger.warn('Connect is only available in network mode')
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

    if (this.currentPlaybackMode === 'network' && !this.sdkManager.isConnected) {
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

    if (this.currentPlaybackMode === 'network') {
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

      if (this.currentPlaybackMode === 'network') {
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
        this.elements.btnPause.disabled = false
        this.elements.btnResume.disabled = true
        this.elements.btnInterrupt.disabled = false
        } else {
        this.elements.btnStopRecord.disabled = false
        this.elements.btnPause.disabled = true
        this.elements.btnResume.disabled = true
        this.elements.btnInterrupt.disabled = true
        this.updateStatus('Playback interrupted', 'info')
        }
      }
    } catch (error) {
      this.logger.error('Operation failed', error)
      this.updateStatus(`Error: ${error.message}`, 'error')
      if (this.currentPlaybackMode === 'network') {
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
      const sendInterval = 50
      const bytesPerInterval = Math.floor(playbackRateBytesPerSecond * sendInterval / 1000)
      
      const initialDataSize = playbackRateBytesPerSecond
      const initialAudioChunks = []
      let audioOffset = 0
      
      while (audioOffset < initialDataSize && audioOffset < audioData.length) {
        const chunkEnd = Math.min(audioOffset + bytesPerInterval, audioData.length, initialDataSize)
        const chunk = audioData.slice(audioOffset, chunkEnd)
        const isLast = chunkEnd >= audioData.length && chunkEnd >= initialDataSize
        initialAudioChunks.push({ data: chunk, isLast })
        audioOffset = chunkEnd
      }
      
      const initialKeyframes = keyframes.slice(0, Math.min(30, keyframes.length))
      
      await this.sdkManager.play(initialAudioChunks, initialKeyframes)
      
      while (audioOffset < audioData.length && this.shouldContinueSendingData) {
        const chunkEnd = Math.min(audioOffset + bytesPerInterval, audioData.length)
        const chunk = audioData.slice(audioOffset, chunkEnd)
        const isLast = chunkEnd >= audioData.length
        
        if (!this.shouldContinueSendingData) {
          break
        }
        
        this.sdkManager.sendAudioChunk(chunk, isLast)
        audioOffset = chunkEnd
        
        await new Promise(resolve => setTimeout(resolve, sendInterval))
      }
      
      if (this.shouldContinueSendingData && keyframes.length > initialKeyframes.length) {
        const remainingKeyframes = keyframes.slice(initialKeyframes.length)
        this.sdkManager.sendKeyframes(remainingKeyframes)
      }
      
      if (this.shouldContinueSendingData) {
        this.logger.success(`External data mode: all data sent (${audioData.length} bytes audio, ${keyframes.length} keyframes)`)
      }
    } catch (error) {
      this.logger.error('External data mode failed', error)
      throw error
    }
  }

  handlePause() {
    if (this.isProcessing.pause) {
      return
    }

    if (!this.sdkManager.avatarView) {
      this.logger.warn('No character loaded')
      return
    }

    // SDK内部会检查状态，这里不需要严格检查
    if (this.avatarState === 'paused') {
      this.logger.warn('Already paused')
      this.updateStatus('Already paused', 'warning')
      return
    }

    try {
      this.isProcessing.pause = true
      this.elements.btnPause.disabled = true
      this.sdkManager.pause()
      // 立即更新按钮状态，onAvatarState 回调也会更新，但这里确保UI立即响应
      this.elements.btnPause.disabled = true
      this.elements.btnResume.disabled = false
      this.updateStatus('Playback paused', 'info')
    } catch (error) {
      this.logger.error('Pause failed', error)
      this.updateStatus(`Pause failed: ${error.message}`, 'error')
      this.elements.btnPause.disabled = false
    } finally {
      this.isProcessing.pause = false
    }
  }

  async handleResume() {
    if (this.isProcessing.resume) {
      return
    }

    if (!this.sdkManager.avatarView) {
      this.logger.warn('No character loaded')
      return
    }

    if (this.avatarState !== 'paused') {
      this.logger.warn('Not paused, cannot resume')
      this.updateStatus('Not paused, cannot resume', 'warning')
      return
    }

    try {
      this.isProcessing.resume = true
      this.elements.btnResume.disabled = true
      await this.sdkManager.resume()
      // 立即更新按钮状态，onAvatarState 回调也会更新，但这里确保UI立即响应
      this.elements.btnPause.disabled = false
      this.elements.btnResume.disabled = true
      this.updateStatus('Playback resumed', 'success')
    } catch (error) {
      this.logger.error('Resume failed', error)
      this.updateStatus(`Resume failed: ${error.message}`, 'error')
      this.elements.btnResume.disabled = false
    } finally {
      this.isProcessing.resume = false
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
      
      if (this.currentPlaybackMode === 'external') {
        this.shouldContinueSendingData = false
      }
      
      this.sdkManager.interrupt()
      this.updateStatus('Current conversation interrupted', 'info')
      
      if (this.currentPlaybackMode === 'external') {
        this.elements.btnStopRecord.disabled = false
        this.elements.btnPause.disabled = true
        this.elements.btnResume.disabled = true
        this.elements.btnInterrupt.disabled = true
      } else if (this.currentPlaybackMode === 'network') {
        if (this.sdkManager.isConnected) {
          this.elements.btnStartRecord.disabled = false
          this.elements.btnStopRecord.disabled = true
        }
        this.elements.btnPause.disabled = true
        this.elements.btnResume.disabled = true
        this.elements.btnInterrupt.disabled = false
      }
      
      // Reset pause/resume button states
      this.elements.btnPause.disabled = true
      this.elements.btnResume.disabled = true
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

    if (this.currentPlaybackMode !== 'network') {
      this.logger.warn('Disconnect is only available in network mode')
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
      if (this.currentPlaybackMode === 'external') {
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
      this.currentPlaybackMode = 'network'
      this.avatarState = null
      this.shouldContinueSendingData = false
      
      this.elements.btnLoadNetwork.disabled = false
      this.elements.btnLoadExternal.disabled = false
      this.elements.btnConnect.disabled = true
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnPause.disabled = true
      this.elements.btnResume.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = true
    } catch (error) {
      this.logger.error(`Unload character failed: ${error.message}`, error)
      this.updateStatus(`Unload character failed: ${error.message}`, 'error')
      this.elements.btnUnload.disabled = false
    } finally {
      this.isProcessing.unload = false
    }
  }

  onConnectionState(state) {
    if (this.currentPlaybackMode !== 'network') {
      return
    }
    
    if (!this.sdkManager.avatarView) {
      return
    }
    
    if (state === 'connected') {
      this.updateStatus('Connected', 'success')
      this.elements.btnConnect.disabled = true
      this.elements.btnStartRecord.disabled = false
      this.elements.btnPause.disabled = true
      this.elements.btnResume.disabled = true
      this.elements.btnInterrupt.disabled = false
      this.elements.btnDisconnect.disabled = false
      this.elements.btnUnload.disabled = false
    } else if (state === 'disconnected') {
      this.updateStatus('Disconnected', 'info')
      this.elements.btnConnect.disabled = false
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnPause.disabled = true
      this.elements.btnResume.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = false
    }
  }

  onAvatarState(state) {
    this.avatarState = state
    
    if (!this.sdkManager.avatarView) {
      return
    }
    
    if (state === 'playing') {
      // 播放中：可以暂停
      this.elements.btnPause.disabled = false
      this.elements.btnResume.disabled = true
      if (this.currentPlaybackMode === 'external') {
        this.elements.btnInterrupt.disabled = false
      }
    } else if (state === 'paused') {
      // 已暂停：可以继续
      this.elements.btnPause.disabled = true
      this.elements.btnResume.disabled = false
      this.updateStatus('Playback paused', 'info')
    } else {
      // idle 或 active 状态：允许尝试暂停（SDK内部会检查）
      if (this.sdkManager.avatarView && state !== 'paused') {
        this.elements.btnPause.disabled = false
      }
      this.elements.btnResume.disabled = true
      
      if (state === 'idle') {
        if (this.currentPlaybackMode === 'external') {
          this.elements.btnStopRecord.disabled = false
          this.elements.btnInterrupt.disabled = true
          this.updateStatus('Playback completed, ready to play again', 'info')
        } else if (this.currentPlaybackMode === 'network') {
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

