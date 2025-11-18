/**
 * Main application logic
 * Integrates all modules, handles user interaction
 */

import { Logger, updateStatus } from './logger.js'
import { AudioRecorder } from './audioRecorder.js'
import { AvatarSDKManager } from './avatarSDK.js'
import { resampleAudio, convertToInt16PCM, convertToUint8Array } from '../utils/audioUtils.js'

/**
 * Audio sample rate constant (backend requires 16kHz)
 */
const AUDIO_SAMPLE_RATE = 16000

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
      btnLoadNetwork: document.getElementById('btnLoadNetwork'),
      btnLoadExternal: document.getElementById('btnLoadExternal'),
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
      playbackMode: document.getElementById('playbackMode'),
    }

    // Current playback mode
    this.currentPlaybackMode = 'network'

    // Operation state flags to prevent repeated clicks
    this.isProcessing = {
      init: false,
      loadCharacter: false,
      connect: false,
      startRecord: false,
      stopRecord: false,
      interrupt: false,
      disconnect: false,
      unload: false,
    }

    // Flag to control external data sending (for interrupt support)
    this.shouldContinueSendingData = false

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

    // Load character (network mode)
    this.elements.btnLoadNetwork.addEventListener('click', () => this.handleLoadCharacter('network'))

    // Load character (external data mode)
    this.elements.btnLoadExternal.addEventListener('click', () => this.handleLoadCharacter('external'))

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
    // Prevent repeated clicks
    if (this.isProcessing.init || this.sdkManager.isInitialized) {
      return
    }

    try {
      this.isProcessing.init = true
      this.elements.btnInit.disabled = true
      updateStatus(this.elements.status, 'Initializing SDK...', 'info')

      const environment = this.elements.environment.value
      const sessionToken = this.elements.sessionToken.value.trim() || null

      await this.sdkManager.initialize(environment, sessionToken)

      updateStatus(this.elements.status, 'SDK initialized successfully', 'success')
      this.elements.btnInit.disabled = true
      this.elements.btnLoadNetwork.disabled = false
      this.elements.btnLoadExternal.disabled = false
    } catch (error) {
      this.logger.error('SDK initialization failed', error)
      updateStatus(this.elements.status, `Initialization failed: ${error.message}`, 'error')
      this.elements.btnInit.disabled = false
    } finally {
      this.isProcessing.init = false
    }
  }

  /**
   * Handle load character
   */
  async handleLoadCharacter(mode) {
    // Prevent repeated clicks
    if (this.isProcessing.loadCharacter || this.sdkManager.avatarView) {
      return
    }

    if (!this.sdkManager.isInitialized) {
      this.logger.error('Please initialize SDK first')
      return
    }

    const characterId = this.elements.characterId.value.trim()
    if (!characterId) {
      this.logger.error('Please enter character ID')
      return
    }

    try {
      this.isProcessing.loadCharacter = true
      this.currentPlaybackMode = mode
      // Disable related buttons to avoid duplicated operations
      this.elements.btnLoadNetwork.disabled = true
      this.elements.btnLoadExternal.disabled = true
      this.elements.btnUnload.disabled = true
      updateStatus(this.elements.status, `Loading character (${mode} mode)...`, 'info')

      await this.sdkManager.loadCharacter(
        characterId,
        this.elements.canvasContainer,
        mode,
        (state) => this.onConnectionState(state),
        (state) => this.onAvatarState(state),
        (error) => this.onError(error)
      )

      updateStatus(this.elements.status, 'Character loaded successfully', 'success')
      
      if (mode === 'network') {
        this.elements.btnConnect.disabled = false
        this.elements.btnStartRecord.disabled = true
        this.elements.btnStopRecord.disabled = true
        this.elements.btnInterrupt.disabled = true
        this.elements.btnDisconnect.disabled = true
      } else {
        // In external data mode, connection and recording are not needed; we can play data files directly
        this.elements.btnConnect.disabled = true
        this.elements.btnStartRecord.disabled = true
        this.elements.btnStopRecord.disabled = false // Use Stop Record as a "Play Data" button
        this.elements.btnInterrupt.disabled = true // Disable interrupt button when not playing
        this.elements.btnDisconnect.disabled = true
      }
      this.elements.btnUnload.disabled = false
    } catch (error) {
      this.logger.error('Character load failed', error)
      updateStatus(this.elements.status, `Load failed: ${error.message}`, 'error')
      // Restore button states
      this.elements.btnLoadNetwork.disabled = false
      this.elements.btnLoadExternal.disabled = false
    } finally {
      this.isProcessing.loadCharacter = false
    }
  }

  /**
   * Handle connect service (network mode only)
   */
  async handleConnect() {
    // Prevent repeated clicks
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
      updateStatus(this.elements.status, 'Connecting...', 'info')
      await this.sdkManager.connect()
      updateStatus(this.elements.status, 'Connected', 'success')
    } catch (error) {
      this.logger.error('Connection failed', error)
      updateStatus(this.elements.status, `Connection failed: ${error.message}`, 'error')
      this.elements.btnConnect.disabled = false
    } finally {
      this.isProcessing.connect = false
    }
  }

  /**
   * Handle start recording
   */
  async handleStartRecord() {
    // Prevent repeated clicks
    if (this.isProcessing.startRecord || this.audioRecorder.isRecording) {
      return
    }

    // Network mode requires an active connection
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
      updateStatus(this.elements.status, 'Recording...', 'success')
      await this.audioRecorder.start()
      this.logger.success('Recording started')

      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = false
    } catch (error) {
      this.logger.error('Recording start failed', error)
      updateStatus(this.elements.status, `Recording failed: ${error.message}`, 'error')
      this.elements.btnStartRecord.disabled = false
      this.elements.btnStopRecord.disabled = true
    } finally {
      this.isProcessing.startRecord = false
    }
  }

  /**
   * Handle stop recording / play external data
   */
  async handleStopRecord() {
    // Prevent repeated clicks
    if (this.isProcessing.stopRecord) {
      return
    }

    if (this.currentPlaybackMode === 'network') {
      // Network mode: must be recording to stop
      if (!this.audioRecorder.isRecording) {
        this.logger.warn('Not recording')
        return
      }
    } else {
      // External data mode: character must be loaded before playback
      if (!this.sdkManager.avatarView) {
        this.logger.error('Please load character first')
        return
      }
    }

    try {
      this.isProcessing.stopRecord = true
      this.elements.btnStopRecord.disabled = true

      if (this.currentPlaybackMode === 'network') {
        // Network mode: stop recording and send audio
        const audioBuffer = await this.audioRecorder.stop()

        if (audioBuffer) {
          const duration = this.audioRecorder.getDuration()
          this.logger.info(`Recording completed, total length: ${audioBuffer.byteLength} bytes (${duration}s, ${AUDIO_SAMPLE_RATE / 1000}kHz PCM16)`)
          
          // Network mode: send audio directly
          this.sdkManager.sendAudio(audioBuffer, true)
          this.logger.success('Complete audio data sent')
        } else {
          this.logger.warn('Recording data is empty')
        }

        updateStatus(this.elements.status, 'Recording stopped', 'info')
        this.logger.success('Recording stopped')

        this.elements.btnStartRecord.disabled = false
        this.elements.btnStopRecord.disabled = true
      } else {
        // External data mode: load data from files and play
        updateStatus(this.elements.status, 'Loading and playing external data...', 'info')
        await this.handleExternalDataMode()
        // Only update button states if not interrupted
        // Note: If interrupted, handleInterrupt() already updated button states
        if (this.shouldContinueSendingData) {
          updateStatus(this.elements.status, 'External data playback started', 'success')
          this.elements.btnStopRecord.disabled = true
          this.elements.btnInterrupt.disabled = false // Allow interrupt in external data mode as well
        } else {
          // Was interrupted, button states already updated in handleInterrupt
          // Ensure button states are correct (handleInterrupt should have set btnStopRecord.disabled = false)
          // But in case it didn't, we ensure it here
          if (this.elements.btnStopRecord.disabled) {
            this.elements.btnStopRecord.disabled = false
          }
          if (!this.elements.btnInterrupt.disabled) {
            this.elements.btnInterrupt.disabled = true
          }
          updateStatus(this.elements.status, 'Playback interrupted', 'info')
        }
      }
    } catch (error) {
      this.logger.error('Operation failed', error)
      updateStatus(this.elements.status, `Error: ${error.message}`, 'error')
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

  /**
   * Handle external data mode: load audio and animation data from files and send to SDK
   */
  async handleExternalDataMode() {
    // If already playing, interrupt first so we can replay safely
    if (this.sdkManager.avatarView?.controller) {
      try {
        this.sdkManager.interrupt()
        // Wait briefly for the interrupt to take effect
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (e) {
        // Ignore errors if interrupt fails (may already be stopped)
      }
    }
    
    // Reset flag to allow data sending
    this.shouldContinueSendingData = true
    
    try {
      
      const characterId = this.elements.characterId.value.trim()
      
      // Determine data directory based on characterId
      const dataDir = `/src/data/${characterId}`
      
      // Load audio and animation data files
      let audioData = null
      
      // Use specific file names for known characterIds
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
      
      // Load audio file (original data is 24kHz PCM16)
      const audioFile = `${dataDir}/${files.audio}`
      try {
        const response = await fetch(audioFile)
        if (!response.ok) {
          throw new Error(`Failed to load audio file: ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const rawAudioData = new Uint8Array(arrayBuffer)
        // Convert PCM16 (24kHz) to Float32Array
        const int16Data = new Int16Array(rawAudioData.buffer, rawAudioData.byteOffset, rawAudioData.length / 2)
        const float32Data = new Float32Array(int16Data.length)
        for (let i = 0; i < int16Data.length; i++) {
          float32Data[i] = int16Data[i] / 32768.0 // Convert to [-1, 1] range
        }
        
        // Use Web Audio API OfflineAudioContext for high-quality resampling with anti-aliasing
        const sourceSampleRate = 24000
        const targetSampleRate = AUDIO_SAMPLE_RATE
        
        // Create an AudioContext and AudioBuffer at the source sample rate
        const sourceContext = new AudioContext({ sampleRate: sourceSampleRate })
        const sourceBuffer = sourceContext.createBuffer(1, float32Data.length, sourceSampleRate)
        sourceBuffer.getChannelData(0).set(float32Data)
        
        // Create an OfflineAudioContext at the target sample rate
        const duration = float32Data.length / sourceSampleRate
        const targetLength = Math.round(duration * targetSampleRate)
        const offlineContext = new OfflineAudioContext(1, targetLength, targetSampleRate)
        
        // Create a source node and connect it to the offline context
        // The browser will resample with built-in anti-aliasing to the target sample rate
        const sourceNode = offlineContext.createBufferSource()
        sourceNode.buffer = sourceBuffer
        sourceNode.connect(offlineContext.destination)
        sourceNode.start(0)
        
        // Render to get the resampled buffer
        const resampledBuffer = await offlineContext.startRendering()
        const resampledFloat32 = resampledBuffer.getChannelData(0)
        
        // Close the temporary AudioContext
        await sourceContext.close()
        
        // Convert back to PCM16
        const resampledInt16 = convertToInt16PCM(resampledFloat32)
        audioData = convertToUint8Array(resampledInt16)
      } catch (e) {
        throw new Error(`Failed to load audio file for character ${characterId}: ${e.message}`)
      }
      
      // Load animation file
      const flameFile = `${dataDir}/${files.flame}`
      let keyframes = null
      try {
        const response = await fetch(flameFile)
        if (!response.ok) {
          throw new Error(`Failed to load animation file: ${response.status}`)
        }
        const json = await response.json()
        keyframes = json.keyframes || []
      } catch (e) {
        throw new Error(`Failed to load animation file for character ${characterId}: ${e.message}`)
      }
      
      if (!keyframes || keyframes.length === 0) {
        throw new Error(`No keyframes found in animation file for character ${characterId}`)
      }
      
      // Compute send rate: playback speed is AUDIO_SAMPLE_RATE, send speed is at least 2x
      // AUDIO_SAMPLE_RATE samples/s = AUDIO_SAMPLE_RATE * 2 bytes/s (PCM16, 2 bytes per sample)
      // 2x speed = AUDIO_SAMPLE_RATE * 2 * 2 bytes/s
      const playbackRateBytesPerSecond = AUDIO_SAMPLE_RATE * 2 * 2
      const sendInterval = 50 // Send every 50ms to ensure at least 2x speed
      const bytesPerInterval = Math.floor(playbackRateBytesPerSecond * sendInterval / 1000)
      
      // Prepare initial data (at least 1 second of audio)
      const initialDataSize = playbackRateBytesPerSecond
      const initialAudioChunks = []
      let audioOffset = 0
      
      // Prepare initial audio chunks
      while (audioOffset < initialDataSize && audioOffset < audioData.length) {
        const chunkEnd = Math.min(audioOffset + bytesPerInterval, audioData.length, initialDataSize)
        const chunk = audioData.slice(audioOffset, chunkEnd)
        const isLast = chunkEnd >= audioData.length && chunkEnd >= initialDataSize
        initialAudioChunks.push({ data: chunk, isLast })
        audioOffset = chunkEnd
      }
      
      // Prepare initial keyframes (approximately 1 second of animation)
      // Assume 30fps keyframes, so 1 second requires 30 frames
      const initialKeyframes = keyframes.slice(0, Math.min(30, keyframes.length))
      
      // Start playback with initial data
      await this.sdkManager.play(initialAudioChunks, initialKeyframes)
      
      // Continue sending remaining audio data (at 2x speed)
      while (audioOffset < audioData.length && this.shouldContinueSendingData) {
        const chunkEnd = Math.min(audioOffset + bytesPerInterval, audioData.length)
        const chunk = audioData.slice(audioOffset, chunkEnd)
        const isLast = chunkEnd >= audioData.length
        
        // Check flag before sending
        if (!this.shouldContinueSendingData) {
          break
        }
        
        this.sdkManager.sendAudioChunk(chunk, isLast)
        audioOffset = chunkEnd
        
        await new Promise(resolve => setTimeout(resolve, sendInterval))
      }
      
      // Send remaining keyframes only if not interrupted
      if (this.shouldContinueSendingData && keyframes.length > initialKeyframes.length) {
        const remainingKeyframes = keyframes.slice(initialKeyframes.length)
        this.sdkManager.sendKeyframes(remainingKeyframes)
      }
      
      if (this.shouldContinueSendingData) {
        this.logger.success(`External data mode: all data sent (${audioData.length} bytes audio, ${keyframes.length} keyframes)`)
      } else {
        this.logger.info('External data mode: data sending interrupted')
      }
    } catch (error) {
      this.logger.error('External data mode failed', error)
      throw error
    }
  }

  /**
   * Handle interrupt
   */
  async handleInterrupt() {
    // Prevent repeated clicks
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
      
      // Stop data sending in external data mode
      if (this.currentPlaybackMode === 'external') {
        this.shouldContinueSendingData = false
      }
      
      this.sdkManager.interrupt()
      updateStatus(this.elements.status, 'Current conversation interrupted', 'info')
      
      // Update button states
      if (this.currentPlaybackMode === 'external') {
        // In external data mode, re-enable play button and disable interrupt after interrupting
        this.elements.btnStopRecord.disabled = false
        this.elements.btnInterrupt.disabled = true
      } else if (this.currentPlaybackMode === 'network') {
        // In network mode, if still connected, re-enable recording after interrupting
        if (this.sdkManager.isConnected) {
          this.elements.btnStartRecord.disabled = false
          this.elements.btnStopRecord.disabled = true
        }
        this.elements.btnInterrupt.disabled = false // Keep interrupt button enabled if still connecting
      }
    } catch (error) {
      this.logger.error('Interrupt failed', error)
      updateStatus(this.elements.status, `Interrupt failed: ${error.message}`, 'error')
      this.elements.btnInterrupt.disabled = false
    } finally {
      this.isProcessing.interrupt = false
    }
  }

  /**
   * Handle disconnect
   */
  async handleDisconnect() {
    // Prevent repeated clicks
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
      updateStatus(this.elements.status, 'Disconnected', 'info')

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

  /**
   * Handle unload character
   */
  handleUnloadCharacter() {
    // Prevent repeated clicks
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

      // If recording, stop first
      if (this.audioRecorder.isRecording) {
        this.audioRecorder.stop().catch(() => {
          // Ignore errors when stopping recording
        })
      }

      // If connected, disconnect first
      if (this.sdkManager.isConnected) {
        this.sdkManager.disconnect().catch(() => {
          // Ignore errors when disconnecting
        })
      }

      this.sdkManager.unloadCharacter()
      updateStatus(this.elements.status, 'Character unloaded', 'info')
      
      // Update button states
      this.elements.btnLoadNetwork.disabled = false
      this.elements.btnLoadExternal.disabled = false
      this.elements.btnConnect.disabled = true
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = true
      
      this.currentPlaybackMode = 'network'
    } catch (error) {
      this.logger.error(`Unload character failed: ${error.message}`, error)
      updateStatus(this.elements.status, `Unload character failed: ${error.message}`, 'error')
      this.elements.btnUnload.disabled = false
    } finally {
      this.isProcessing.unload = false
    }
  }

  /**
   * Connection state change callback (network mode only)
   */
  onConnectionState(state) {
    if (this.currentPlaybackMode !== 'network') {
      return
    }
    
    // If character has been unloaded, do not update button states
    if (!this.sdkManager.avatarView) {
      return
    }
    
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
    // If character has been unloaded, do not update button states
    if (!this.sdkManager.avatarView) {
      return
    }
    
      if (state === 'playing') {
      if (this.currentPlaybackMode === 'external') {
        // In external data mode, enable interrupt button when playback starts
        this.elements.btnInterrupt.disabled = false
      }
      } else if (state === 'idle') {
      if (this.currentPlaybackMode === 'external') {
        // In external data mode, re-enable play button and disable interrupt after playback finishes
        this.elements.btnStopRecord.disabled = false
        this.elements.btnInterrupt.disabled = true
        updateStatus(this.elements.status, 'Playback completed, ready to play again', 'info')
      } else if (this.currentPlaybackMode === 'network') {
        // In network mode, if still connected, re-enable recording after interrupt or playback completion
        if (this.sdkManager.isConnected) {
          this.elements.btnStartRecord.disabled = false
          this.elements.btnStopRecord.disabled = true
          updateStatus(this.elements.status, 'Ready to record', 'info')
        }
      }
    }
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

