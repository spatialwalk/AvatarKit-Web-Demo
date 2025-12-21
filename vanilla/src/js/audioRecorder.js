/**
 * Audio recording functionality
 * Handles microphone recording and audio data processing
 */

import { resampleAudio, convertToInt16PCM, convertToUint8Array, mergeAudioChunks } from '../utils/audioUtils.js'

/**
 * Audio sample rate constant (default, can be overridden)
 */
const DEFAULT_AUDIO_SAMPLE_RATE = 16000

/**
 * Audio recorder class
 */
export class AudioRecorder {
  constructor() {
    this.audioContext = null
    this.scriptProcessor = null
    this.mediaStream = null
    this.isRecording = false
    this.recordedAudioChunks = []
    this.actualSampleRate = DEFAULT_AUDIO_SAMPLE_RATE
    this.targetSampleRate = DEFAULT_AUDIO_SAMPLE_RATE
  }

  /**
   * Start recording
   * @param {number} sampleRate - Target sample rate (default: 16000)
   * @returns {Promise<void>}
   */
  async start(sampleRate = DEFAULT_AUDIO_SAMPLE_RATE) {
    this.targetSampleRate = sampleRate
    try {
      // If already recording, stop previous recording first
      if (this.isRecording) {
        await this.stop()
      }

      // Clean up previous resources (prevent residue)
      if (this.scriptProcessor) {
        try {
          this.scriptProcessor.disconnect()
        } catch (e) {
          // Ignore errors
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
          // Ignore errors
        }
        this.audioContext = null
      }

      // Clear previous recording data
      this.recordedAudioChunks = []

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.targetSampleRate,
      })

      this.actualSampleRate = this.audioContext.sampleRate

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: this.targetSampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false, // Disable automatic gain control
        },
      })

      this.mediaStream = stream
      const bufferSize = 4096
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1)

      // Use GainNode to set volume to 0, avoid audio feedback
      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = 0 // Mute, avoid feedback

      const source = this.audioContext.createMediaStreamSource(stream)
      source.connect(this.scriptProcessor)
      this.scriptProcessor.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.isRecording) return
        const inputData = event.inputBuffer.getChannelData(0)
        const float32Data = new Float32Array(inputData)
        
        // Save audio data
        this.recordedAudioChunks.push({
          data: float32Data,
        })
      }

      this.isRecording = true

      return Promise.resolve()
    } catch (error) {
      throw new Error(`Failed to start recording: ${error.message}`)
    }
  }

  /**
   * Stop recording and process audio data
   * @returns {Promise<ArrayBuffer>} Processed audio data
   */
  async stop() {
    try {
      // Stop recording flag first to prevent onaudioprocess from continuing to add data
      this.isRecording = false

      // Clean up recording resources
      if (this.scriptProcessor) {
        try {
          this.scriptProcessor.disconnect()
        } catch (e) {
          // Ignore errors
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
          console.warn('Error closing AudioContext:', err)
        } finally {
          this.audioContext = null
        }
      }

      // Process audio data
      if (this.recordedAudioChunks.length === 0) {
        return null
      }

      const currentSampleRate = this.actualSampleRate

      // 1. Merge all Float32Array data
      const mergedFloat32 = mergeAudioChunks(this.recordedAudioChunks)

      // 2. Resample to target sample rate (if needed)
      let finalAudio = mergedFloat32
      if (currentSampleRate !== this.targetSampleRate) {
        finalAudio = resampleAudio(mergedFloat32, currentSampleRate, this.targetSampleRate)
      }

      // 3. Convert to Int16 PCM
      const pcm16 = convertToInt16PCM(finalAudio)

      // 4. Convert to Uint8Array (ensure correct byte order)
      const mergedAudio = convertToUint8Array(pcm16)

      // Clear cache
      this.recordedAudioChunks = []

      return mergedAudio.buffer
    } catch (error) {
      console.error(`[AudioRecorder] stop() error:`, error)
      throw new Error(`Failed to stop recording: ${error.message}`)
    }
  }

  /**
   * Get recording duration (seconds)
   * @returns {number} Recording duration
   */
  getDuration() {
    const totalSamples = this.recordedAudioChunks.reduce((sum, chunk) => sum + chunk.data.length, 0)
    return (totalSamples / this.actualSampleRate).toFixed(2)
  }
}

