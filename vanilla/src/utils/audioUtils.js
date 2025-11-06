/**
 * 音频处理工具函数
 */

/**
 * 重采样音频数据
 * @param {Float32Array} inputData - 输入音频数据
 * @param {number} fromSampleRate - 源采样率
 * @param {number} toSampleRate - 目标采样率
 * @returns {Float32Array} 重采样后的音频数据
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

    // 线性插值
    outputData[i] = inputData[indexFloor] * (1 - fraction) + inputData[indexCeil] * fraction
  }

  return outputData
}

/**
 * 将 Float32Array 音频数据转换为 Int16 PCM
 * @param {Float32Array} float32Data - Float32 格式的音频数据
 * @returns {Int16Array} Int16 PCM 格式的音频数据
 */
export function convertToInt16PCM(float32Data) {
  const pcm16 = new Int16Array(float32Data.length)
  for (let i = 0; i < float32Data.length; i++) {
    // 限制在 [-1, 1] 范围
    const s = Math.max(-1, Math.min(1, float32Data[i]))
    // 转换为 Int16 范围 [-32768, 32767]
    pcm16[i] = Math.round(s * 32768)
  }
  return pcm16
}

/**
 * 将 Int16Array 转换为 Uint8Array（小端序）
 * @param {Int16Array} int16Data - Int16 格式的音频数据
 * @returns {Uint8Array} Uint8 格式的音频数据
 */
export function convertToUint8Array(int16Data) {
  const uint8Array = new Uint8Array(int16Data.length * 2)
  const view = new DataView(uint8Array.buffer)
  for (let i = 0; i < int16Data.length; i++) {
    view.setInt16(i * 2, int16Data[i], true) // true 表示小端序
  }
  return uint8Array
}

/**
 * 合并多个 Float32Array 音频块
 * @param {Array<{data: Float32Array}>} chunks - 音频块数组
 * @returns {Float32Array} 合并后的音频数据
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

