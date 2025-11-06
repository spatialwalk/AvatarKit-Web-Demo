/**
 * 主应用逻辑
 * 整合所有模块，处理用户交互
 */

import { Logger, updateStatus } from './logger.js'
import { AudioRecorder } from './audioRecorder.js'
import { AvatarSDKManager } from './avatarSDK.js'

/**
 * 应用主类
 */
export class App {
  constructor() {
    // UI 元素
    this.elements = {
      logPanel: document.getElementById('logPanel'),
      status: document.getElementById('status'),
      btnInit: document.getElementById('btnInit'),
      btnLoad: document.getElementById('btnLoad'),
      btnConnect: document.getElementById('btnConnect'),
      btnStartRecord: document.getElementById('btnStartRecord'),
      btnStopRecord: document.getElementById('btnStopRecord'),
      btnInterrupt: document.getElementById('btnInterrupt'),
      btnDisconnect: document.getElementById('btnDisconnect'),
      btnUnload: document.getElementById('btnUnload'),
      btnClearLog: document.getElementById('btnClearLog'),
      canvasContainer: document.getElementById('canvasContainer'),
      environment: document.getElementById('environment'),
      characterId: document.getElementById('characterId'),
      sessionToken: document.getElementById('sessionToken'),
    }

    // 初始化工具
    this.logger = new Logger(this.elements.logPanel)
    // 创建 AudioRecorder
    this.audioRecorder = new AudioRecorder()
    this.sdkManager = new AvatarSDKManager(this.logger)

    // 绑定事件
    this.bindEvents()

    // 初始化
    this.init()
  }

  /**
   * 初始化应用
   */
  async init() {
    // 尝试加载 SDK
    const loaded = await this.sdkManager.loadSDK()
    if (!loaded) {
      updateStatus(this.elements.status, 'SDK 未加载，请先构建 SDK', 'error')
      this.elements.btnInit.disabled = true
    } else {
      this.logger.info('Demo 已加载，等待初始化 SDK...')
    }
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 清空日志
    this.elements.btnClearLog.addEventListener('click', () => {
      this.logger.clear()
    })

    // 初始化 SDK
    this.elements.btnInit.addEventListener('click', () => this.handleInit())

    // 加载角色
    this.elements.btnLoad.addEventListener('click', () => this.handleLoadCharacter())

    // 连接服务
    this.elements.btnConnect.addEventListener('click', () => this.handleConnect())

    // 录音
    this.elements.btnStartRecord.addEventListener('click', () => this.handleStartRecord())
    this.elements.btnStopRecord.addEventListener('click', () => this.handleStopRecord())

    // 打断
    this.elements.btnInterrupt.addEventListener('click', () => this.handleInterrupt())

    // 断开连接
    this.elements.btnDisconnect.addEventListener('click', () => this.handleDisconnect())

    // 卸载角色
    this.elements.btnUnload.addEventListener('click', () => this.handleUnloadCharacter())
  }

  /**
   * 处理 SDK 初始化
   */
  async handleInit() {
    try {
      updateStatus(this.elements.status, '正在初始化 SDK...', 'info')

      const environment = this.elements.environment.value
      const sessionToken = this.elements.sessionToken.value.trim() || null

      await this.sdkManager.initialize(environment, sessionToken)

      updateStatus(this.elements.status, 'SDK 初始化成功', 'success')
      this.elements.btnInit.disabled = true
      this.elements.btnLoad.disabled = false
    } catch (error) {
      this.logger.error('SDK 初始化失败', error)
      updateStatus(this.elements.status, `初始化失败: ${error.message}`, 'error')
    }
  }

  /**
   * 处理加载角色
   */
  async handleLoadCharacter() {
    try {
      updateStatus(this.elements.status, '正在加载角色...', 'info')

      const characterId = this.elements.characterId.value.trim()

      await this.sdkManager.loadCharacter(
        characterId,
        this.elements.canvasContainer,
        (state) => this.onConnectionState(state),
        (state) => this.onAvatarState(state),
        (error) => this.onError(error)
      )

      updateStatus(this.elements.status, '角色加载成功', 'success')
      this.elements.btnLoad.disabled = true
      this.elements.btnConnect.disabled = false
      this.elements.btnUnload.disabled = false
    } catch (error) {
      this.logger.error('角色加载失败', error)
      updateStatus(this.elements.status, `加载失败: ${error.message}`, 'error')
    }
  }

