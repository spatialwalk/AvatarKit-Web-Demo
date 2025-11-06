/**
 * 控制面板组件
 */

import { Environment } from '../types'

interface ControlPanelProps {
  environment: Environment
  characterId: string
  sessionToken: string
  isInitialized: boolean
  avatarView: any
  avatarController: any
  isRecording: boolean
  isLoading: boolean
  onEnvironmentChange: (env: Environment) => void
  onCharacterIdChange: (id: string) => void
  onSessionTokenChange: (token: string) => void
  onInit: () => void
  onLoadCharacter: () => void
  onConnect: () => void
  onStartRecord: () => void
  onStopRecord: () => void
  onInterrupt: () => void
  onDisconnect: () => void
  onUnloadCharacter: () => void
}

export function ControlPanel({
  environment,
  characterId,
  sessionToken,
  isInitialized,
  avatarView,
  avatarController,
  isRecording,
  isLoading,
  onEnvironmentChange,
  onCharacterIdChange,
  onSessionTokenChange,
  onInit,
  onLoadCharacter,
  onConnect,
  onStartRecord,
  onStopRecord,
  onInterrupt,
  onDisconnect,
  onUnloadCharacter,
}: ControlPanelProps) {
  return (
    <div className="control-panel">
      <h2>🎮 控制面板</h2>
      <div className="form-group">
        <label>环境</label>
        <select
          value={environment}
          onChange={(e) => onEnvironmentChange(e.target.value as Environment)}
        >
          <option value={Environment.us}>US</option>
          <option value={Environment.cn}>CN</option>
          <option value={Environment.test}>Test</option>
        </select>
      </div>

      <div className="form-group">
        <label>角色 ID</label>
        <input
          type="text"
          value={characterId}
          onChange={(e) => onCharacterIdChange(e.target.value)}
          placeholder="输入角色 ID"
        />
      </div>

      <div className="form-group">
        <label>Session Token</label>
        <input
          type="text"
          value={sessionToken}
          onChange={(e) => onSessionTokenChange(e.target.value)}
          placeholder="输入 Session Token（可选）"
        />
      </div>

      <div className="button-group">
        <button disabled={isInitialized || isLoading} onClick={onInit}>
          1. 初始化 SDK
        </button>
        <button disabled={!isInitialized || !!avatarView || isLoading || !characterId.trim()} onClick={onLoadCharacter}>
          2. 加载角色
        </button>
        <button disabled={!avatarView || (avatarController?.connected) || isLoading} onClick={onConnect}>
          3. 连接服务
        </button>
        <button disabled={!avatarController || !avatarController.connected || isLoading || isRecording} onClick={onStartRecord}>
          4. 开始录音
        </button>
        <button disabled={!avatarController || !isRecording} onClick={onStopRecord}>
          停止录音
        </button>
        <button disabled={!avatarController || !avatarController.connected} onClick={onInterrupt}>
          打断对话
        </button>
        <button disabled={!avatarController || !avatarController.connected} onClick={onDisconnect}>
          断开连接
        </button>
        <button disabled={!avatarView || isLoading} onClick={onUnloadCharacter} style={{ background: '#ef4444' }}>
          卸载角色
        </button>
      </div>
    </div>
  )
}

