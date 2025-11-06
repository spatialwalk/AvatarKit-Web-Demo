/**
 * SDK 封装
 * 管理 SDK 的初始化、角色加载和连接状态
 */

/**
 * SDK 管理器类
 */
export class AvatarSDKManager {
  constructor(logger) {
    this.logger = logger
    this.AvatarKit = null
    this.AvatarManager = null
    this.AvatarView = null
    this.avatarManager = null
    this.avatarView = null
    this.isInitialized = false
    this.isConnected = false
    this.avatarState = null
  }

  /**
   * 加载 SDK
   * @returns {Promise<boolean>} 是否加载成功
   */
  async loadSDK() {
    try {
      this.logger.info('正在加载 SDK...')
      // 使用 npm 安装的 SDK
      const sdk = await import('@spatialwalk/avatarkit')
      this.AvatarKit = sdk.AvatarKit
      this.AvatarManager = sdk.AvatarManager
      this.AvatarView = sdk.AvatarView
      this.logger.success('SDK 加载成功')
      return true
    } catch (error) {
      this.logger.error('SDK 加载失败，请确保已构建 SDK', error)
      this.logger.info('提示：运行 npm run build 构建 SDK')
      return false
    }
  }

  /**
   * 初始化 SDK
   * @param {string} environment - 环境 (us, cn, test)
   * @param {string} sessionToken - Session Token（可选）
   * @returns {Promise<void>}
   */
  async initialize(environment, sessionToken = null) {
    if (!this.AvatarKit || !this.AvatarManager) {
      const loaded = await this.loadSDK()
      if (!loaded) {
        throw new Error('SDK 未加载')
      }
    }

    this.logger.info('开始初始化 SDK')
    this.logger.info(`使用环境: ${environment}`)

    await this.AvatarKit.initialize('demo', {
      environment,
      logLevel: 'basic',
    })

    if (sessionToken) {
      this.AvatarKit.setSessionToken(sessionToken)
      this.logger.info('Session Token 已设置')
    }

    this.avatarManager = this.AvatarManager.shared
    this.isInitialized = true
    this.logger.success('SDK 初始化成功')
  }

  /**
   * 加载角色
   * @param {string} characterId - 角色 ID
   * @param {HTMLElement} canvasContainer - Canvas 容器
   * @param {Function} onConnectionState - 连接状态回调
   * @param {Function} onAvatarState - 角色状态回调
   * @param {Function} onError - 错误回调
   * @returns {Promise<void>}
   */
  async loadCharacter(characterId, canvasContainer, onConnectionState, onAvatarState, onError) {
    if (!characterId.trim()) {
      throw new Error('请输入角色 ID')
    }

    this.logger.info(`开始加载角色: ${characterId}`)

    const avatar = await this.avatarManager.load(characterId, (progress) => {
      this.logger.info(`加载进度: ${progress.type} ${progress.progress ? `(${progress.progress}%)` : ''}`)
    })

    this.logger.success('角色加载成功', { id: avatar.id, name: avatar.name })

    // 创建视图
    this.avatarView = new this.AvatarView(avatar, canvasContainer)

    if (this.avatarView.avatarController) {
      this.avatarView.avatarController.onConnectionState = (state) => {
        this.logger.info(`连接状态: ${state}`)
        this.isConnected = state === 'connected'
        if (onConnectionState) {
          onConnectionState(state)
        }
      }

      this.avatarView.avatarController.onAvatarState = (state) => {
        this.avatarState = state
        this.logger.info(`角色状态: ${state}`)
        if (onAvatarState) {
          onAvatarState(state)
        }
      }

      this.avatarView.avatarController.onError = (error) => {
        this.logger.error(`错误: ${error.message}`, error)
        if (onError) {
          onError(error)
        }
      }
    }

    this.logger.success('角色视图已创建')
  }

  /**
   * 连接服务
   * @returns {Promise<void>}
   */
  async connect() {
    if (!this.avatarView?.avatarController) {
      throw new Error('角色未加载')
    }

    this.logger.info('开始连接 WebSocket 服务')
    await this.avatarView.avatarController.start()
    this.logger.success('连接请求已发送')
  }

  /**
   * 打断对话
   */
  interrupt() {
    if (!this.avatarView?.avatarController) {
      throw new Error('角色未加载')
    }
    if (!this.isConnected) {
      throw new Error('尚未连接服务')
    }
    this.avatarView.avatarController.interrupt()
    this.logger.info('已打断当前对话')
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.avatarView?.avatarController) {
      this.avatarView.avatarController.close()
      this.logger.info('连接已关闭')
    }
    this.isConnected = false
  }

  /**
   * 卸载角色
   * ⚠️ 重要：SDK 目前只支持同时存在一个角色，如果要加载新角色，必须先卸载当前角色
   */
  unloadCharacter() {
    if (this.avatarView) {
      this.avatarView.dispose() // 清理所有资源，包括关闭连接、释放 WASM 资源、移除 Canvas 等
      this.avatarView = null
      this.isConnected = false
      this.avatarState = null
      this.logger.info('角色已卸载，可以重新加载新角色')
    }
  }

  /**
   * 发送音频数据
   * @param {ArrayBuffer} audioData - 音频数据
   * @param {boolean} isFinal - 是否是最后一段数据
   */
  sendAudio(audioData, isFinal = false) {
    if (!this.avatarView?.avatarController) {
      throw new Error('角色未加载或未连接')
    }
    this.avatarView.avatarController.send(audioData, isFinal)
  }
}

