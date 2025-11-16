/**
 * Main application component
 * Integrates all Hooks and components
 */

import { useState, useRef, useEffect } from 'react'
import { useAvatarSDK } from './hooks/useAvatarSDK'
import { Environment } from './types'
import { AvatarPlaybackMode } from '@spatialwalk/avatarkit'
import { useLogger } from './hooks/useLogger'
import { useAudioRecorder } from './hooks/useAudioRecorder'
import { StatusBar } from './components/StatusBar'
import { ControlPanel } from './components/ControlPanel'
import { LogPanel } from './components/LogPanel'
import { AvatarCanvas } from './components/AvatarCanvas'
import { resampleAudioWithWebAudioAPI, convertToInt16PCM, convertToUint8Array } from './utils/audioUtils'
import './App.css'

const AUDIO_SAMPLE_RATE = 16000

function App() {
  // Configuration state
  const [environment, setEnvironment] = useState<Environment>(Environment.test)
  const [characterId, setCharacterId] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [playbackMode, setPlaybackMode] = useState<AvatarPlaybackMode>(AvatarPlaybackMode.network)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPlaybackMode, setCurrentPlaybackMode] = useState<AvatarPlaybackMode>(AvatarPlaybackMode.network)
  
  // Operation state flags to prevent repeated clicks
  const [isProcessing, setIsProcessing] = useState({
    init: false,
    loadCharacter: false,
    connect: false,
    startRecord: false,
    stopRecord: false,
    interrupt: false,
    disconnect: false,
    unload: false,
  })

  // Hooks
  const logger = useLogger()
  const audioRecorder = useAudioRecorder()
  const sdk = useAvatarSDK()

  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Initialize SDK
  const handleInit = async () => {
    if (isProcessing.init || sdk.isInitialized) {
      return
    }

    try {
      setIsProcessing(prev => ({ ...prev, init: true }))
      setIsLoading(true)
      logger.updateStatus('Initializing SDK...', 'info')
      logger.log('info', 'Initializing SDK...')

      await sdk.initialize(environment, sessionToken || undefined)

      logger.updateStatus('SDK initialized successfully', 'success')
      logger.log('success', 'SDK initialized successfully')
    } catch (error) {
      logger.updateStatus(
        `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
      setIsProcessing(prev => ({ ...prev, init: false }))
    }
  }

  // Load character
  const handleLoadCharacter = async (mode: AvatarPlaybackMode) => {
    if (isProcessing.loadCharacter || sdk.avatarView) {
      return
    }

    if (!sdk.isInitialized || !characterId.trim()) {
      logger.updateStatus('Please initialize SDK and enter character ID', 'warning')
      return
    }

    if (!canvasContainerRef.current) {
      logger.updateStatus('Canvas container not found', 'error')
      return
    }

    try {
      setIsProcessing(prev => ({ ...prev, loadCharacter: true }))
      setIsLoading(true)
      setCurrentPlaybackMode(mode)
      logger.updateStatus(`Loading character (${mode === AvatarPlaybackMode.network ? 'network' : 'external'} mode)...`, 'info')
      logger.log('info', `Starting to load character: ${characterId} (mode: ${mode === AvatarPlaybackMode.network ? 'network' : 'external'})`)

      await sdk.loadCharacter(
        characterId,
        canvasContainerRef.current,
        mode,
        {
          onConnectionState: (state: string) => {
            logger.log('info', `Connection state: ${state}`)
            if (state === 'connected') {
              logger.updateStatus('Connected', 'success')
            } else if (state === 'disconnected') {
              logger.updateStatus('Disconnected', 'info')
            }
          },
          onAvatarState: (state: string) => {
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
      
      // Use requestAnimationFrame to ensure avatarView state is updated before clearing isLoading
      // This prevents the Connect button from flickering
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

    if (currentPlaybackMode !== AvatarPlaybackMode.network) {
      logger.updateStatus('Connect is only available in network mode', 'warning')
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
      // Connection state will be updated via onConnectionState callback; no need to set it here

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

    if (currentPlaybackMode !== AvatarPlaybackMode.network) {
      logger.updateStatus('Recording is only available in network mode', 'warning')
      return
    }
    
    if (!sdk.avatarController || !sdk.isConnected) {
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
      // Clear processing flag immediately after starting recording; recording itself is a long-running state
      setIsProcessing(prev => ({ ...prev, startRecord: false }))
    }
  }

  // Stop recording / Play external data
  const handleStopRecord = async () => {
    if (isProcessing.stopRecord) {
      return
    }

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
      
      if (currentPlaybackMode === AvatarPlaybackMode.network) {
        // Network mode: stop recording and send audio (fast operation, no need to use isLoading)
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
        // External data mode: load and play data from files
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
    // If already playing, interrupt first so we can replay safely
    if (sdk.avatarView?.controller) {
      try {
        sdk.interrupt()
        // Wait briefly for the interrupt to take effect
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (e) {
        // Ignore errors if interrupt fails (may already be stopped)
      }
    }

    try {
      // Only set isLoading while loading files
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
      
      // Load audio file (24kHz PCM16, need to resample to 16kHz)
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
      
      // Resample from 24kHz to 16kHz using Web Audio API
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
      
      // After files are loaded, clear isLoading and start streaming data asynchronously (non-blocking)
      setIsLoading(false)
      logger.updateStatus('Playing external data...', 'info')
      
      // Calculate send rate: at least 2x playback speed
      const playbackRateBytesPerSecond = AUDIO_SAMPLE_RATE * 2 * 2
      const sendInterval = 50 // 50ms per send
      const bytesPerInterval = Math.floor(playbackRateBytesPerSecond * sendInterval / 1000)
      
      // Prepare initial data (at least 1 second)
      const initialDataSize = playbackRateBytesPerSecond
      const initialAudioChunks: Array<{ data: Uint8Array; isLast: boolean }> = []
      let audioOffset = 0
      
      while (audioOffset < initialDataSize && audioOffset < audioData.length) {
        const chunkEnd = Math.min(audioOffset + bytesPerInterval, audioData.length, initialDataSize)
        const chunk = audioData.slice(audioOffset, chunkEnd)
        const isLast = chunkEnd >= audioData.length && chunkEnd >= initialDataSize
        initialAudioChunks.push({ data: chunk, isLast })
        audioOffset = chunkEnd
      }
      
      // Prepare initial keyframes (about 1 second at 30fps)
      const initialKeyframes = keyframes.slice(0, Math.min(30, keyframes.length))
      
      // Start playback with initial data
      await sdk.play(initialAudioChunks, initialKeyframes)
      
      // Continue sending remaining audio data (at 2x speed) asynchronously
      // Use Promise without awaiting so buttons remain responsive
      Promise.resolve().then(async () => {
        while (audioOffset < audioData.length) {
          const chunkEnd = Math.min(audioOffset + bytesPerInterval, audioData.length)
          const chunk = audioData.slice(audioOffset, chunkEnd)
          const isLast = chunkEnd >= audioData.length
          
          sdk.sendAudioChunk(chunk, isLast)
          audioOffset = chunkEnd
          
          await new Promise(resolve => setTimeout(resolve, sendInterval))
        }
        
        // Send remaining keyframes
        if (keyframes.length > initialKeyframes.length) {
          const remainingKeyframes = keyframes.slice(initialKeyframes.length)
          sdk.sendKeyframes(remainingKeyframes)
        }
        
        logger.log('success', `External data mode: all data sent (${audioData.length} bytes audio, ${keyframes.length} keyframes)`)
      })
      
      logger.updateStatus('External data playback started', 'success')
    } catch (error) {
      setIsLoading(false)
      throw new Error(`External data mode failed: ${error instanceof Error ? error.message : String(error)}`)
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

    if (currentPlaybackMode !== AvatarPlaybackMode.network) {
      logger.updateStatus('Disconnect is only available in network mode', 'warning')
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
      // Connection state will be updated via onConnectionState callback; no need to set it here
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
      // Don't set isLoading - unload is synchronous and fast
      // Setting isLoading would cause other buttons (Connect, Record, etc.) to flicker unnecessarily

      // If recording, stop first
      if (audioRecorder.isRecording) {
        audioRecorder.stop().catch(() => {
          // Ignore errors when stopping recording
        })
      }

      // If connected, disconnect first
      if (sdk.isConnected) {
        sdk.disconnect().catch(() => {
          // Ignore errors when disconnecting
        })
      }

      sdk.unloadCharacter()
      logger.updateStatus('Character unloaded', 'info')
      logger.log('info', 'Character unloaded, can reload new character')
    } catch (error) {
      logger.log('error', `Unload character failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsProcessing(prev => ({ ...prev, unload: false }))
    }
  }

  // Cleanup audio recorder on component unmount
  useEffect(() => {
    return () => {
      audioRecorder.cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array, only executed on component unmount

  return (
    <div className="container">
      <div className="header">
        <h1>🚀 SPAvatar SDK - React Example</h1>
        <p>Integrate SDK using React Hooks</p>
      </div>

      <div className="content">
        <div className="left-panel">
          <AvatarCanvas ref={canvasContainerRef} />
        </div>
        <div className="right-panel">
          <StatusBar message={logger.statusMessage} type={logger.statusClass} />

          <ControlPanel
            environment={environment}
            characterId={characterId}
            sessionToken={sessionToken}
            playbackMode={playbackMode}
            isInitialized={sdk.isInitialized}
            avatarView={sdk.avatarView}
            avatarController={sdk.avatarController}
            isRecording={audioRecorder.isRecording}
            isLoading={isLoading}
            isConnected={sdk.isConnected}
            currentPlaybackMode={currentPlaybackMode}
            onEnvironmentChange={setEnvironment}
            onCharacterIdChange={setCharacterId}
            onSessionTokenChange={setSessionToken}
            onPlaybackModeChange={setPlaybackMode}
            onInit={handleInit}
            onLoadCharacter={handleLoadCharacter}
            onConnect={handleConnect}
            onStartRecord={handleStartRecord}
            onStopRecord={handleStopRecord}
            onInterrupt={handleInterrupt}
            onDisconnect={handleDisconnect}
            onUnloadCharacter={handleUnloadCharacter}
          />

          <div className="control-panel log-panel-container">
            <h2>📋 Logs</h2>
            <LogPanel logs={logger.logs} onClear={logger.clearLogs} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
