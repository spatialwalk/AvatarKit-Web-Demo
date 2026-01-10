/**
 * 单个角色面板组件
 * 每个面板独立管理自己的 SDK 状态和按钮
 */

import { useState, useRef, useEffect } from 'react'
import { useAvatarSDK } from '../hooks/useAvatarSDK'
import { Environment } from '../types'
import { AvatarSDK, DrivingServiceMode, AvatarManager, ConversationState } from '@spatialwalk/avatarkit'
import { useLogger } from '../hooks/useLogger'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { StatusBar } from './StatusBar'
import { ControlPanel } from './ControlPanel'
import { AvatarCanvas } from './AvatarCanvas'
import { LogPanel } from './LogPanel'
import { resampleAudioWithWebAudioAPI, convertToInt16PCM, convertToUint8Array, decodeAudioFile } from '../utils/audioUtils'
import './AvatarPanel.css'

interface AvatarPanelProps {
  panelId: string
  globalSDKInitialized: boolean
  onRemove?: () => void
  getSampleRate?: () => number
}

export function AvatarPanel({ panelId, globalSDKInitialized, onRemove, getSampleRate }: AvatarPanelProps) {
  // Configuration state
  const [characterIdList, setCharacterIdList] = useState<string[]>([])
  const [characterId, setCharacterId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [volume, setVolume] = useState(100)
  const [conversationState, setConversationState] = useState<ConversationState | null>(null)
  
  // Operation state flags
  const [isProcessing, setIsProcessing] = useState({
    loadCharacter: false,
    connect: false,
    startRecord: false,
    stopRecord: false,
    interrupt: false,
    disconnect: false,
    unload: false,
    loadAudio: false,
  })
  
  const [showLoadAudioModal, setShowLoadAudioModal] = useState(false)
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null)
  
  // Track if audio is being sent (before conversationState updates)
  const [isSendingAudio, setIsSendingAudio] = useState(false)

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
  
  // Transform modal state
  const [isTransformModalOpen, setIsTransformModalOpen] = useState(false)
  const [transformX, setTransformX] = useState('0')
  const [transformY, setTransformY] = useState('0')
  const [transformScale, setTransformScale] = useState('1')

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
      const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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
          onConversationState: (state: ConversationState) => {
            setConversationState(state)
            logger.log('info', `Conversation state: ${state}`)
            // Reset isSendingAudio when playback starts
            if (state === ConversationState.playing) {
              setIsSendingAudio(false)
            }
          },
          onError: (error: Error) => {
            logger.log('error', `Error: ${error.message}`)
            logger.updateStatus(`Error: ${error.message}`, 'error')
          },
        },
      )

      // Set initial volume
      try {
        const currentVolume = sdk.getVolume()
        setVolume(Math.round(currentVolume * 100))
      } catch (error) {
        // Ignore if volume not available
      }

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

    const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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

  // Load audio file
  const handleLoadAudio = () => {
    const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
    if (currentMode !== DrivingServiceMode.sdk) {
      logger.updateStatus('Load audio is only available in SDK mode', 'warning')
      return
    }
    
    if (!sdk.isConnected) {
      logger.updateStatus('Please connect to service first', 'warning')
      return
    }
    
    if (!sdk.avatarView) {
      logger.updateStatus('Please load character first', 'warning')
      return
    }
    
    setShowLoadAudioModal(true)
    setSelectedAudioFile(null)
  }

  const handleConfirmLoadAudio = async () => {
    if (!selectedAudioFile) {
      logger.updateStatus('Please select an audio file', 'warning')
      return
    }
    
    const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
    if (currentMode !== DrivingServiceMode.sdk) {
      logger.updateStatus('Load audio is only available in SDK mode', 'warning')
      return
    }
    
    if (!sdk.isConnected) {
      logger.updateStatus('Please connect to service first', 'warning')
      return
    }
    
    if (!sdk.avatarView) {
      logger.updateStatus('Please load character first', 'warning')
      return
    }
    
    const file = selectedAudioFile
    
    try {
      setIsProcessing(prev => ({ ...prev, loadAudio: true }))
      logger.log('info', `Loading audio file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
      logger.updateStatus('Loading audio file...', 'info')
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      
      // Get sample rate from props (default to 16000)
      const targetSampleRate = getSampleRate ? getSampleRate() : 16000
      
      // Check file type
      const fileName = file.name.toLowerCase()
      const isAudioFile = fileName.endsWith('.mp3') || fileName.endsWith('.wav') || file.type.startsWith('audio/')
      
      let audioData: ArrayBuffer
      let duration: number
      
      if (isAudioFile) {
        // Decode audio file (mp3, wav, etc.)
        logger.log('info', 'Decoding audio file...')
        const decoded = await decodeAudioFile(arrayBuffer, targetSampleRate)
        audioData = decoded.data.buffer
        duration = decoded.duration
        logger.log('info', `Audio file decoded: ${audioData.byteLength} bytes (${duration.toFixed(2)}s, ${decoded.sampleRate}Hz, 16-bit PCM)`)
      } else {
        // Assume it's PCM format
        duration = (arrayBuffer.byteLength / 2 / targetSampleRate)
        audioData = arrayBuffer
        logger.log('info', `Audio file loaded: ${arrayBuffer.byteLength} bytes (${duration.toFixed(2)}s, ${targetSampleRate}Hz, 16-bit PCM)`)
      }
      
      // Send audio data to SDK
      if (sdk.avatarController) {
        setIsSendingAudio(true)
        sdk.sendAudio(audioData, true)
        logger.log('success', 'Audio file sent to avatar')
        logger.updateStatus('Audio file sent', 'success')
        setShowLoadAudioModal(false)
        setSelectedAudioFile(null)
        // Note: isSendingAudio will be set to false when conversationState changes to 'playing'
      } else {
        throw new Error('Avatar controller not available')
      }
    } catch (error) {
      logger.log('error', `Failed to load audio file: ${error instanceof Error ? error.message : String(error)}`)
      logger.updateStatus(`Failed to load audio: ${error instanceof Error ? error.message : String(error)}`, 'error')
    } finally {
      setIsProcessing(prev => ({ ...prev, loadAudio: false }))
    }
  }

  const handleCancelLoadAudio = () => {
    setShowLoadAudioModal(false)
    setSelectedAudioFile(null)
  }

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedAudioFile(event.target.files[0])
    } else {
      setSelectedAudioFile(null)
    }
  }

  // Start recording (network mode only)
  const handleStartRecord = async () => {
    if (isProcessing.startRecord || audioRecorder.isRecording) {
      return
    }

    const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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

      // Get sample rate from props (default to 16000)
      const sampleRate = getSampleRate ? getSampleRate() : 16000
      await audioRecorder.start(sampleRate)

      logger.updateStatus(`Recording... (${sampleRate} Hz)`, 'success')
      logger.log('success', `Recording started (${sampleRate} Hz)`)
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

    const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
    const currentPlaybackMode = (currentMode === DrivingServiceMode.sdk) ? 'network' : 'external'

    if (currentPlaybackMode === 'network') {
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
          const sampleRate = getSampleRate ? getSampleRate() : 16000
          const duration = (audioBuffer.byteLength / 2 / sampleRate).toFixed(2)
          logger.log('info', `Recording completed, total length: ${audioBuffer.byteLength} bytes (${duration}s, ${sampleRate / 1000}kHz PCM16)`)
          setIsSendingAudio(true)
          sdk.sendAudio(audioBuffer, true)
          logger.log('success', 'Complete audio data sent')
          // Note: isSendingAudio will be set to false when conversationState changes to 'playing'
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
    // Host mode: fetch audio and animation data from API
    try {
      logger.log('info', 'Fetching data from API...')
      logger.updateStatus('Fetching data from API...', 'info')
      
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
      const rawAudioData = base64ToUint8Array(data.audio)
      const animationsData = data.animations.map((anim: string) => base64ToUint8Array(anim))
      
      // 获取目标采样率（初始化时选择的采样率）
      const targetSampleRate = getSampleRate ? getSampleRate() : 16000
      const sourceSampleRate = 24000 // API 返回的音频数据是 24kHz
      
      // 如果目标采样率与源采样率不同，需要进行重采样
      let audioData = rawAudioData
      if (targetSampleRate !== sourceSampleRate) {
        logger.log('info', `Resampling audio from ${sourceSampleRate}Hz to ${targetSampleRate}Hz...`)
        logger.updateStatus(`Resampling audio (${sourceSampleRate}Hz → ${targetSampleRate}Hz)...`, 'info')
        
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
        
        logger.log('success', `Audio resampled from ${sourceSampleRate}Hz to ${targetSampleRate}Hz`)
      }
      
      logger.log('success', 'Data fetched and decoded successfully')
      logger.updateStatus('Playing data...', 'info')
      
      // 使用 SDK 播放数据
      // 1. 发送音频数据（最后一个 chunk 标记为结束）
      const conversationId = sdk.yieldAudioData(audioData, true)
      
      if (!conversationId) {
        throw new Error('Failed to get conversation ID from audio data')
      }
      
      // 2. 发送动画数据
      sdk.yieldFramesData(animationsData, conversationId)
      
      logger.log('success', 'Data playback started')
      logger.updateStatus('Data playback started', 'success')
      
    } catch (error) {
      logger.log('error', `Failed to fetch or play data from API: ${error instanceof Error ? error.message : String(error)}`)
      logger.updateStatus(`Failed: ${error instanceof Error ? error.message : String(error)}`, 'error')
      throw error
    }
  }
  
  /**
   * 将 base64 字符串转换为 Uint8Array
   */
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }


  // Interrupt conversation
  const handlePlayPause = async () => {
    if (!sdk.avatarView) {
      logger.updateStatus('No character loaded', 'warning')
      return
    }

    try {
      if (conversationState === 'playing') {
        // Pause if currently playing
        sdk.pause()
        logger.log('info', 'Playback paused')
        logger.updateStatus('Playback paused', 'info')
      } else if (conversationState === 'pausing' || conversationState === 'idle') {
        // Resume if paused or idle
        await sdk.resume()
        logger.log('info', 'Playback resumed')
        logger.updateStatus('Playback resumed', 'info')
      }
    } catch (error) {
      logger.log('error', `Play/Pause failed: ${error instanceof Error ? error.message : String(error)}`)
      logger.updateStatus(`Play/Pause failed: ${error instanceof Error ? error.message : String(error)}`, 'error')
    }
  }

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
      
      const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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

    const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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
      const currentMode = AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk
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
      setConversationState(null)
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
        <h3>Avatar Panel {panelId}</h3>
        {onRemove && (
          <button className="btn-remove" onClick={onRemove} title="Remove Panel">
            ×
          </button>
        )}
      </div>
      
      <div className="avatar-panel-content">
        <div className="avatar-panel-controls">
          <StatusBar message={logger.statusMessage} type={logger.statusClass} />
          <ControlPanel
            environment={AvatarSDK.configuration?.environment || Environment.intl}
            characterId={characterId}
            isInitialized={globalSDKInitialized}
            avatarView={sdk.avatarView}
            avatarController={sdk.avatarController}
            isRecording={audioRecorder.isRecording}
            isLoading={isLoading}
            isConnected={sdk.isConnected}
            currentPlaybackMode={(AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk) === DrivingServiceMode.sdk ? 'network' : 'external'}
            conversationState={conversationState}
            isSendingAudio={isSendingAudio}
            characterIdList={characterIdList}
            onCharacterIdChange={(id) => {
              setCharacterId(id)
              // Add to list if not exists
              if (id && !characterIdList.includes(id)) {
                setCharacterIdList([...characterIdList, id])
              }
            }}
            onLoadCharacter={() => handleLoadCharacter()}
            onConnect={handleConnect}
            onLoadAudio={handleLoadAudio}
            onStartRecord={handleStartRecord}
            onStopRecord={handleStopRecord}
            onInterrupt={handleInterrupt}
            onDisconnect={handleDisconnect}
            onUnloadCharacter={handleUnloadCharacter}
          />
          <button 
            className="btn btn-primary" 
            onClick={toggleLogDrawer}
            style={{ marginTop: '12px' }}
          >
            {isLogDrawerOpen ? '📋 Hide Logs' : '📋 Show Logs'}
          </button>
        </div>
        <div className="avatar-panel-canvas">
          <AvatarCanvas 
            ref={canvasContainerRef} 
            avatarView={sdk.avatarView}
            showTransformButton={!!sdk.avatarView}
            volume={volume}
            onVolumeChange={(v) => {
              setVolume(v)
              try {
                sdk.setVolume(v / 100)
              } catch (error) {
                logger.updateStatus(`Volume change failed: ${error instanceof Error ? error.message : String(error)}`, 'error')
              }
            }}
            showVolumeSlider={!!sdk.avatarView}
            showPlayPauseButton={!!sdk.avatarView}
            playPauseIcon={conversationState === 'playing' ? '⏸️' : '▶️'}
            playPauseTitle={conversationState === 'playing' ? 'Pause' : (conversationState === 'pausing' ? 'Resume' : 'Play')}
            playPauseDisabled={conversationState === 'idle'}
            onPlayPauseClick={handlePlayPause}
            onTransformClick={() => {
              // Try to get current transform values, fallback to defaults
              if (sdk.avatarView?.transform) {
                try {
                  const currentTransform = sdk.avatarView.transform
                  setTransformX(String(currentTransform.x || 0))
                  setTransformY(String(currentTransform.y || 0))
                  setTransformScale(String(currentTransform.scale || 1))
                } catch (error) {
                  // Fallback to defaults if transform is not available
                  setTransformX('0')
                  setTransformY('0')
                  setTransformScale('1')
                }
              } else {
                setTransformX('0')
                setTransformY('0')
                setTransformScale('1')
              }
              setIsTransformModalOpen(true)
            }}
          />
        </div>
      </div>
      
      {/* Log Drawer */}
      <div className={`log-drawer ${isLogDrawerOpen ? 'open' : ''}`}>
        <div className="log-drawer-header">
          <h2>📋 Logs</h2>
          <button className="btn-close-drawer" onClick={closeLogDrawer} title="Close Log Panel">
            ×
          </button>
        </div>
        <LogPanel logs={logger.logs} onClear={logger.clear} />
      </div>
      
      {/* Load Audio Modal */}
      {showLoadAudioModal && (
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleCancelLoadAudio}
        >
          <div
            className="modal-content"
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              minWidth: '400px',
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Load Audio File</h3>
            <p style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
              Select an audio file to send to the avatar (PCM, MP3, or WAV format)
            </p>
            <input
              type="file"
              accept=".pcm,.mp3,.wav,audio/*"
              onChange={handleAudioFileChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelLoadAudio}
                style={{
                  padding: '8px 16px',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLoadAudio}
                disabled={!selectedAudioFile || isProcessing.loadAudio}
                style={{
                  padding: '8px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedAudioFile && !isProcessing.loadAudio ? 'pointer' : 'not-allowed',
                  opacity: selectedAudioFile && !isProcessing.loadAudio ? 1 : 0.6,
                }}
              >
                Load
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Transform Settings Modal */}
      {isTransformModalOpen && (
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsTransformModalOpen(false)
            }
          }}
        >
          <div 
            className="modal-content"
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              minWidth: '400px',
              maxWidth: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Transform Settings</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                X Position (-1 to 1)
              </label>
              <input
                type="number"
                step="0.1"
                min="-1"
                max="1"
                value={transformX}
                onChange={(e) => setTransformX(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsTransformModalOpen(false)
                  } else if (e.key === 'Enter') {
                    handleApplyTransform()
                  }
                }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                -1 = left edge, 0 = center, 1 = right edge
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Y Position (-1 to 1)
              </label>
              <input
                type="number"
                step="0.1"
                min="-1"
                max="1"
                value={transformY}
                onChange={(e) => setTransformY(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsTransformModalOpen(false)
                  } else if (e.key === 'Enter') {
                    handleApplyTransform()
                  }
                }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                -1 = bottom edge, 0 = center, 1 = top edge
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Scale Factor
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={transformScale}
                onChange={(e) => setTransformScale(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsTransformModalOpen(false)
                  } else if (e.key === 'Enter') {
                    handleApplyTransform()
                  }
                }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                1.0 = original size, 2.0 = double size, 0.5 = half size
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsTransformModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTransform}
                style={{
                  padding: '8px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  
  function handleApplyTransform() {
    if (!sdk.avatarView) {
      logger.updateStatus('Please load character first', 'warning')
      return
    }
    
    try {
      const x = parseFloat(transformX)
      const y = parseFloat(transformY)
      const scale = parseFloat(transformScale)
      
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
      if (!sdk.avatarView.transform) {
        throw new Error('transform property is not available in this SDK version')
      }
      sdk.avatarView.transform = { x, y, scale }
      logger.log('success', `Transform applied: x=${x}, y=${y}, scale=${scale}`)
      logger.updateStatus(`Transform applied: x=${x}, y=${y}, scale=${scale}`, 'success')
      setIsTransformModalOpen(false)
      setTransformX('0')
      setTransformY('0')
      setTransformScale('1')
    } catch (error) {
      logger.log('error', `Transform failed: ${error instanceof Error ? error.message : String(error)}`)
      logger.updateStatus(`Transform failed: ${error instanceof Error ? error.message : String(error)}`, 'error')
    }
  }
}

