/**
 * SDK wrapper
 * Manages SDK initialization, character loading, and connection state
 */

/**
 * SDK manager class
 */
export class AvatarSDKManager {
  constructor(logger) {
    this.logger = logger
    this.AvatarKit = null
    this.AvatarManager = null
    this.AvatarView = null
    this.AvatarPlaybackMode = null
    this.avatarManager = null
    this.avatarView = null
    this.isInitialized = false
    this.isConnected = false
    this.avatarState = null
  }

  /**
   * Load SDK
   * @returns {Promise<boolean>} Whether loading succeeded
   */
  async loadSDK() {
    try {
      this.logger.info('Loading SDK...')
      // Use npm-installed SDK
      const sdk = await import('@spatialwalk/avatarkit')
      this.AvatarKit = sdk.AvatarKit
      this.AvatarManager = sdk.AvatarManager
      this.AvatarView = sdk.AvatarView
      this.AvatarPlaybackMode = sdk.AvatarPlaybackMode
      
      // Verify AvatarPlaybackMode is correctly exported
      if (!this.AvatarPlaybackMode) {
        this.logger.error('AvatarPlaybackMode not found in SDK exports', { 
          sdkKeys: Object.keys(sdk).filter(k => k.includes('Playback') || k.includes('Mode'))
        })
        throw new Error('AvatarPlaybackMode not exported from SDK')
      }
      
      if (!this.AvatarPlaybackMode.network || !this.AvatarPlaybackMode.external) {
        this.logger.error('AvatarPlaybackMode missing required properties', {
          playbackMode: this.AvatarPlaybackMode,
          allSdkKeys: Object.keys(sdk).slice(0, 20)
        })
        throw new Error('AvatarPlaybackMode is missing network or external property')
      }
      
      this.logger.success('SDK loaded successfully')
      return true
    } catch (error) {
      this.logger.error('SDK loading failed, please ensure SDK is built', error)
      this.logger.info('Tip: Run npm run build to build SDK')
      return false
    }
  }

  /**
   * Initialize SDK
   * @param {string} environment - Environment (us, cn, test)
   * @param {string} sessionToken - Session Token (optional)
   * @returns {Promise<void>}
   */
  async initialize(environment, sessionToken = null) {
    if (!this.AvatarKit || !this.AvatarManager) {
      const loaded = await this.loadSDK()
      if (!loaded) {
        throw new Error('SDK not loaded')
      }
    }

    this.logger.info('Starting SDK initialization')
    this.logger.info(`Using environment: ${environment}`)

    await this.AvatarKit.initialize('demo', {
      environment,
      logLevel: 'basic',
    })

    if (sessionToken) {
      this.AvatarKit.setSessionToken(sessionToken)
      this.logger.info('Session Token set')
    }

    this.avatarManager = this.AvatarManager.shared
    this.isInitialized = true
    this.logger.success('SDK initialized successfully')
  }

  /**
   * Load character
   * @param {string} characterId - Character ID
   * @param {HTMLElement} canvasContainer - Canvas container
   * @param {string} playbackMode - Playback mode ('network' or 'external')
   * @param {Function} onConnectionState - Connection state callback
   * @param {Function} onAvatarState - Avatar state callback
   * @param {Function} onError - Error callback
   * @returns {Promise<void>}
   */
  async loadCharacter(characterId, canvasContainer, playbackMode, onConnectionState, onAvatarState, onError) {
    if (!characterId.trim()) {
      throw new Error('Please enter character ID')
    }

    this.logger.info(`Starting to load character: ${characterId} (mode: ${playbackMode})`)

    const avatar = await this.avatarManager.load(characterId, (progress) => {
      this.logger.info(`Loading progress: ${progress.type} ${progress.progress ? `(${progress.progress}%)` : ''}`)
    })

    this.logger.success('Character loaded successfully', { id: avatar.id, name: avatar.name })

    // Check that container exists
    if (!canvasContainer) {
      this.logger.error('Canvas container is null or undefined')
      throw new Error('Canvas container not found')
    }

    // Ensure AvatarPlaybackMode is loaded
    if (!this.AvatarPlaybackMode) {
      this.logger.error('AvatarPlaybackMode not loaded. Please ensure SDK is properly initialized.')
      throw new Error('AvatarPlaybackMode not available')
    }

    // Determine playback mode
    const mode = playbackMode === 'external' 
      ? this.AvatarPlaybackMode.external 
      : this.AvatarPlaybackMode.network
    
    this.logger.info('Using playback mode:', { playbackMode, mode })

    // Create view with chosen playback mode
    this.avatarView = new this.AvatarView(avatar, {
      container: canvasContainer,
      playbackMode: mode,
    })

    if (this.avatarView.controller) {
      this.avatarView.controller.onConnectionState = (state) => {
        this.logger.info(`Connection state: ${state}`)
        this.isConnected = state === 'connected'
        onConnectionState?.(state)
      }

      this.avatarView.controller.onAvatarState = (state) => {
        this.avatarState = state
        this.logger.info(`Avatar state: ${state}`)
        onAvatarState?.(state)
      }

      this.avatarView.controller.onError = (error) => {
        this.logger.error(`Error: ${error.message}`, error)
        onError?.(error)
      }
    }

    this.logger.success('Character view created')
  }

