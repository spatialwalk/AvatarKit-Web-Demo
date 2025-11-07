/**
 * Main application logic
 * Integrates all modules, handles user interaction
 */

import { Logger, updateStatus } from './logger.js'
import { AudioRecorder } from './audioRecorder.js'
import { AvatarSDKManager } from './avatarSDK.js'

/**
 * Main application class
 */
export class App {
  constructor() {
    // UI elements
    this.elements = {
      logPanel: document.getElementById('logPanel'),
      status: document.getElementById('status'),
      btnInit: document.getElementById('btnInit'),
      btnLoad: document.getElementById('btnLoad'),
      btnConnect: document.getElementById('btnConnect'),
      btnStartRecord: document.getElementById('btnStartRecord'),
      btnStopRecord: document.getElementById('btnStopRecord'),
      btnInterrupt: document.getElementById('btnInterrupt'),
      btnDisconnect: document.getElementById('btnDisconnect'),
      btnUnload: document.getElementById('btnUnload'),
      btnClearLog: document.getElementById('btnClearLog'),
      canvasContainer: document.getElementById('canvasContainer'),
      environment: document.getElementById('environment'),
      characterId: document.getElementById('characterId'),
      sessionToken: document.getElementById('sessionToken'),
    }

    // Initialize utilities
    this.logger = new Logger(this.elements.logPanel)
    // Create AudioRecorder
    this.audioRecorder = new AudioRecorder()
    this.sdkManager = new AvatarSDKManager(this.logger)

    // Bind events
    this.bindEvents()

    // Initialize
    this.init()
  }

