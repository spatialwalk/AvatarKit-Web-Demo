/**
 * 音频录制功能
 * 处理麦克风录音和音频数据处理
 */

import { resampleAudio, convertToInt16PCM, convertToUint8Array, mergeAudioChunks } from '../utils/audioUtils.js'

/**
 * 音频录制器类
 */
export class AudioRecorder {
  constructor() {
    this.audioContext = null
    this.scriptProcessor = null
    this.mediaStream = null
    this.isRecording = false
    this.recordedAudioChunks = []
    this.actualSampleRate = 16000
  }

  /**
   * 开始录音
   * @returns {Promise<void>}
   */
  async start() {
    try {
      // 如果已经在录音，先停止之前的录音
      if (this.isRecording) {
        await this.stop()
      }

      // 清理之前的资源（防止残留）
      if (this.scriptProcessor) {
        try {
          this.scriptProcessor.disconnect()
        } catch (e) {
          // 忽略错误
        }
        this.scriptProcessor = null
      }

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop())
        this.mediaStream = null
      }

      if (this.audioContext) {
        try {
          if (this.audioContext.state !== 'closed' && this.audioContext.state !== 'closing') {
            await this.audioContext.close()
          }
        } catch (e) {
          // 忽略错误
        }
        this.audioContext = null
      }

      // 清空之前的录音数据
      this.recordedAudioChunks = []

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      })

      this.actualSampleRate = this.audioContext.sampleRate

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false, // 禁用自动增益控制
        },
      })

      this.mediaStream = stream
      const bufferSize = 4096
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1)

      // 使用 GainNode 将音量设为 0，避免产生音频反馈
      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = 0 // 静音，避免反馈

      const source = this.audioContext.createMediaStreamSource(stream)
      source.connect(this.scriptProcessor)
      this.scriptProcessor.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.isRecording) return
        const inputData = event.inputBuffer.getChannelData(0)
        const float32Data = new Float32Array(inputData)
        
        // 保存音频数据
        this.recordedAudioChunks.push({
          data: float32Data,
        })
      }

      this.isRecording = true

      return Promise.resolve()
    } catch (error) {
      throw new Error(`录音启动失败: ${error.message}`)
    }
  }

  /**
   * 停止录音并处理音频数据
   * @returns {Promise<ArrayBuffer>} 处理后的音频数据
   */
  async stop() {
    try {
      // 先停止录音标志，防止 onaudioprocess 继续添加数据
      this.isRecording = false

      // 清理录音资源
      if (this.scriptProcessor) {
        try {
          this.scriptProcessor.disconnect()
        } catch (e) {
          // 忽略错误
        }
        this.scriptProcessor = null
      }

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop())
        this.mediaStream = null
      }

      if (this.audioContext) {
        try {
          if (this.audioContext.state !== 'closed' && this.audioContext.state !== 'closing') {
            await this.audioContext.close()
          }
        } catch (err) {
          console.warn('关闭 AudioContext 时出错:', err)
        } finally {
          this.audioContext = null
        }
      }

      // 处理音频数据
      if (this.recordedAudioChunks.length === 0) {
        return null
      }

      const currentSampleRate = this.actualSampleRate

      // 1. 合并所有 Float32Array 数据
      const mergedFloat32 = mergeAudioChunks(this.recordedAudioChunks)

      // 2. 重采样到 16kHz（如果需要）
      let finalAudio = mergedFloat32
      if (currentSampleRate !== 16000) {
        finalAudio = resampleAudio(mergedFloat32, currentSampleRate, 16000)
      }

      // 3. 转换为 Int16 PCM
      const pcm16 = convertToInt16PCM(finalAudio)

      // 4. 转换为 Uint8Array（确保正确的字节序）
      const mergedAudio = convertToUint8Array(pcm16)

      // 清空缓存
      this.recordedAudioChunks = []

      return mergedAudio.buffer
    } catch (error) {
      console.error(`[AudioRecorder] stop() 出错:`, error)
      throw new Error(`停止录音失败: ${error.message}`)
    }
  }

  /**
   * 获取录音时长（秒）
   * @returns {number} 录音时长
   */
  getDuration() {
    const totalSamples = this.recordedAudioChunks.reduce((sum, chunk) => sum + chunk.data.length, 0)
    return (totalSamples / this.actualSampleRate).toFixed(2)
  }
}

