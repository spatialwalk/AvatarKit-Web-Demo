/**
 * Avatar SDK Hook
 * 封装 SDK 的初始化和使用逻辑
 */

import { useState, useRef, useEffect } from 'react'
import { AvatarKit, AvatarManager, AvatarView, Environment, type AvatarController, type ConnectionState, type AvatarState } from '@spatialwalk/avatarkit'

export function useAvatarSDK() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [avatarView, setAvatarView] = useState<AvatarView | null>(null)
  const [avatarController, setAvatarController] = useState<AvatarController | null>(null)
  const avatarManagerRef = useRef<AvatarManager | null>(null)
  const avatarViewRef = useRef<AvatarView | null>(null)

  // 初始化 SDK
  const initialize = async (environment: Environment, sessionToken?: string) => {
    try {
      await AvatarKit.initialize('demo', { environment })
      
      if (sessionToken) {
        AvatarKit.setSessionToken(sessionToken)
      }

      const avatarManager = new AvatarManager()
      avatarManagerRef.current = avatarManager
      setIsInitialized(true)
    } catch (error) {
      throw new Error(`SDK 初始化失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 加载角色
  const loadCharacter = async (
    characterId: string,
    container: HTMLElement,
    callbacks?: {
      onConnectionState?: (state: ConnectionState) => void
      onAvatarState?: (state: AvatarState) => void
      onError?: (error: Error) => void
    },
  ) => {
    if (!avatarManagerRef.current) {
      throw new Error('SDK 未初始化')
    }

    try {
      // 1. 加载 Avatar
      const avatar = await avatarManagerRef.current.load(characterId)
      
      // 2. 创建 AvatarView
      const avatarView = new AvatarView(avatar, container)
      
      // 3. 设置回调
      if (callbacks?.onConnectionState) {
        avatarView.avatarController.onConnectionState = callbacks.onConnectionState
      }
      if (callbacks?.onAvatarState) {
        avatarView.avatarController.onAvatarState = callbacks.onAvatarState
      }
      if (callbacks?.onError) {
        avatarView.avatarController.onError = callbacks.onError
      }

      setAvatarView(avatarView)
      avatarViewRef.current = avatarView
      setAvatarController(avatarView.avatarController)
    } catch (error) {
      throw new Error(`角色加载失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 连接服务
  const connect = async () => {
    if (!avatarView?.avatarController) {
      throw new Error('角色未加载')
    }

    await avatarView.avatarController.start()
  }

  // 发送音频数据
  const sendAudio = (audioData: ArrayBuffer, isFinal: boolean = false) => {
    if (!avatarController) {
      throw new Error('角色未加载或未连接')
    }
    avatarController.send(audioData, isFinal)
  }

  // 打断对话
  const interrupt = () => {
    if (!avatarController) {
      throw new Error('角色未加载或未连接')
    }
    avatarController.interrupt()
  }

  // 断开连接
  const disconnect = async () => {
    if (avatarView?.avatarController) {
      avatarView.avatarController.close()
      // 断开连接时不清空 avatarView 和 avatarController，允许重新连接
    }
  }

  // 卸载角色
  // ⚠️ 重要：SDK 目前只支持同时存在一个角色，如果要加载新角色，必须先卸载当前角色
  const unloadCharacter = () => {
    if (avatarView) {
      avatarView.dispose() // 清理所有资源，包括关闭连接、释放 WASM 资源、移除 Canvas 等
      setAvatarView(null)
      avatarViewRef.current = null
      setAvatarController(null)
    }
  }

  // 清理资源（只在组件卸载时执行）
  useEffect(() => {
    return () => {
      // 组件卸载时清理所有资源
      if (avatarViewRef.current) {
        avatarViewRef.current.dispose()
      }
      // avatarManagerRef 在组件卸载时清空
      if (avatarManagerRef.current) {
        avatarManagerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 空依赖数组，只在组件卸载时执行

  return {
    isInitialized,
    avatarView,
    avatarController,
    initialize,
    loadCharacter,
    connect,
    sendAudio,
    interrupt,
    disconnect,
    unloadCharacter,
  }
}

