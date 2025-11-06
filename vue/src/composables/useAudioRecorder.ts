/**
 * 音频录制 Composable
 * 使用 ScriptProcessorNode 实现（与 Vanilla 版本相同的方案）
 */

import { ref, onUnmounted } from 'vue'
import { mergeAudioChunks, resampleAudio, convertToInt16PCM, convertToUint8Array } from '../utils/audioUtils'

export function useAudioRecorder() {
  const isRecording = ref(false)
  const audioContextRef = ref<AudioContext | null>(null)
  const scriptProcessorRef = ref<ScriptProcessorNode | null>(null)
  const mediaStreamRef = ref<MediaStream | null>(null)
  const audioChunksRef = ref<Array<{ data: Float32Array }>>([])
  const actualSampleRateRef = ref(16000)
  const isRecordingFlagRef = ref(false)

  const start = async () => {
    try {
      // 如果已经在录音，先停止
      if (isRecordingFlagRef.value) {
        await stop()
        // 等待一小段时间确保状态更新完成
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      // 清空之前的录音数据
      audioChunksRef.value = []

      // 创建 AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      })
      audioContextRef.value = audioContext
      actualSampleRateRef.value = audioContext.sampleRate

      // 获取音频流
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      })

      mediaStreamRef.value = stream

      // 创建 ScriptProcessorNode
      const bufferSize = 4096
      const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1)
      scriptProcessorRef.value = scriptProcessor

      // 创建 GainNode 静音输出
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0

      // 连接音频节点
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(scriptProcessor)
      scriptProcessor.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // 先设置标志，再设置回调函数
      isRecordingFlagRef.value = true

      // 设置回调函数
      scriptProcessor.onaudioprocess = (event) => {
        if (!isRecordingFlagRef.value) return

        const inputData = event.inputBuffer.getChannelData(0)
        audioChunksRef.value.push({
          data: new Float32Array(inputData),
        })
      }

      // 最后更新 Vue 状态
      isRecording.value = true
    } catch (error) {
      isRecordingFlagRef.value = false
      isRecording.value = false
      throw new Error(`录音启动失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const stop = async (): Promise<ArrayBuffer | null> => {
    try {
      isRecordingFlagRef.value = false
      isRecording.value = false

      // 断开 ScriptProcessorNode
      if (scriptProcessorRef.value) {
        scriptProcessorRef.value.disconnect()
        scriptProcessorRef.value = null
      }

      // 停止流
      if (mediaStreamRef.value) {
        mediaStreamRef.value.getTracks().forEach((track) => track.stop())
        mediaStreamRef.value = null
      }

      const currentSampleRate = actualSampleRateRef.value

      // 关闭 AudioContext
      if (audioContextRef.value) {
        try {
          const state = audioContextRef.value.state as string
          if (state !== 'closed' && state !== 'closing') {
            await audioContextRef.value.close()
          }
        } catch (err) {
          // 静默处理关闭错误
        } finally {
          audioContextRef.value = null
        }
      }

      // 处理音频数据
      if (audioChunksRef.value.length === 0) {
        return null
      }

      // 1. 合并所有 Float32Array 数据
      const mergedFloat32 = mergeAudioChunks(audioChunksRef.value)

      // 2. 重采样到 16kHz（如果需要）
      let finalAudio = mergedFloat32
      if (currentSampleRate !== 16000) {
        finalAudio = resampleAudio(mergedFloat32, currentSampleRate, 16000)
      }

      // 3. 转换为 Int16 PCM
      const pcm16 = convertToInt16PCM(finalAudio)

      // 4. 转换为 Uint8Array
      const mergedAudio = convertToUint8Array(pcm16)

      // 清空缓存
      audioChunksRef.value = []

      return mergedAudio.buffer as ArrayBuffer
    } catch (error) {
      throw new Error(`停止录音失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const cleanup = () => {
    if (isRecordingFlagRef.value) {
      stop().catch(() => {})
    }
  }

  // 组件卸载时清理
  onUnmounted(() => {
    // 只清理资源，不更新状态（组件已卸载，更新状态无意义且会报错）
    if (isRecordingFlagRef.value) {
      isRecordingFlagRef.value = false
      // 清理资源但不处理数据
      if (scriptProcessorRef.value) {
        scriptProcessorRef.value.disconnect()
        scriptProcessorRef.value = null
      }
      if (mediaStreamRef.value) {
        mediaStreamRef.value.getTracks().forEach((track) => track.stop())
        mediaStreamRef.value = null
      }
      if (audioContextRef.value) {
        audioContextRef.value.close().catch(() => {})
        audioContextRef.value = null
      }
    }
  })

  return {
    isRecording,
    start,
    stop,
    cleanup,
  }
}