  /**
   * Initialize application
   */
  async init() {
    // Try to load SDK
    const loaded = await this.sdkManager.loadSDK()
    if (!loaded) {
      updateStatus(this.elements.status, 'SDK not loaded, please build SDK first', 'error')
      this.elements.btnInit.disabled = true
    } else {
      this.logger.info('Demo loaded, waiting for SDK initialization...')
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Clear logs
    this.elements.btnClearLog.addEventListener('click', () => {
      this.logger.clear()
    })

    // Initialize SDK
    this.elements.btnInit.addEventListener('click', () => this.handleInit())

    // Load character
    this.elements.btnLoad.addEventListener('click', () => this.handleLoadCharacter())

    // Connect service
    this.elements.btnConnect.addEventListener('click', () => this.handleConnect())

    // Recording
    this.elements.btnStartRecord.addEventListener('click', () => this.handleStartRecord())
    this.elements.btnStopRecord.addEventListener('click', () => this.handleStopRecord())

    // Interrupt
    this.elements.btnInterrupt.addEventListener('click', () => this.handleInterrupt())

    // Disconnect
    this.elements.btnDisconnect.addEventListener('click', () => this.handleDisconnect())

    // Unload character
    this.elements.btnUnload.addEventListener('click', () => this.handleUnloadCharacter())
  }

  /**
   * Handle SDK initialization
   */
  async handleInit() {
    try {
      updateStatus(this.elements.status, 'Initializing SDK...', 'info')

      const environment = this.elements.environment.value
      const sessionToken = this.elements.sessionToken.value.trim() || null

      await this.sdkManager.initialize(environment, sessionToken)

      updateStatus(this.elements.status, 'SDK initialized successfully', 'success')
      this.elements.btnInit.disabled = true
      this.elements.btnLoad.disabled = false
    } catch (error) {
      this.logger.error('SDK initialization failed', error)
      updateStatus(this.elements.status, `Initialization failed: ${error.message}`, 'error')
    }
  }

  /**
   * Handle load character
   */
  async handleLoadCharacter() {
    try {
      updateStatus(this.elements.status, 'Loading character...', 'info')

      const characterId = this.elements.characterId.value.trim()

      await this.sdkManager.loadCharacter(
        characterId,
        this.elements.canvasContainer,
        (state) => this.onConnectionState(state),
        (state) => this.onAvatarState(state),
        (error) => this.onError(error)
      )

      updateStatus(this.elements.status, 'Character loaded successfully', 'success')
      this.elements.btnLoad.disabled = true
      this.elements.btnConnect.disabled = false
      this.elements.btnUnload.disabled = false
    } catch (error) {
      this.logger.error('Character load failed', error)
      updateStatus(this.elements.status, `Load failed: ${error.message}`, 'error')
    }
  }

  /**
   * Handle connect service
   */
  async handleConnect() {
    try {
      updateStatus(this.elements.status, 'Connecting...', 'info')
      await this.sdkManager.connect()
      updateStatus(this.elements.status, 'Connected', 'success')
    } catch (error) {
      this.logger.error('Connection failed', error)
      updateStatus(this.elements.status, `Connection failed: ${error.message}`, 'error')
    }
  }

  /**
   * Handle start recording
   */
  async handleStartRecord() {
    try {
      if (!this.sdkManager.isConnected) {
        this.logger.error('Character not loaded or not connected')
        return
      }

      updateStatus(this.elements.status, 'Recording...', 'success')
      await this.audioRecorder.start()
      this.logger.success('Recording started')

      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = false
    } catch (error) {
      this.logger.error('Recording start failed', error)
      updateStatus(this.elements.status, `Recording failed: ${error.message}`, 'error')
    }
  }

  /**
   * Handle stop recording
   */
  async handleStopRecord() {
    try {
      const audioBuffer = await this.audioRecorder.stop()

      if (audioBuffer) {
        const duration = this.audioRecorder.getDuration()
        this.logger.info(`Recording completed, total length: ${audioBuffer.byteLength} bytes (${duration}s, 16kHz PCM16)`)
        this.sdkManager.sendAudio(audioBuffer, true)
        this.logger.success('Complete audio data sent')
      } else {
        this.logger.warn('Recording data is empty')
      }

      updateStatus(this.elements.status, 'Recording stopped', 'info')
      this.logger.success('Recording stopped')

      this.elements.btnStartRecord.disabled = false
      this.elements.btnStopRecord.disabled = true
    } catch (error) {
      this.logger.error('Stop recording failed', error)
      updateStatus(this.elements.status, 'Error stopping recording', 'error')
      this.elements.btnStartRecord.disabled = false
      this.elements.btnStopRecord.disabled = true
    }
  }

  /**
   * Handle interrupt
   */
  async handleInterrupt() {
    try {
      this.sdkManager.interrupt()
      updateStatus(this.elements.status, 'Current conversation interrupted', 'info')
    } catch (error) {
      this.logger.error('Interrupt failed', error)
      updateStatus(this.elements.status, `Interrupt failed: ${error.message}`, 'error')
    }
  }

  /**
   * Handle disconnect
   */
  async handleDisconnect() {
    try {
      if (this.audioRecorder.isRecording) {
        await this.handleStopRecord()
      }

      await this.sdkManager.disconnect()
      updateStatus(this.elements.status, 'Disconnected', 'info')

      this.elements.btnConnect.disabled = false
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = false
    } catch (error) {
      this.logger.error('Disconnect failed', error)
    }
  }

  /**
   * Handle unload character
   */
  handleUnloadCharacter() {
    try {
      this.sdkManager.unloadCharacter()
      updateStatus(this.elements.status, 'Character unloaded', 'info')
      
      // Update button states
      this.elements.btnLoad.disabled = false
      this.elements.btnConnect.disabled = true
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = true
    } catch (error) {
      this.logger.error(`Unload character failed: ${error.message}`, error)
      updateStatus(this.elements.status, `Unload character failed: ${error.message}`, 'error')
    }
  }

  /**
   * Connection state change callback
   */
  onConnectionState(state) {
    if (state === 'connected') {
      updateStatus(this.elements.status, 'Connected', 'success')
      this.elements.btnConnect.disabled = true
      this.elements.btnStartRecord.disabled = false
      this.elements.btnInterrupt.disabled = false
      this.elements.btnDisconnect.disabled = false
      this.elements.btnUnload.disabled = false
    } else if (state === 'disconnected') {
      updateStatus(this.elements.status, 'Disconnected', 'info')
      this.elements.btnConnect.disabled = false
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = false
    }
  }

  /**
   * Avatar state change callback
   */
  onAvatarState(state) {
    // Can handle avatar state changes here
  }

  /**
   * Error callback
   */
  onError(error) {
    updateStatus(this.elements.status, `Error: ${error.message}`, 'error')
  }
}

// Initialize application after page load
document.addEventListener('DOMContentLoaded', () => {
  new App()
})

