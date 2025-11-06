<template>
  <div class="container">
    <div class="header">
      <h1>🚀 SPAvatar SDK - Vue 示例</h1>
      <p>使用 Vue 3 Composition API 集成 SDK</p>
    </div>

    <div class="content">
      <StatusBar :message="logger.statusMessage.value" :type="logger.statusClass.value" />

      <ControlPanel
        :environment="environment"
        :character-id="characterId"
        :session-token="sessionToken"
        :is-initialized="sdk.isInitialized.value"
        :avatar-view="sdk.avatarView.value"
        :avatar-controller="sdk.avatarController.value"
        :is-recording="audioRecorder.isRecording.value"
        :is-loading="isLoading"
        @environment-change="handleEnvironmentChange"
        @character-id-change="handleCharacterIdChange"
        @session-token-change="handleSessionTokenChange"
        @init="handleInit"
        @load-character="handleLoadCharacter"
        @connect="handleConnect"
        @start-record="handleStartRecord"
        @stop-record="handleStopRecord"
        @interrupt="handleInterrupt"
        @disconnect="handleDisconnect"
        @unload-character="handleUnloadCharacter"
      />

      <AvatarCanvas ref="avatarCanvasRef" />

      <LogPanel :logs="logger.logs.value" @clear="logger.clearLogs" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useAvatarSDK } from './composables/useAvatarSDK'
import { Environment } from './types'
import { useLogger } from './composables/useLogger'
import { useAudioRecorder } from './composables/useAudioRecorder'
import StatusBar from './components/StatusBar.vue'
import ControlPanel from './components/ControlPanel.vue'
import LogPanel from './components/LogPanel.vue'
import AvatarCanvas from './components/AvatarCanvas.vue'

// 配置状态
const environment = ref<Environment>(Environment.test)
const characterId = ref('')
const sessionToken = ref('')
const isLoading = ref(false)

// Composables
const logger = useLogger()
const audioRecorder = useAudioRecorder()
const sdk = useAvatarSDK()

// Refs
const avatarCanvasRef = ref<InstanceType<typeof AvatarCanvas> | null>(null)

// 初始化 SDK
const handleInit = async () => {
  try {
    isLoading.value = true
    logger.updateStatus('正在初始化 SDK...', 'info')
    logger.log('info', '正在初始化 SDK...')

    await sdk.initialize(environment.value, sessionToken.value || undefined)

    logger.updateStatus('SDK 初始化成功', 'success')
    logger.log('success', 'SDK 初始化成功')
  } catch (error) {
    logger.updateStatus(
      `初始化失败: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    )
    logger.log('error', `初始化失败: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isLoading.value = false
  }
}

// 加载角色
const handleLoadCharacter = async () => {
  if (!sdk.isInitialized.value || !characterId.value.trim()) {
    logger.updateStatus('请先初始化 SDK 并输入角色 ID', 'warning')
    return
  }

  const canvasContainer = avatarCanvasRef.value?.canvasContainerRef
  if (!canvasContainer) {
    logger.updateStatus('Canvas 容器未找到', 'error')
    return
  }

  try {
    isLoading.value = true
    logger.updateStatus('正在加载角色...', 'info')
    logger.log('info', `开始加载角色: ${characterId.value}`)

    await sdk.loadCharacter(
      characterId.value,
      canvasContainer,
      {
        onConnectionState: (state) => {
          logger.log('info', `连接状态: ${state}`)
          if (state === 'connected') {
            logger.updateStatus('已连接', 'success')
          } else if (state === 'disconnected') {
            logger.updateStatus('已断开', 'info')
          }
        },
        onAvatarState: (state) => {
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
    isLoading.value = false
  }
}

// 连接服务
const handleConnect = async () => {
  try {
    isLoading.value = true
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
    isLoading.value = false
  }
}

// 开始录音
const handleStartRecord = async () => {
  if (!sdk.avatarController.value) {
    logger.updateStatus('请先连接服务', 'warning')
    return
  }

  try {
    isLoading.value = true
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
    isLoading.value = false
  }
}

// 停止录音
const handleStopRecord = async () => {
  try {
    isLoading.value = true
    const audioBuffer = await audioRecorder.stop()

    if (audioBuffer && sdk.avatarController.value) {
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
    isLoading.value = false
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
    if (audioRecorder.isRecording.value) {
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

// 事件处理
const handleEnvironmentChange = (env: Environment) => {
  environment.value = env
}

const handleCharacterIdChange = (id: string) => {
  characterId.value = id
}

const handleSessionTokenChange = (token: string) => {
  sessionToken.value = token
}

// 组件卸载时清理
onUnmounted(() => {
  audioRecorder.cleanup()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0 0 10px 0;
  color: #333;
}

.header p {
  color: #666;
  margin: 0;
}
</style>
