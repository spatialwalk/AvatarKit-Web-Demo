/**
 * 单个角色面板组件
 * 每个面板独立管理自己的 SDK 状态和按钮
 */

import { useState, useRef, useEffect } from 'react'
import { useAvatarSDK } from '../hooks/useAvatarSDK'
import { Environment } from '../types'
import { AvatarKit, DrivingServiceMode, AvatarPlaybackMode, AvatarManager, AvatarState } from '@spatialwalk/avatarkit'
import { useLogger } from '../hooks/useLogger'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { StatusBar } from './StatusBar'
import { ControlPanel } from './ControlPanel'
import { AvatarCanvas } from './AvatarCanvas'
import { LogPanel } from './LogPanel'
import { resampleAudioWithWebAudioAPI, convertToInt16PCM, convertToUint8Array } from '../utils/audioUtils'
import './AvatarPanel.css'

const AUDIO_SAMPLE_RATE = 16000

interface AvatarPanelProps {
  panelId: string
  globalSDKInitialized: boolean
  onRemove?: () => void
}

export function AvatarPanel({ panelId, globalSDKInitialized, onRemove }: AvatarPanelProps) {
  // Configuration state
  const [environment, setEnvironment] = useState<Environment>(Environment.test)
  const [characterId, setCharacterId] = useState('b7ba14f6-f9aa-4f89-9934-3753d75aee39')
  const [sessionToken, setSessionToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [avatarState, setAvatarState] = useState<AvatarState | null>(null)
  
  // Operation state flags
  const [isProcessing, setIsProcessing] = useState({
    loadCharacter: false,
    connect: false,
    startRecord: false,
    stopRecord: false,
    interrupt: false,
    pause: false,
    resume: false,
    disconnect: false,
    unload: false,
  })

  // Hooks
  const logger = useLogger()
  const audioRecorder = useAudioRecorder()
  const sdk = useAvatarSDK()
  
  // Log drawer state
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false)
  
  const toggleLogDrawer = () => {
    setIsLogDrawerOpen(prev => !prev)
  }
  
  const closeLogDrawer = () => {
    setIsLogDrawerOpen(false)
  }

  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const shouldContinueSendingDataRef = useRef(false)

  // 监听全局 SDK 初始化状态
  useEffect(() => {
    if (globalSDKInitialized) {
      logger.updateStatus('SDK initialized, ready to load character', 'success')
    } else {
      logger.updateStatus('Waiting for initialization...', 'info')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSDKInitialized])

  // Load character (mode is determined by SDK initialization)
  const handleLoadCharacter = async () => {
    if (isProcessing.loadCharacter || sdk.avatarView) {
      return
    }

    if (!globalSDKInitialized || !characterId.trim()) {
      logger.updateStatus('Please wait for SDK initialization and enter character ID', 'warning')
      return
    }

    if (!canvasContainerRef.current) {
      logger.updateStatus('Canvas container not found', 'error')
      return
    }

    try {
      setIsProcessing(prev => ({ ...prev, loadCharacter: true }))
      setIsLoading(true)
      
      // Get current driving service mode from SDK configuration
      const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
      const modeName = currentMode === DrivingServiceMode.sdk ? 'SDK mode (network)' : 'Host mode (external data)'
      logger.updateStatus(`Loading character (${modeName})...`, 'info')
      logger.log('info', `Starting to load character: ${characterId} (mode: ${modeName})`)

      await sdk.loadCharacter(
        characterId,
        canvasContainerRef.current,
        {
          onConnectionState: (state: string) => {
            logger.log('info', `Connection state: ${state}`)
            if (state === 'connected') {
              logger.updateStatus('Connected', 'success')
            } else if (state === 'disconnected') {
              logger.updateStatus('Disconnected', 'info')
            }
          },
          onAvatarState: (state: AvatarState) => {
            setAvatarState(state)
            logger.log('info', `Avatar state: ${state}`)
          },
          onError: (error: Error) => {
            logger.log('error', `Error: ${error.message}`)
            logger.updateStatus(`Error: ${error.message}`, 'error')
          },
        },
      )

      logger.updateStatus('Character loaded successfully', 'success')
      logger.log('success', 'Character loaded successfully')
      
      requestAnimationFrame(() => {
        setIsLoading(false)
      })
    } catch (error) {
      logger.updateStatus(
        `Load failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `Load failed: ${error instanceof Error ? error.message : String(error)}`)
      setIsLoading(false)
    } finally {
      setIsProcessing(prev => ({ ...prev, loadCharacter: false }))
    }
  }

  // Connect service (network mode only)
  const handleConnect = async () => {
    if (isProcessing.connect) {
      return
    }

    const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
    if (currentMode !== DrivingServiceMode.sdk) {
      logger.updateStatus('Connect is only available in SDK mode (network mode)', 'warning')
      return
    }

    if (!sdk.avatarView) {
      logger.updateStatus('Please load character first', 'warning')
      return
    }

    if (sdk.isConnected) {
      logger.updateStatus('Already connected', 'warning')
      return
    }
    
    try {
      setIsProcessing(prev => ({ ...prev, connect: true }))
      setIsLoading(true)
      logger.updateStatus('Connecting to service...', 'info')
      logger.log('info', 'Connecting to service...')

      await sdk.connect()

      logger.updateStatus('Connected successfully', 'success')
      logger.log('success', 'Connected successfully')
    } catch (error) {
      logger.updateStatus(
        `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `Connection failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
      setIsProcessing(prev => ({ ...prev, connect: false }))
    }
  }

  // Start recording (network mode only)
  const handleStartRecord = async () => {
    if (isProcessing.startRecord || audioRecorder.isRecording) {
      return
    }

    const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
    if (currentMode === DrivingServiceMode.sdk && !sdk.isConnected) {
      logger.updateStatus('Please connect to service first', 'warning')
      return
    }

    if (!sdk.avatarView) {
      logger.updateStatus('Please load character first', 'warning')
      return
    }

    try {
      setIsProcessing(prev => ({ ...prev, startRecord: true }))
      logger.log('info', 'Starting recording...')

      await audioRecorder.start()

      logger.updateStatus('Recording...', 'success')
      logger.log('success', 'Recording started')
    } catch (error) {
      logger.updateStatus(
        `Recording failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `Recording failed: ${error instanceof Error ? error.message : String(error)}`)
      setIsProcessing(prev => ({ ...prev, startRecord: false }))
    } finally {
      setIsProcessing(prev => ({ ...prev, startRecord: false }))
    }
  }

  // Stop recording / Play external data
  const handleStopRecord = async () => {
    if (isProcessing.stopRecord) {
      return
    }

    const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
    const currentPlaybackMode = (currentMode === DrivingServiceMode.sdk) ? AvatarPlaybackMode.network : AvatarPlaybackMode.external

    if (currentPlaybackMode === AvatarPlaybackMode.network) {
      if (!audioRecorder.isRecording) {
        logger.updateStatus('Not recording', 'warning')
        return
      }
    } else {
      if (!sdk.avatarView) {
        logger.updateStatus('Please load character first', 'warning')
        return
      }
    }

    try {
      setIsProcessing(prev => ({ ...prev, stopRecord: true }))
      
      if (currentMode === DrivingServiceMode.sdk) {
        const audioBuffer = await audioRecorder.stop()

        if (audioBuffer && sdk.avatarController) {
          const duration = (audioBuffer.byteLength / 2 / AUDIO_SAMPLE_RATE).toFixed(2)
          logger.log('info', `Recording completed, total length: ${audioBuffer.byteLength} bytes (${duration}s, ${AUDIO_SAMPLE_RATE / 1000}kHz PCM16)`)
          sdk.sendAudio(audioBuffer, true)
          logger.log('success', 'Complete audio data sent')
        } else if (!audioBuffer) {
          logger.log('warning', 'No audio data collected')
        }

        logger.updateStatus('Recording stopped', 'info')
        logger.log('success', 'Recording stopped')
      } else {
        await handleExternalDataMode()
      }
    } catch (error) {
      logger.log('error', `Operation failed: ${error instanceof Error ? error.message : String(error)}`)
      logger.updateStatus(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error')
    } finally {
      setIsProcessing(prev => ({ ...prev, stopRecord: false }))
    }
  }

  // Handle external data mode
  const handleExternalDataMode = async () => {
    if (sdk.avatarView?.controller) {
      try {
        sdk.interrupt()
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (e) {
        // Ignore errors
      }
    }

    shouldContinueSendingDataRef.current = true

    try {
      setIsLoading(true)
      logger.updateStatus('Loading external data...', 'info')
      
      const dataDir = `/src/data/${characterId}`
      
      const fileMap: Record<string, { audio: string; flame: string }> = {
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
      
      // Convert PCM16 (24kHz) to Float32Array
      const int16Data = new Int16Array(rawAudioData.buffer, rawAudioData.byteOffset, rawAudioData.length / 2)
      const float32Data = new Float32Array(int16Data.length)
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0
      }
      
      // Resample from 24kHz to 16kHz
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
      
      setIsLoading(false)
      logger.updateStatus('Playing external data...', 'info')
      
      const playbackRateBytesPerSecond = AUDIO_SAMPLE_RATE * 2 * 2
      const sendInterval = 50
      const bytesPerInterval = Math.floor(playbackRateBytesPerSecond * sendInterval / 1000)
      
      // Normal streaming flow: send audio first to get conversationId, then send animation data
      let audioOffset = 0
      let conversationId: string | null = null
      
      // Step 1: Send initial audio chunk to get conversationId
      const initialChunkSize = Math.min(bytesPerInterval, audioData.length)
      const initialChunk = audioData.slice(0, initialChunkSize)
      audioOffset = initialChunkSize
      
      conversationId = sdk.yieldAudioData(initialChunk, false)
      if (!conversationId) {
        throw new Error('Failed to get conversationId from initial audio data')
      }
      logger.log('info', `Got conversationId: ${conversationId}`)
      
      // Step 2: Send initial keyframes with conversationId
      const initialKeyframes = keyframes.slice(0, Math.min(30, keyframes.length))
      if (initialKeyframes.length > 0) {
        sdk.yieldFramesData(initialKeyframes, conversationId)
      }
      
      // Step 3: Stream remaining audio and animation data
      Promise.resolve().then(async () => {
        // Stream remaining audio chunks
        while (audioOffset < audioData.length && shouldContinueSendingDataRef.current) {
          const chunkEnd = Math.min(audioOffset + bytesPerInterval, audioData.length)
          const chunk = audioData.slice(audioOffset, chunkEnd)
          const isLast = chunkEnd >= audioData.length
          
          if (!shouldContinueSendingDataRef.current) {
            break
          }
          
          const currentConversationId = sdk.yieldAudioData(chunk, isLast)
          if (currentConversationId) {
            conversationId = currentConversationId
          }
          audioOffset = chunkEnd
          
          await new Promise(resolve => setTimeout(resolve, sendInterval))
        }
        
        // Stream remaining keyframes with conversationId
        if (shouldContinueSendingDataRef.current && keyframes.length > initialKeyframes.length && conversationId) {
          const remainingKeyframes = keyframes.slice(initialKeyframes.length)
          // Send keyframes in batches
          const batchSize = 30
          for (let i = 0; i < remainingKeyframes.length && shouldContinueSendingDataRef.current; i += batchSize) {
            const batch = remainingKeyframes.slice(i, i + batchSize)
            sdk.yieldFramesData(batch, conversationId)
            await new Promise(resolve => setTimeout(resolve, sendInterval))
          }
        }
        
        if (shouldContinueSendingDataRef.current) {
          logger.log('success', `Host mode: all data sent (${audioData.length} bytes audio, ${keyframes.length} keyframes)`)
        }
      })
      
      logger.updateStatus('Host mode playback started', 'success')
    } catch (error) {
      setIsLoading(false)
      throw new Error(`External data mode failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Pause playback
  const handlePause = () => {
    if (isProcessing.pause) {
      return
    }

    if (!sdk.avatarView) {
      logger.updateStatus('No character loaded', 'warning')
      return
    }

    // SDK内部会检查状态，这里不需要严格检查
    if (avatarState === AvatarState.paused) {
      logger.updateStatus('Already paused', 'warning')
      return
    }

    try {
      setIsProcessing(prev => ({ ...prev, pause: true }))
      sdk.pause()
      logger.updateStatus('Playback paused', 'info')
      logger.log('info', 'Playback paused')
    } catch (error) {
      logger.updateStatus(
        `Pause failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `Pause failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsProcessing(prev => ({ ...prev, pause: false }))
    }
  }

  // Resume playback
  const handleResume = async () => {
    if (isProcessing.resume) {
      return
    }

    if (!sdk.avatarView) {
      logger.updateStatus('No character loaded', 'warning')
      return
    }

    if (avatarState !== AvatarState.paused) {
      logger.updateStatus('Not paused, cannot resume', 'warning')
      return
    }

    try {
      setIsProcessing(prev => ({ ...prev, resume: true }))
      setIsLoading(true)
      await sdk.resume()
      logger.updateStatus('Playback resumed', 'success')
      logger.log('success', 'Playback resumed')
    } catch (error) {
      logger.updateStatus(
        `Resume failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `Resume failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
      setIsProcessing(prev => ({ ...prev, resume: false }))
    }
  }

  // Interrupt conversation
  const handleInterrupt = () => {
    if (isProcessing.interrupt) {
      return
    }

    if (!sdk.avatarView) {
      logger.updateStatus('No character loaded', 'warning')
      return
    }

    try {
      setIsProcessing(prev => ({ ...prev, interrupt: true }))
      
      const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
      if (currentMode === DrivingServiceMode.host) {
        shouldContinueSendingDataRef.current = false
      }
      
      sdk.interrupt()
      logger.updateStatus('Current conversation interrupted', 'info')
      logger.log('info', 'Current conversation interrupted')
    } catch (error) {
      logger.updateStatus(
        `Interrupt failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `Interrupt failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsProcessing(prev => ({ ...prev, interrupt: false }))
    }
  }

  // Disconnect
  const handleDisconnect = async () => {
    if (isProcessing.disconnect) {
      return
    }

    const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
    if (currentMode !== DrivingServiceMode.sdk) {
      logger.updateStatus('Disconnect is only available in SDK mode (network mode)', 'warning')
      return
    }

    if (!sdk.isConnected) {
      logger.updateStatus('Not connected', 'warning')
      return
    }

    try {
      setIsProcessing(prev => ({ ...prev, disconnect: true }))
      setIsLoading(true)

      if (audioRecorder.isRecording) {
        await handleStopRecord()
      }
    
      await sdk.disconnect()
      logger.updateStatus('Disconnected', 'info')
      logger.log('info', 'Disconnected')
    } catch (error) {
      logger.log('error', `Disconnect failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
      setIsProcessing(prev => ({ ...prev, disconnect: false }))
    }
  }

  // Unload character
  const handleUnloadCharacter = () => {
    if (isProcessing.unload) {
      return
    }

    if (!sdk.avatarView) {
      logger.updateStatus('No character loaded', 'warning')
      return
    }

    try {
      setIsProcessing(prev => ({ ...prev, unload: true }))

      // Stop external data playback if active
      const currentMode = AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk
      if (currentMode === DrivingServiceMode.host) {
        shouldContinueSendingDataRef.current = false
      }

      if (audioRecorder.isRecording) {
        audioRecorder.stop().catch(() => {
          // Ignore errors
        })
      }

      if (sdk.isConnected) {
        sdk.disconnect().catch(() => {
          // Ignore errors
        })
      }

      sdk.unloadCharacter()
      
      // Reset state
      setIsLoading(false)
      setAvatarState(null)
      shouldContinueSendingDataRef.current = false
      
      logger.updateStatus('Character unloaded', 'info')
      logger.log('info', 'Character unloaded, can reload new character')
    } catch (error) {
      logger.log('error', `Unload character failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsProcessing(prev => ({ ...prev, unload: false }))
    }
  }

  // Cleanup resources on component unmount
  useEffect(() => {
    return () => {
      // Stop recording if active (demo state management)
      if (audioRecorder.isRecording) {
        audioRecorder.stop().catch(() => {
          // Ignore errors
        })
      }

      // Unload character - SDK will handle disconnect and other cleanup automatically
      if (sdk.avatarView) {
        sdk.unloadCharacter()
      }

      // Cleanup audio recorder (demo state management)
      audioRecorder.cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="avatar-panel">
      <div className="avatar-panel-header">
        <h3>角色面板 {panelId}</h3>
        {onRemove && (
          <button className="btn-remove" onClick={onRemove} title="移除面板">
            ×
          </button>
        )}
      </div>
      
      <div className="avatar-panel-content">
        <div className="avatar-panel-controls">
          <StatusBar message={logger.statusMessage} type={logger.statusClass} />
          <ControlPanel
            environment={environment}
            characterId={characterId}
            sessionToken={sessionToken}
            isInitialized={globalSDKInitialized}
            avatarView={sdk.avatarView}
            avatarController={sdk.avatarController}
            isRecording={audioRecorder.isRecording}
            isLoading={isLoading}
            isConnected={sdk.isConnected}
            currentPlaybackMode={(AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk) === DrivingServiceMode.sdk ? AvatarPlaybackMode.network : AvatarPlaybackMode.external}
            onEnvironmentChange={setEnvironment}
            onCharacterIdChange={setCharacterId}
            onSessionTokenChange={setSessionToken}
            onLoadCharacter={() => handleLoadCharacter()}
            onConnect={handleConnect}
            onStartRecord={handleStartRecord}
            onStopRecord={handleStopRecord}
            onPause={handlePause}
            onResume={handleResume}
            onInterrupt={handleInterrupt}
            onDisconnect={handleDisconnect}
            onUnloadCharacter={handleUnloadCharacter}
            avatarState={avatarState}
          />
          <button 
            className="btn btn-primary" 
            onClick={toggleLogDrawer}
            style={{ marginTop: '12px' }}
          >
            {isLogDrawerOpen ? '📋 隐藏日志' : '📋 显示日志'}
          </button>
        </div>
        <div className="avatar-panel-canvas">
          <AvatarCanvas ref={canvasContainerRef} avatarView={sdk.avatarView} />
        </div>
      </div>
      
      {/* Log Drawer */}
      <div className={`log-drawer ${isLogDrawerOpen ? 'open' : ''}`}>
        <div className="log-drawer-header">
          <h2>📋 Logs</h2>
          <button className="btn-close-drawer" onClick={closeLogDrawer} title="关闭日志面板">
            ×
          </button>
        </div>
        <LogPanel logs={logger.logs} onClear={logger.clear} />
      </div>
    </div>
  )
}

