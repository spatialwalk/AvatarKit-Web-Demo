/**
 * 音频处理工具函数
 */

/**
 * 重采样音频数据
 */
export function resampleAudio(
  inputData: Float32Array,
  fromSampleRate: number,
  toSampleRate: number,
): Float32Array {
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

    // 线性插值
    outputData[i] = inputData[indexFloor] * (1 - fraction) + inputData[indexCeil] * fraction
  }

  return outputData
}

/**
 * 将 Float32Array 转换为 Int16 PCM
 */
export function convertToInt16PCM(float32Data: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Data.length)
  for (let i = 0; i < float32Data.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Data[i]))
    pcm16[i] = Math.round(s * 32768)
  }
  return pcm16
}

/**
 * 将 Int16Array 转换为 Uint8Array（小端序）
 */
export function convertToUint8Array(int16Data: Int16Array): Uint8Array {
  const uint8Array = new Uint8Array(int16Data.length * 2)
  const view = new DataView(uint8Array.buffer)
  for (let i = 0; i < int16Data.length; i++) {
    view.setInt16(i * 2, int16Data[i], true) // true 表示小端序
  }
  return uint8Array
}

/**
 * 合并多个音频块
 */
export function mergeAudioChunks(chunks: Array<{ data: Float32Array }>): Float32Array {
  const totalSamples = chunks.reduce((sum, chunk) => sum + chunk.data.length, 0)
  const mergedFloat32 = new Float32Array(totalSamples)
  let offset = 0
  for (const chunk of chunks) {
    mergedFloat32.set(chunk.data, offset)
    offset += chunk.data.length
  }
  return mergedFloat32
}

