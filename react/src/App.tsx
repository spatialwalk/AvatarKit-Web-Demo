/**
 * 主应用组件
 * 整合所有 Hooks 和组件
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
  // 配置状态
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

  // 初始化 SDK
  const handleInit = async () => {
    try {
      setIsLoading(true)
      logger.updateStatus('正在初始化 SDK...', 'info')
      logger.log('info', '正在初始化 SDK...')

      await sdk.initialize(environment, sessionToken || undefined)

      logger.updateStatus('SDK 初始化成功', 'success')
      logger.log('success', 'SDK 初始化成功')
    } catch (error) {
      logger.updateStatus(
        `初始化失败: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `初始化失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 加载角色
  const handleLoadCharacter = async () => {
    if (!sdk.isInitialized || !characterId.trim()) {
      logger.updateStatus('请先初始化 SDK 并输入角色 ID', 'warning')
      return
    }

    if (!canvasContainerRef.current) {
      logger.updateStatus('Canvas 容器未找到', 'error')
      return
    }

    try {
      setIsLoading(true)
      logger.updateStatus('正在加载角色...', 'info')
      logger.log('info', `开始加载角色: ${characterId}`)

      await sdk.loadCharacter(
        characterId,
        canvasContainerRef.current,
        {
          onConnectionState: (state: string) => {
            logger.log('info', `连接状态: ${state}`)
            if (state === 'connected') {
              logger.updateStatus('已连接', 'success')
            } else if (state === 'disconnected') {
              logger.updateStatus('已断开', 'info')
            }
          },
          onAvatarState: (state: string) => {
            logger.log('info', `角色状态: ${state}`)
          },
          onError: (error: Error) => {
            logger.log('error', `错误: ${error.message}`)
            logger.updateStatus(`错误: ${error.message}`, 'error')
          },
        },
      )

      logger.updateStatus('角色加载成功', 'success')
      logger.log('success', '角色加载成功')
    } catch (error) {
      logger.updateStatus(
        `加载失败: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `加载失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 连接服务
  const handleConnect = async () => {
    try {
      setIsLoading(true)
      logger.updateStatus('正在连接服务...', 'info')
      logger.log('info', '正在连接服务...')

      await sdk.connect()

      logger.updateStatus('连接成功', 'success')
      logger.log('success', '连接成功')
    } catch (error) {
      logger.updateStatus(
        `连接失败: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `连接失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 开始录音
  const handleStartRecord = async () => {
    if (!sdk.avatarController) {
      logger.updateStatus('请先连接服务', 'warning')
      return
    }

    try {
      setIsLoading(true)
      logger.log('info', '开始录音...')

      await audioRecorder.start()

      logger.updateStatus('正在录音...', 'success')
      logger.log('success', '录音已开始')
    } catch (error) {
      logger.updateStatus(
        `录音失败: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `录音失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 停止录音
  const handleStopRecord = async () => {
    try {
      setIsLoading(true)
      const audioBuffer = await audioRecorder.stop()

      if (audioBuffer && sdk.avatarController) {
        const duration = (audioBuffer.byteLength / 2 / 16000).toFixed(2)
        logger.log('info', `录音完成，总长度: ${audioBuffer.byteLength} bytes (${duration}秒，16kHz PCM16)`)
        sdk.sendAudio(audioBuffer, true)
        logger.log('success', '已一次性发送完整音频数据')
      } else if (!audioBuffer) {
        logger.log('warning', '未收集到音频数据')
      }

      logger.updateStatus('录音已停止', 'info')
      logger.log('success', '录音已停止')
    } catch (error) {
      logger.log('error', `停止录音失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 打断对话
  const handleInterrupt = () => {
    try {
      sdk.interrupt()
      logger.updateStatus('已打断当前对话', 'info')
      logger.log('info', '已打断当前对话')
    } catch (error) {
      logger.updateStatus(
        `打断失败: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      )
      logger.log('error', `打断失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 断开连接
  const handleDisconnect = async () => {
    try {
      if (audioRecorder.isRecording) {
      await handleStopRecord()
    }
    
      await sdk.disconnect()
      logger.updateStatus('已断开连接', 'info')
      logger.log('info', '已断开连接')
    } catch (error) {
      logger.log('error', `断开连接失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 卸载角色
  const handleUnloadCharacter = () => {
    try {
      sdk.unloadCharacter()
      logger.updateStatus('角色已卸载', 'info')
      logger.log('info', '角色已卸载，可以重新加载新角色')
    } catch (error) {
      logger.log('error', `卸载角色失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 组件卸载时清理音频录制器
  useEffect(() => {
    return () => {
      audioRecorder.cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 空依赖数组，只在组件卸载时执行

  return (
    <div className="container">
      <div className="header">
        <h1>🚀 SPAvatar SDK - React 示例</h1>
        <p>使用 React Hooks 集成 SDK</p>
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
