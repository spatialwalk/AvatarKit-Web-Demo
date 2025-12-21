/**
 * Audio Recording Composable
 * Implemented using ScriptProcessorNode (same approach as Vanilla version)
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
  const targetSampleRateRef = ref(16000)
  const isRecordingFlagRef = ref(false)

  const start = async (sampleRate: number = 16000) => {
    targetSampleRateRef.value = sampleRate
    try {
      // If already recording, stop first
      if (isRecordingFlagRef.value) {
        await stop()
        // Wait a short time to ensure state update completes
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      // Clear previous recording data
      audioChunksRef.value = []

      // Create AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: targetSampleRateRef.value,
      })
      audioContextRef.value = audioContext
      actualSampleRateRef.value = audioContext.sampleRate

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: targetSampleRateRef.value,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      })

      mediaStreamRef.value = stream

      // Create ScriptProcessorNode
      const bufferSize = 4096
      const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1)
      scriptProcessorRef.value = scriptProcessor

      // Create GainNode to mute output
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0

      // Connect audio nodes
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(scriptProcessor)
      scriptProcessor.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Set flag first, then set callback function
      isRecordingFlagRef.value = true

      // Set callback function
      scriptProcessor.onaudioprocess = (event) => {
        if (!isRecordingFlagRef.value) return

        const inputData = event.inputBuffer.getChannelData(0)
        audioChunksRef.value.push({
          data: new Float32Array(inputData),
        })
      }

      // Finally update Vue state
      isRecording.value = true
    } catch (error) {
      isRecordingFlagRef.value = false
      isRecording.value = false
      throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const stop = async (): Promise<ArrayBuffer | null> => {
    try {
      isRecordingFlagRef.value = false
      isRecording.value = false

      // Disconnect ScriptProcessorNode
      if (scriptProcessorRef.value) {
        scriptProcessorRef.value.disconnect()
        scriptProcessorRef.value = null
      }

      // Stop stream
      if (mediaStreamRef.value) {
        mediaStreamRef.value.getTracks().forEach((track) => track.stop())
        mediaStreamRef.value = null
      }

      const currentSampleRate = actualSampleRateRef.value

      // Close AudioContext
      if (audioContextRef.value) {
        try {
          const state = audioContextRef.value.state as string
          if (state !== 'closed' && state !== 'closing') {
            await audioContextRef.value.close()
          }
        } catch (err) {
          // Silently handle close errors
        } finally {
          audioContextRef.value = null
        }
      }

      // Process audio data
      if (audioChunksRef.value.length === 0) {
        return null
      }

      // 1. Merge all Float32Array data
      const mergedFloat32 = mergeAudioChunks(audioChunksRef.value)

      // 2. Resample to target sample rate (if needed)
      let finalAudio = mergedFloat32
      if (currentSampleRate !== targetSampleRateRef.value) {
        finalAudio = resampleAudio(mergedFloat32, currentSampleRate, targetSampleRateRef.value)
      }

      // 3. Convert to Int16 PCM
      const pcm16 = convertToInt16PCM(finalAudio)

      // 4. Convert to Uint8Array
      const mergedAudio = convertToUint8Array(pcm16)

      // Clear cache
      audioChunksRef.value = []

      return mergedAudio.buffer as ArrayBuffer
    } catch (error) {
      throw new Error(`Failed to stop recording: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const cleanup = () => {
    if (isRecordingFlagRef.value) {
      stop().catch(() => {})
    }
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    // Only clean up resources, don't update state (component is unmounted, updating state is meaningless and will error)
    if (isRecordingFlagRef.value) {
      isRecordingFlagRef.value = false
      // Clean up resources but don't process data
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

