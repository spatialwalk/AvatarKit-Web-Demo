/**
 * Audio Recording Hook
 * Implemented using ScriptProcessorNode (same approach as Vanilla version)
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
  const targetSampleRateRef = useRef(16000)
  const isRecordingFlagRef = useRef(false)

  const start = async (sampleRate: number = 16000) => {
    targetSampleRateRef.current = sampleRate
    try {
      // If already recording, stop first
      if (isRecordingFlagRef.current) {
        await stop()
        // Wait a short time to ensure state update completes
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      // Clear previous recording data
      audioChunksRef.current = []

      // Create AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: targetSampleRateRef.current,
      })
      audioContextRef.current = audioContext
      actualSampleRateRef.current = audioContext.sampleRate

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: targetSampleRateRef.current,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      })

      mediaStreamRef.current = stream

      // Create ScriptProcessorNode
      const bufferSize = 4096
      const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1)
      scriptProcessorRef.current = scriptProcessor

      // Create GainNode to mute output
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0

      // Connect audio nodes
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(scriptProcessor)
      scriptProcessor.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Set flag first, then set callback function
      isRecordingFlagRef.current = true
      
      // Set callback function
      scriptProcessor.onaudioprocess = (event) => {
        if (!isRecordingFlagRef.current) return
        
        const inputData = event.inputBuffer.getChannelData(0)
        audioChunksRef.current.push({
          data: new Float32Array(inputData),
        })
      }

      // Finally update React state
      setIsRecording(true)
    } catch (error) {
      isRecordingFlagRef.current = false
      setIsRecording(false)
      throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const stop = async (): Promise<ArrayBuffer | null> => {
    try {
      isRecordingFlagRef.current = false
      setIsRecording(false)

      // Disconnect ScriptProcessorNode
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect()
        scriptProcessorRef.current = null
      }

      // Stop stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }

      const currentSampleRate = actualSampleRateRef.current

      // Close AudioContext
      if (audioContextRef.current) {
        try {
          const state = audioContextRef.current.state as string
          if (state !== 'closed' && state !== 'closing') {
            await audioContextRef.current.close()
          }
        } catch (err) {
          // Silently handle close errors
        } finally {
          audioContextRef.current = null
        }
      }

      // Process audio data
      if (audioChunksRef.current.length === 0) {
        return null
      }

      // 1. Merge all Float32Array data
      const mergedFloat32 = mergeAudioChunks(audioChunksRef.current)

      // 2. Resample to target sample rate (if needed)
      let finalAudio = mergedFloat32
      if (currentSampleRate !== targetSampleRateRef.current) {
        finalAudio = resampleAudio(mergedFloat32, currentSampleRate, targetSampleRateRef.current)
      }

      // 3. Convert to Int16 PCM
      const pcm16 = convertToInt16PCM(finalAudio)

      // 4. Convert to Uint8Array
      const mergedAudio = convertToUint8Array(pcm16)

      // Clear cache
      audioChunksRef.current = []

      return mergedAudio.buffer as ArrayBuffer
    } catch (error) {
      throw new Error(`Failed to stop recording: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const cleanup = () => {
    if (isRecordingFlagRef.current) {
      stop().catch(() => {})
    }
  }

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Only clean up resources, don't update state (component is unmounted, updating state is meaningless and will error)
      if (isRecordingFlagRef.current) {
        isRecordingFlagRef.current = false
        // Clean up resources but don't process data
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

