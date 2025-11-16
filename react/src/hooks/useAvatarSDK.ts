/**
 * Avatar SDK Hook
 * Encapsulates SDK initialization and usage logic
 */

import { useState, useRef, useEffect } from 'react'
import { AvatarKit, AvatarManager, AvatarView, Environment, AvatarPlaybackMode, type AvatarController, type ConnectionState, type AvatarState } from '@spatialwalk/avatarkit'

export function useAvatarSDK() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [avatarView, setAvatarView] = useState<AvatarView | null>(null)
  const [avatarController, setAvatarController] = useState<AvatarController | null>(null)
  const avatarManagerRef = useRef<AvatarManager | null>(null)
  const avatarViewRef = useRef<AvatarView | null>(null)

  // Initialize SDK
  const initialize = async (environment: Environment, sessionToken?: string) => {
    try {
      await AvatarKit.initialize('demo', { environment })
      
      if (sessionToken) {
        AvatarKit.setSessionToken(sessionToken)
      }

      const avatarManager = new AvatarManager()
      avatarManagerRef.current = avatarManager
      setIsInitialized(true)
    } catch (error) {
      throw new Error(`SDK initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Load character
  const loadCharacter = async (
    characterId: string,
    container: HTMLElement,
    playbackMode: AvatarPlaybackMode = AvatarPlaybackMode.network,
    callbacks?: {
      onConnectionState?: (state: ConnectionState) => void
      onAvatarState?: (state: AvatarState) => void
      onError?: (error: Error) => void
    },
  ) => {
    if (!avatarManagerRef.current) {
      throw new Error('SDK not initialized')
    }

    try {
      // 1. Load Avatar
      const avatar = await avatarManagerRef.current.load(characterId)
      
      // 2. Create AvatarView with new API
      const avatarView = new AvatarView(avatar, {
        container,
        playbackMode,
      })
      
      // 3. Set callbacks (use controller instead of avatarController)
      // Reset connection state before attaching callback to avoid race conditions
      setIsConnected(false)
      avatarView.controller.onConnectionState = (state: ConnectionState) => {
        setIsConnected(state === 'connected')
        callbacks?.onConnectionState?.(state)
      }
      if (callbacks?.onAvatarState) {
        avatarView.controller.onAvatarState = callbacks.onAvatarState
      }
      if (callbacks?.onError) {
        avatarView.controller.onError = callbacks.onError
      }

      setAvatarView(avatarView)
      avatarViewRef.current = avatarView
      setAvatarController(avatarView.controller)
    } catch (error) {
      throw new Error(`Failed to load character: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Connect service (network mode only)
  const connect = async () => {
    if (!avatarView?.controller) {
      throw new Error('Character not loaded')
    }

    await avatarView.controller.start()
  }

  // Send audio data (network mode only)
  const sendAudio = (audioData: ArrayBuffer, isFinal: boolean = false) => {
    if (!avatarController) {
      throw new Error('Character not loaded or not connected')
    }
    if (!avatarController.send) {
      throw new Error('send() is only available in network mode')
    }
    avatarController.send(audioData, isFinal)
  }

  // Play (external data mode)
  const play = async (
    initialAudioChunks?: Array<{ data: Uint8Array, isLast: boolean }>,
    initialKeyframes?: any[],
  ) => {
    if (!avatarController) {
      throw new Error('Character not loaded')
    }
    if (!avatarController.play) {
      throw new Error('play() is only available in external data mode')
    }
    await avatarController.play(initialAudioChunks, initialKeyframes)
  }

  // Send audio chunk (external data mode)
  const sendAudioChunk = (data: Uint8Array, isLast: boolean = false) => {
    if (!avatarController) {
      throw new Error('Character not loaded')
    }
    if (!avatarController.sendAudioChunk) {
      throw new Error('sendAudioChunk() is only available in external data mode')
    }
    avatarController.sendAudioChunk(data, isLast)
  }

  // Send keyframes (external data mode)
  const sendKeyframes = (keyframes: any[]) => {
    if (!avatarController) {
      throw new Error('Character not loaded')
    }
    if (!avatarController.sendKeyframes) {
      throw new Error('sendKeyframes() is only available in external data mode')
    }
    avatarController.sendKeyframes(keyframes)
  }

  // Interrupt conversation
  const interrupt = () => {
    if (!avatarController) {
      throw new Error('Character not loaded or not connected')
    }
    avatarController.interrupt()
  }

  // Disconnect (network mode only)
  const disconnect = async () => {
    if (avatarView?.controller) {
      avatarView.controller.close()
      setIsConnected(false)
      // Don't clear avatarView and avatarController when disconnecting, allow reconnection
    }
  }

  // Unload character
  // ⚠️ Important: SDK currently only supports one character at a time. If you want to load a new character, you must unload the current one first
  const unloadCharacter = () => {
    if (avatarView) {
      avatarView.dispose() // Clean up all resources, including closing connection, releasing WASM resources, removing Canvas, etc.
      setAvatarView(null)
      avatarViewRef.current = null
      setAvatarController(null)
      setIsConnected(false)
    }
  }

  // Cleanup resources (only executed on component unmount)
  useEffect(() => {
    return () => {
      // Clean up all resources when component unmounts
      if (avatarViewRef.current) {
        avatarViewRef.current.dispose()
      }
      // Clear avatarManagerRef when component unmounts
      if (avatarManagerRef.current) {
        avatarManagerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array, only executed on component unmount

  return {
    isInitialized,
    isConnected,
    avatarView,
    avatarController,
    initialize,
    loadCharacter,
    connect,
    sendAudio,
    play,
    sendAudioChunk,
    sendKeyframes,
    interrupt,
    disconnect,
    unloadCharacter,
  }
}

