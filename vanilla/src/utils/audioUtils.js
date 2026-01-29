/**
 * Audio processing utility functions
 */

/**
 * Resample audio data using linear interpolation (fallback for simple cases)
 * For high-quality resampling, use resampleAudioWithWebAudioAPI
 * @param {Float32Array} inputData - Input audio data
 * @param {number} fromSampleRate - Source sample rate
 * @param {number} toSampleRate - Target sample rate
 * @returns {Float32Array} Resampled audio data
 */
export function resampleAudio(inputData, fromSampleRate, toSampleRate) {
  if (fromSampleRate === toSampleRate) {
    return inputData
  }

  const ratio = fromSampleRate / toSampleRate
  const outputLength = Math.round(inputData.length / ratio)
  const outputData = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i++) {
    const index = i * ratio
    const indexFloor = Math.floor(index)
    const indexCeil = Math.min(indexFloor + 1, inputData.length - 1)
    const fraction = index - indexFloor

    // Linear interpolation
    outputData[i] = inputData[indexFloor] * (1 - fraction) + inputData[indexCeil] * fraction
  }

  return outputData
}

/**
 * Resample audio data using Web Audio API's OfflineAudioContext (high-quality with anti-aliasing)
 * This is the recommended method for quality-critical resampling (e.g., 24kHz to 16kHz)
 * @param {Float32Array} inputData - Input audio data
 * @param {number} fromSampleRate - Source sample rate
 * @param {number} toSampleRate - Target sample rate
 * @returns {Promise<Float32Array>} Resampled audio data
 */
export async function resampleAudioWithWebAudioAPI(inputData, fromSampleRate, toSampleRate) {
  if (fromSampleRate === toSampleRate) {
    return inputData
  }

  // Create an AudioContext and AudioBuffer at the source sample rate
  const sourceContext = new AudioContext({ sampleRate: fromSampleRate })
  const sourceBuffer = sourceContext.createBuffer(1, inputData.length, fromSampleRate)
  sourceBuffer.getChannelData(0).set(inputData)

  // Create an OfflineAudioContext at the target sample rate
  const duration = inputData.length / fromSampleRate
  const targetLength = Math.round(duration * toSampleRate)
  const offlineContext = new OfflineAudioContext(1, targetLength, toSampleRate)

  // Create a source node and connect it to the offline context
  // The browser will resample to the target sample rate with built-in anti-aliasing
  const sourceNode = offlineContext.createBufferSource()
  sourceNode.buffer = sourceBuffer
  sourceNode.connect(offlineContext.destination)
  sourceNode.start(0)

  // Render to get the resampled buffer
  const resampledBuffer = await offlineContext.startRendering()
  const resampledFloat32 = resampledBuffer.getChannelData(0)

  // Close the temporary AudioContext
  await sourceContext.close()

  return resampledFloat32
}

/**
 * Convert Float32Array audio data to Int16 PCM
 * @param {Float32Array} float32Data - Float32 format audio data
 * @returns {Int16Array} Int16 PCM format audio data
 */
export function convertToInt16PCM(float32Data) {
  const pcm16 = new Int16Array(float32Data.length)
  for (let i = 0; i < float32Data.length; i++) {
    // Limit to [-1, 1] range
    const s = Math.max(-1, Math.min(1, float32Data[i]))
    // Convert to Int16 range [-32768, 32767]
    pcm16[i] = Math.round(s * 32768)
  }
  return pcm16
}

/**
 * Convert Int16Array to Uint8Array (little-endian)
 * @param {Int16Array} int16Data - Int16 format audio data
 * @returns {Uint8Array} Uint8 format audio data
 */
export function convertToUint8Array(int16Data) {
  const uint8Array = new Uint8Array(int16Data.length * 2)
  const view = new DataView(uint8Array.buffer)
  for (let i = 0; i < int16Data.length; i++) {
    view.setInt16(i * 2, int16Data[i], true) // true means little-endian
  }
  return uint8Array
}

/**
 * Merge multiple Float32Array audio chunks
 * @param {Array<{data: Float32Array}>} chunks - Audio chunk array
 * @returns {Float32Array} Merged audio data
 */
export function mergeAudioChunks(chunks) {
  const totalSamples = chunks.reduce((sum, chunk) => sum + chunk.data.length, 0)
  const mergedFloat32 = new Float32Array(totalSamples)
  let offset = 0
  for (const chunk of chunks) {
    mergedFloat32.set(chunk.data, offset)
    offset += chunk.data.length
  }
  return mergedFloat32
}

/**
 * Decode audio file (mp3, wav, etc.) to PCM format
 * @param {ArrayBuffer} arrayBuffer - Audio file as ArrayBuffer
 * @param {number} targetSampleRate - Target sample rate (from SDK initialization config, e.g. 16000, 24000)
 * @returns {Promise<{data: Uint8Array, sampleRate: number, duration: number}>}
 * Note: Output is 16-bit PCM (bit depth), sample rate is determined by targetSampleRate parameter
 */
export async function decodeAudioFile(arrayBuffer, targetSampleRate = 16000) {
  const audioContext = new AudioContext()
  
  try {
    // Decode audio file using Web Audio API
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
    
    // Get audio data (mono)
    let audioData
    if (audioBuffer.numberOfChannels === 1) {
      audioData = audioBuffer.getChannelData(0)
    } else {
      // Convert stereo to mono by averaging channels
      const channel0 = audioBuffer.getChannelData(0)
      const channel1 = audioBuffer.getChannelData(1)
      audioData = new Float32Array(channel0.length)
      for (let i = 0; i < channel0.length; i++) {
        audioData[i] = (channel0[i] + channel1[i]) / 2
      }
    }
    
    const sourceSampleRate = audioBuffer.sampleRate
    
    // Resample if needed
    let resampledData
    if (sourceSampleRate !== targetSampleRate) {
      resampledData = await resampleAudioWithWebAudioAPI(audioData, sourceSampleRate, targetSampleRate)
    } else {
      resampledData = audioData
    }
    
    // Convert to Int16 PCM
    const pcm16 = convertToInt16PCM(resampledData)
    
    // Convert to Uint8Array
    const uint8Data = convertToUint8Array(pcm16)
    
    const duration = resampledData.length / targetSampleRate
    
    await audioContext.close()
    
    return {
      data: uint8Data,
      sampleRate: targetSampleRate,
      duration
    }
  } catch (error) {
    await audioContext.close()
    throw error
  }
}
