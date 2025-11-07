/**
 * Control panel component
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
      <h2>🎮 Control Panel</h2>
      <div className="form-group">
        <label>Environment</label>
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
        <label>Character ID</label>
        <input
          type="text"
          value={characterId}
          onChange={(e) => onCharacterIdChange(e.target.value)}
          placeholder="Enter character ID"
        />
      </div>

      <div className="form-group">
        <label>Session Token</label>
        <input
          type="text"
          value={sessionToken}
          onChange={(e) => onSessionTokenChange(e.target.value)}
          placeholder="Enter Session Token (optional)"
        />
      </div>

      <div className="button-group">
        <button disabled={isInitialized || isLoading} onClick={onInit}>
          1. Initialize SDK
        </button>
        <button disabled={!isInitialized || !!avatarView || isLoading || !characterId.trim()} onClick={onLoadCharacter}>
          2. Load Character
        </button>
        <button disabled={!avatarView || (avatarController?.connected) || isLoading} onClick={onConnect}>
          3. Connect Service
        </button>
        <button disabled={!avatarController || !avatarController.connected || isLoading || isRecording} onClick={onStartRecord}>
          4. Start Recording
        </button>
        <button disabled={!avatarController || !isRecording} onClick={onStopRecord}>
          Stop Recording
        </button>
        <button disabled={!avatarController || !avatarController.connected} onClick={onInterrupt}>
          Interrupt
        </button>
        <button disabled={!avatarController || !avatarController.connected} onClick={onDisconnect}>
          Disconnect
        </button>
        <button disabled={!avatarView || isLoading} onClick={onUnloadCharacter} style={{ background: '#ef4444' }}>
          Unload Character
        </button>
      </div>
    </div>
  )
}

