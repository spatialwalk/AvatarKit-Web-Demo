/**
 * SDK wrapper
 * Manages SDK initialization, avatar loading, and connection state
 */

/**
 * SDK manager class
 */
export class AvatarSDKManager {
  constructor(logger) {
    this.logger = logger
    this.AvatarSDK = null
    this.AvatarManager = null
    this.AvatarView = null
    this.avatarManager = null
    this.avatarView = null
    this.isInitialized = false
    this.isConnected = false
    this.conversationState = null
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
      this.AvatarSDK = sdk.AvatarSDK
      this.AvatarManager = sdk.AvatarManager
      this.AvatarView = sdk.AvatarView
      
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
    if (!this.AvatarSDK || !this.AvatarManager) {
      const loaded = await this.loadSDK()
      if (!loaded) {
        throw new Error('SDK not loaded')
      }
    }

    this.logger.info('Starting SDK initialization')
    this.logger.info(`Using environment: ${environment}`)

    await this.AvatarSDK.initialize('app_mj8526em_9fpt9s', {
      environment,
      logLevel: 'basic',
    })

    if (sessionToken) {
      this.AvatarSDK.setSessionToken(sessionToken)
      this.logger.info('Session Token set')
    }

    this.avatarManager = this.AvatarManager.shared
    this.isInitialized = true
    this.logger.success('SDK initialized successfully')
  }

  /**
   * Load avatar
   * @param {string} avatarId - Avatar ID
   * @param {HTMLElement} canvasContainer - Canvas container
   * @param {Function} onConnectionState - Connection state callback
   * @param {Function} onConversationState - Conversation state callback
   * @param {Function} onError - Error callback
   * @returns {Promise<void>}
   */
  async loadAvatar(avatarId, canvasContainer, onConnectionState, onConversationState, onError) {
    // Handle backward compatibility: if third parameter is not a function, 
    // it might be the old playbackMode parameter
    if (typeof canvasContainer !== 'object' || !(canvasContainer instanceof HTMLElement)) {
      if (typeof onConnectionState === 'string') {
        // Old API: loadAvatar(avatarId, canvasContainer, playbackMode, ...)
        // This means canvasContainer is actually a callback function
        this.logger.error('Invalid API usage: canvasContainer must be an HTMLElement')
        throw new Error('Invalid API: canvasContainer must be an HTMLElement. Please check your code uses the new API without playbackMode parameter.')
      }
    }
    
    if (!avatarId.trim()) {
      throw new Error('Please enter avatar ID')
    }

    this.logger.info(`Starting to load avatar: ${avatarId}`)

    const avatar = await this.avatarManager.load(avatarId, (progress) => {
      this.logger.info(`Loading progress: ${progress.type} ${progress.progress ? `(${progress.progress}%)` : ''}`)
    })

    this.logger.success('Avatar loaded successfully', { id: avatar.id, name: avatar.name })

    // Check that container exists and is a valid HTMLElement
    if (!canvasContainer) {
      this.logger.error('Canvas container is null or undefined')
      throw new Error('Canvas container not found')
    }
    
    // Log container details for debugging
    this.logger.info('Canvas container type:', { 
      type: typeof canvasContainer, 
      isHTMLElement: canvasContainer instanceof HTMLElement,
      hasAppendChild: typeof canvasContainer.appendChild === 'function',
      constructor: canvasContainer.constructor?.name
    })
    
    if (!(canvasContainer instanceof HTMLElement)) {
      this.logger.error(`Invalid container: expected HTMLElement, got ${typeof canvasContainer}`, { container: canvasContainer })
      throw new Error(`Invalid container: expected HTMLElement, got ${typeof canvasContainer}`)
    }

    // Create view (playback mode is determined by drivingServiceMode in AvatarSDK.initialize())
    try {
      this.avatarView = new this.AvatarView(avatar, canvasContainer)
    } catch (error) {
      this.logger.error('Failed to create AvatarView', { 
        error: error.message, 
        containerType: typeof canvasContainer,
        container: canvasContainer,
        hasAppendChild: canvasContainer && typeof canvasContainer.appendChild === 'function'
      })
      throw error
    }

    if (this.avatarView.controller) {
      this.avatarView.controller.onConnectionState = (state) => {
        this.logger.info(`Connection state: ${state}`)
        this.isConnected = state === 'connected'
        onConnectionState?.(state)
      }

      this.avatarView.controller.onConversationState = (state) => {
        this.conversationState = state
        this.logger.info(`Conversation state: ${state}`)
        onConversationState?.(state)
      }

      this.avatarView.controller.onError = (error) => {
        this.logger.error(`Error: ${error.message}`, error)
        onError?.(error)
      }
    }

    this.logger.success('Avatar view created')
  }

