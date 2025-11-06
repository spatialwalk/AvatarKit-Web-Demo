/**
 * 音频录制 Hook
 * 使用 ScriptProcessorNode 实现（与 Vanilla 版本相同的方案）
 */

import { useState, useRef, useEffect } from 'react'
import { mergeAudioChunks, resampleAudio, convertToInt16PCM, convertToUint8Array } from '../utils/audioUtils'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Array<{ data: Float32Array }>>([])
  const actualSampleRateRef = useRef(16000)
  const isRecordingFlagRef = useRef(false)

  const start = async () => {
    try {
      // 如果已经在录音，先停止
      if (isRecordingFlagRef.current) {
        await stop()
        // 等待一小段时间确保状态更新完成
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      // 清空之前的录音数据
      audioChunksRef.current = []

      // 创建 AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      })
      audioContextRef.current = audioContext
      actualSampleRateRef.current = audioContext.sampleRate

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

      mediaStreamRef.current = stream

      // 创建 ScriptProcessorNode
      const bufferSize = 4096
      const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1)
      scriptProcessorRef.current = scriptProcessor

      // 创建 GainNode 静音输出
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0

      // 连接音频节点
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(scriptProcessor)
      scriptProcessor.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // 先设置标志，再设置回调函数
      isRecordingFlagRef.current = true
      
      // 设置回调函数
      scriptProcessor.onaudioprocess = (event) => {
        if (!isRecordingFlagRef.current) return
        
        const inputData = event.inputBuffer.getChannelData(0)
        audioChunksRef.current.push({
          data: new Float32Array(inputData),
        })
      }

      // 最后更新 React 状态
      setIsRecording(true)
    } catch (error) {
      isRecordingFlagRef.current = false
      setIsRecording(false)
      throw new Error(`录音启动失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const stop = async (): Promise<ArrayBuffer | null> => {
    try {
      isRecordingFlagRef.current = false
      setIsRecording(false)

      // 断开 ScriptProcessorNode
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect()
        scriptProcessorRef.current = null
      }

      // 停止流
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }

      const currentSampleRate = actualSampleRateRef.current

      // 关闭 AudioContext
      if (audioContextRef.current) {
        try {
          const state = audioContextRef.current.state as string
          if (state !== 'closed' && state !== 'closing') {
            await audioContextRef.current.close()
          }
        } catch (err) {
          // 静默处理关闭错误
        } finally {
          audioContextRef.current = null
        }
      }

      // 处理音频数据
      if (audioChunksRef.current.length === 0) {
        return null
      }

      // 1. 合并所有 Float32Array 数据
      const mergedFloat32 = mergeAudioChunks(audioChunksRef.current)

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
      audioChunksRef.current = []

      return mergedAudio.buffer as ArrayBuffer
    } catch (error) {
      throw new Error(`停止录音失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const cleanup = () => {
    if (isRecordingFlagRef.current) {
      stop().catch(() => {})
    }
  }

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 只清理资源，不更新状态（组件已卸载，更新状态无意义且会报错）
      if (isRecordingFlagRef.current) {
        isRecordingFlagRef.current = false
        // 清理资源但不处理数据
        if (scriptProcessorRef.current) {
          scriptProcessorRef.current.disconnect()
          scriptProcessorRef.current = null
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop())
          mediaStreamRef.current = null
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {})
          audioContextRef.current = null
        }
      }
    }
  }, [])

  return {
    isRecording,
    start,
    stop,
    cleanup,
  }
}