  /**
   * 处理连接服务
   */
  async handleConnect() {
    try {
      updateStatus(this.elements.status, '正在连接...', 'info')
      await this.sdkManager.connect()
      updateStatus(this.elements.status, '已连接', 'success')
    } catch (error) {
      this.logger.error('连接失败', error)
      updateStatus(this.elements.status, `连接失败: ${error.message}`, 'error')
    }
  }

  /**
   * 处理开始录音
   */
  async handleStartRecord() {
    try {
      if (!this.sdkManager.isConnected) {
        this.logger.error('角色未加载或未连接')
        return
      }

      updateStatus(this.elements.status, '正在录音...', 'success')
      await this.audioRecorder.start()
      this.logger.success('录音已开始')

      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = false
    } catch (error) {
      this.logger.error('录音启动失败', error)
      updateStatus(this.elements.status, `录音失败: ${error.message}`, 'error')
    }
  }

  /**
   * 处理停止录音
   */
  async handleStopRecord() {
    try {
      const audioBuffer = await this.audioRecorder.stop()

      if (audioBuffer) {
        const duration = this.audioRecorder.getDuration()
        this.logger.info(`录音完成，总长度: ${audioBuffer.byteLength} bytes (${duration}秒，16kHz PCM16)`)
        this.sdkManager.sendAudio(audioBuffer, true)
        this.logger.success('已发送完整音频数据')
      } else {
        this.logger.warn('录音数据为空')
      }

      updateStatus(this.elements.status, '录音已停止', 'info')
      this.logger.success('录音已停止')

      this.elements.btnStartRecord.disabled = false
      this.elements.btnStopRecord.disabled = true
    } catch (error) {
      this.logger.error('停止录音失败', error)
      updateStatus(this.elements.status, '停止录音时出错', 'error')
      this.elements.btnStartRecord.disabled = false
      this.elements.btnStopRecord.disabled = true
    }
  }

  /**
   * 处理打断
   */
  async handleInterrupt() {
    try {
      this.sdkManager.interrupt()
      updateStatus(this.elements.status, '已打断当前对话', 'info')
    } catch (error) {
      this.logger.error('打断失败', error)
      updateStatus(this.elements.status, `打断失败: ${error.message}`, 'error')
    }
  }

  /**
   * 处理断开连接
   */
  async handleDisconnect() {
    try {
      if (this.audioRecorder.isRecording) {
        await this.handleStopRecord()
      }

      await this.sdkManager.disconnect()
      updateStatus(this.elements.status, '已断开连接', 'info')

      this.elements.btnConnect.disabled = false
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = false
    } catch (error) {
      this.logger.error('断开连接失败', error)
    }
  }

  /**
   * 处理卸载角色
   */
  handleUnloadCharacter() {
    try {
      this.sdkManager.unloadCharacter()
      updateStatus(this.elements.status, '角色已卸载', 'info')
      
      // 更新按钮状态
      this.elements.btnLoad.disabled = false
      this.elements.btnConnect.disabled = true
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = true
    } catch (error) {
      this.logger.error(`卸载角色失败: ${error.message}`, error)
      updateStatus(this.elements.status, `卸载角色失败: ${error.message}`, 'error')
    }
  }

  /**
   * 连接状态变化回调
   */
  onConnectionState(state) {
    if (state === 'connected') {
      updateStatus(this.elements.status, '已连接', 'success')
      this.elements.btnConnect.disabled = true
      this.elements.btnStartRecord.disabled = false
      this.elements.btnInterrupt.disabled = false
      this.elements.btnDisconnect.disabled = false
      this.elements.btnUnload.disabled = false
    } else if (state === 'disconnected') {
      updateStatus(this.elements.status, '已断开', 'info')
      this.elements.btnConnect.disabled = false
      this.elements.btnStartRecord.disabled = true
      this.elements.btnStopRecord.disabled = true
      this.elements.btnInterrupt.disabled = true
      this.elements.btnDisconnect.disabled = true
      this.elements.btnUnload.disabled = false
    }
  }

  /**
   * 角色状态变化回调
   */
  onAvatarState(state) {
    // 可以在这里处理角色状态变化
  }

  /**
   * 错误回调
   */
  onError(error) {
    updateStatus(this.elements.status, `错误: ${error.message}`, 'error')
  }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  new App()
})