  /**
   * Connect service
   * @returns {Promise<void>}
   */
  async connect() {
    if (!this.avatarView?.controller) {
      throw new Error('Character not loaded')
    }

    this.logger.info('Starting to connect WebSocket service')
    await this.avatarView.controller.start()
    this.logger.success('Connection request sent')
  }

  /**
   * Pause playback
   */
  pause() {
    if (!this.avatarView?.controller) {
      throw new Error('Character not loaded')
    }
    this.avatarView.controller.pause()
    this.logger.info('Playback paused')
  }

  /**
   * Resume playback
   */
  async resume() {
    if (!this.avatarView?.controller) {
      throw new Error('Character not loaded')
    }
    await this.avatarView.controller.resume()
    this.logger.info('Playback resumed')
  }

  /**
   * Interrupt conversation
   */
  interrupt() {
    if (!this.avatarView?.controller) {
      throw new Error('Character not loaded')
    }
    this.avatarView.controller.interrupt()
    this.logger.info('Current conversation interrupted')
  }

  /**
   * Disconnect
   */
  async disconnect() {
    if (this.avatarView?.controller) {
      this.avatarView.controller.close()
      this.logger.info('Connection closed')
    }
    this.isConnected = false
  }

  /**
   * Unload character
   * ⚠️ Important: SDK currently only supports one character at a time. If you want to load a new character, you must unload the current one first
   */
  unloadCharacter() {
    if (this.avatarView) {
      this.avatarView.dispose() // Clean up all resources, including closing connection, releasing WASM resources, removing Canvas, etc.
      this.avatarView = null
      this.isConnected = false
      this.avatarState = null
      this.logger.info('Character unloaded, can reload new character')
    }
  }

  /**
   * Send audio data (network mode)
   * @param {ArrayBuffer} audioData - Audio data
   * @param {boolean} isFinal - Whether this is the final data chunk
   */
  sendAudio(audioData, isFinal = false) {
    if (!this.avatarView?.controller) {
      throw new Error('Character not loaded')
    }
    this.avatarView.controller.send(audioData, isFinal)
  }

  /**
   * Send audio chunk (external data mode)
   * @param {Uint8Array} audioData - Audio data
   * @param {boolean} isLast - Whether this is the last chunk
   */
  sendAudioChunk(audioData, isLast = false) {
    if (!this.avatarView?.controller) {
      throw new Error('Character not loaded')
    }
    this.avatarView.controller.sendAudioChunk(audioData, isLast)
  }

  /**
   * Send keyframes (external data mode)
   * @param {Array} keyframes - Animation keyframes
   */
  sendKeyframes(keyframes) {
    if (!this.avatarView?.controller) {
      throw new Error('Character not loaded')
    }
    this.avatarView.controller.sendKeyframes(keyframes)
  }

  /**
   * Play (external data mode)
   * @param {Array} initialAudioChunks - Initial audio chunks for playback start
   * @param {Array} initialKeyframes - Initial animation keyframes for playback start
   * @returns {Promise<void>}
   */
  async play(initialAudioChunks = null, initialKeyframes = null) {
    if (!this.avatarView?.controller) {
      throw new Error('Character not loaded')
    }
    await this.avatarView.controller.play(initialAudioChunks, initialKeyframes)
  }
}

