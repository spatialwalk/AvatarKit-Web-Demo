/**
 * Main application component
 * Integrates all Hooks and components
 */

import { useState, useRef, useEffect } from 'react'
import { useAvatarSDK } from './hooks/useAvatarSDK'
import { Environment } from './types'
import { useLogger } from './hooks/useLogger'
import { useAudioRecorder } from './hooks/useAudioRecorder'
import { StatusBar } from './components/StatusBar'
import { ControlPanel } from './components/ControlPanel'
import { LogPanel } from './components/LogPanel'
import { AvatarCanvas } from './components/AvatarCanvas'
import './App.css'

function App() {
  // Configuration state
  const [environment, setEnvironment] = useState<Environment>(Environment.test)
  const [characterId, setCharacterId] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Hooks
  const logger = useLogger()
  const audioRecorder = useAudioRecorder()
  const sdk = useAvatarSDK()

  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Initialize SDK
  const handleInit = async () => {
    try {
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
    }
  }

  // Load character
  const handleLoadCharacter = async () => {
    if (!sdk.isInitialized || !characterId.trim()) {
      logger.updateStatus('Please initialize SDK and enter character ID', 'warning')
      return
    }

    if (!canvasContainerRef.current) {
      logger.updateStatus('Canvas container not found', 'error')
      return
    }

    try {
      setIsLoading(true)
      logger.updateStatus('Loading character...', 'info')
      logger.log('info', `Starting to load character: ${characterId}`)

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
    } catch (error) {
      logger.updateStatus(
        `Load failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `Load failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Connect service
  const handleConnect = async () => {
    try {
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
    }
  }

  // Start recording
  const handleStartRecord = async () => {
    if (!sdk.avatarController) {
      logger.updateStatus('Please connect to service first', 'warning')
      return
    }

    try {
      setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  // Stop recording
  const handleStopRecord = async () => {
    try {
      setIsLoading(true)
      const audioBuffer = await audioRecorder.stop()

      if (audioBuffer && sdk.avatarController) {
        const duration = (audioBuffer.byteLength / 2 / 16000).toFixed(2)
        logger.log('info', `Recording completed, total length: ${audioBuffer.byteLength} bytes (${duration}s, 16kHz PCM16)`)
        sdk.sendAudio(audioBuffer, true)
        logger.log('success', 'Complete audio data sent')
      } else if (!audioBuffer) {
        logger.log('warning', 'No audio data collected')
      }

      logger.updateStatus('Recording stopped', 'info')
      logger.log('success', 'Recording stopped')
    } catch (error) {
      logger.log('error', `Stop recording failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Interrupt conversation
  const handleInterrupt = () => {
    try {
      sdk.interrupt()
      logger.updateStatus('Current conversation interrupted', 'info')
      logger.log('info', 'Current conversation interrupted')
    } catch (error) {
      logger.updateStatus(
        `Interrupt failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `Interrupt failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Disconnect
  const handleDisconnect = async () => {
    try {
      if (audioRecorder.isRecording) {
      await handleStopRecord()
    }
    
      await sdk.disconnect()
      logger.updateStatus('Disconnected', 'info')
      logger.log('info', 'Disconnected')
    } catch (error) {
      logger.log('error', `Disconnect failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Unload character
  const handleUnloadCharacter = () => {
    try {
      sdk.unloadCharacter()
      logger.updateStatus('Character unloaded', 'info')
      logger.log('info', 'Character unloaded, can reload new character')
    } catch (error) {
      logger.log('error', `Unload character failed: ${error instanceof Error ? error.message : String(error)}`)
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
        <StatusBar message={logger.statusMessage} type={logger.statusClass} />

        <ControlPanel
          environment={environment}
          characterId={characterId}
          sessionToken={sessionToken}
          isInitialized={sdk.isInitialized}
          avatarView={sdk.avatarView}
          avatarController={sdk.avatarController}
          isRecording={audioRecorder.isRecording}
          isLoading={isLoading}
          onEnvironmentChange={setEnvironment}
          onCharacterIdChange={setCharacterId}
          onSessionTokenChange={setSessionToken}
          onInit={handleInit}
          onLoadCharacter={handleLoadCharacter}
          onConnect={handleConnect}
          onStartRecord={handleStartRecord}
          onStopRecord={handleStopRecord}
          onInterrupt={handleInterrupt}
          onDisconnect={handleDisconnect}
          onUnloadCharacter={handleUnloadCharacter}
        />

        <AvatarCanvas ref={canvasContainerRef} />

        <LogPanel logs={logger.logs} onClear={logger.clearLogs} />
      </div>
    </div>
  )
}

export default App