  /**
   * Initialize audio context (MUST be called in user gesture context)
   * @returns {Promise<void>}
   */
  async initializeAudioContext() {
    if (!this.avatarView?.controller) {
      throw new Error('Avatar not loaded')
    }
    
    if (typeof this.avatarView.controller.initializeAudioContext !== 'function') {
      throw new Error('initializeAudioContext() is not available')
    }
    
    this.logger.info('Initializing audio context...')
    await this.avatarView.controller.initializeAudioContext()
    this.logger.success('Audio context initialized')
  }

  /**
   * Connect service
   * @returns {Promise<void>}
   */
  async connect() {
    if (!this.avatarView?.controller) {
      throw new Error('Avatar not loaded')
    }

    // ⚠️ CRITICAL: Initialize audio context first (MUST be called in user gesture context)
    await this.initializeAudioContext()

    this.logger.info('Starting to connect WebSocket service')
    await this.avatarView.controller.start()
    this.logger.success('Connection request sent')
  }

  /**
   * Pause playback
   */
  pause() {
    if (!this.avatarView?.controller) {
      throw new Error('Avatar not loaded')
    }
    this.avatarView.controller.pause()
    this.logger.info('Playback paused')
  }

  /**
   * Resume playback
   */
  async resume() {
    if (!this.avatarView?.controller) {
      throw new Error('Avatar not loaded')
    }
    await this.avatarView.controller.resume()
    this.logger.info('Playback resumed')
  }

  /**
   * Interrupt conversation
   */
  interrupt() {
    if (!this.avatarView?.controller) {
      throw new Error('Avatar not loaded')
    }
    this.avatarView.controller.interrupt()
    this.logger.info('Current conversation interrupted')
  }

  /**
   * Set audio volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    if (!this.avatarView?.controller) {
      throw new Error('Avatar not loaded')
    }
    if (typeof volume !== 'number' || volume < 0 || volume > 1) {
      throw new Error('Volume must be a number between 0.0 and 1.0')
    }
    this.avatarView.controller.setVolume(volume)
    this.logger.info(`Volume set to ${(volume * 100).toFixed(0)}%`)
  }

  /**
   * Get current audio volume
   * @returns {number} Current volume (0.0 to 1.0)
   */
  getVolume() {
    if (!this.avatarView?.controller) {
      throw new Error('Avatar not loaded')
    }
    return this.avatarView.controller.getVolume()
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
   * Unload avatar
   * ⚠️ Important: SDK currently only supports one avatar at a time. If you want to load a new avatar, you must unload the current one first
   */
  unloadAvatar() {
    if (this.avatarView) {
      this.avatarView.dispose() // Clean up all resources, including closing connection, releasing WASM resources, removing Canvas, etc.
      this.avatarView = null
      this.isConnected = false
      this.conversationState = null
      this.logger.info('Avatar unloaded, can reload new avatar')
    }
  }

  /**
   * Send audio data (network mode)
   * @param {ArrayBuffer} audioData - Audio data
   * @param {boolean} isFinal - Whether this is the final data chunk
   */
  sendAudio(audioData, isFinal = false) {
    if (!this.avatarView?.controller) {
      throw new Error('Avatar not loaded')
    }
    this.avatarView.controller.send(audioData, isFinal)
  }


  /**
   * Yield audio data (host mode) - Streams audio data and returns conversationId
   * @param {Uint8Array} audioData - Audio data
   * @param {boolean} isLast - Whether this is the last chunk
   * @returns {string|null} conversationId
   */
  yieldAudioData(audioData, isLast = false) {
    if (!this.avatarView?.controller) {
      throw new Error('Avatar not loaded')
    }
    if (!this.avatarView.controller.yieldAudioData) {
      throw new Error('yieldAudioData() is only available in host mode')
    }
    return this.avatarView.controller.yieldAudioData(audioData, isLast)
  }

  /**
   * Yield frames data (host mode) - Streams animation keyframes with conversationId
   * @param {Array} keyframes - Animation keyframes
   * @param {string} conversationId - Conversation ID (required)
   */
  yieldFramesData(keyframes, conversationId) {
    if (!this.avatarView?.controller) {
      throw new Error('Avatar not loaded')
    }
    if (!this.avatarView.controller.yieldFramesData) {
      throw new Error('yieldFramesData() is only available in host mode')
    }
    if (!conversationId) {
      throw new Error('conversationId is required for yieldFramesData()')
    }
    this.avatarView.controller.yieldFramesData(keyframes, conversationId)
  }

  /**
   * Get current conversation ID
   * @returns {string|null}
   */
  getCurrentConversationId() {
    if (!this.avatarView?.controller) {
      return null
    }
    if (typeof this.avatarView.controller.getCurrentConversationId === 'function') {
      return this.avatarView.controller.getCurrentConversationId()
    }
    return null
  }
}
