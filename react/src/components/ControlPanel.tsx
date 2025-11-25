/**
 * Control panel component
 */

import { Environment } from '../types'
import { DrivingServiceMode, AvatarPlaybackMode, AvatarState } from '@spatialwalk/avatarkit'

interface ControlPanelProps {
  environment: Environment
  characterId: string
  sessionToken: string
  isInitialized: boolean
  avatarView: any
  avatarController: any
  isRecording: boolean
  isLoading: boolean
  isConnected: boolean
  currentPlaybackMode: AvatarPlaybackMode
  onEnvironmentChange: (env: Environment) => void
  onCharacterIdChange: (id: string) => void
  onSessionTokenChange: (token: string) => void
  onInit?: () => void
  onLoadCharacter: () => void
  onConnect: () => void
  onStartRecord: () => void
  onStopRecord: () => void
  onPause: () => void
  onResume: () => void
  onInterrupt: () => void
  onDisconnect: () => void
  onUnloadCharacter: () => void
  avatarState: any
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
  isConnected,
  currentPlaybackMode,
  onEnvironmentChange,
  onCharacterIdChange,
  onSessionTokenChange,
  onInit,
  onLoadCharacter,
  onConnect,
  onStartRecord,
  onStopRecord,
  onPause,
  onResume,
  onInterrupt,
  onDisconnect,
  onUnloadCharacter,
  avatarState,
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
        <label>Session Token</label>
        <input
          type="text"
          value={sessionToken}
          onChange={(e) => onSessionTokenChange(e.target.value)}
          placeholder="Enter Session Token (optional)"
        />
      </div>

      <div className="form-group">
        <label>Character ID</label>
        <select
          value={characterId}
          onChange={(e) => onCharacterIdChange(e.target.value)}
        >
          <option value="">Select Character ID</option>
          <option value="b7ba14f6-f9aa-4f89-9934-3753d75aee39">b7ba14f6-f9aa-4f89-9934-3753d75aee39</option>
          <option value="35692117-ece1-4f77-b014-02cfa22bfb7b">35692117-ece1-4f77-b014-02cfa22bfb7b</option>
        </select>
      </div>

      <div className="button-group">
        {onInit && (
          <button disabled={isInitialized || isLoading} onClick={onInit}>
            1. Initialize SDK
          </button>
        )}
        <button disabled={!isInitialized || !!avatarView || isLoading || !characterId.trim()} onClick={onLoadCharacter}>
          {onInit ? '2. Load Character' : '1. Load Character'}
        </button>
        <button disabled={!avatarView || currentPlaybackMode !== AvatarPlaybackMode.network || isConnected || isLoading} onClick={onConnect}>
          {onInit ? '3. Connect Service' : '2. Connect Service'}
        </button>
        <button disabled={!avatarController || currentPlaybackMode !== AvatarPlaybackMode.network || !isConnected || isRecording || isLoading} onClick={onStartRecord}>
          {onInit ? '4. Start Recording' : '3. Start Recording'}
        </button>
        <button disabled={!avatarController || (currentPlaybackMode === AvatarPlaybackMode.network && !isRecording) || (currentPlaybackMode === AvatarPlaybackMode.external && isLoading)} onClick={onStopRecord}>
          {currentPlaybackMode === AvatarPlaybackMode.network ? 'Stop Recording' : 'Play Data'}
        </button>
        <button disabled={!avatarController || avatarState === AvatarState.paused || isLoading || !avatarView} onClick={onPause}>
          ⏸️ Pause
        </button>
        <button disabled={!avatarController || avatarState !== AvatarState.paused || isLoading || !avatarView} onClick={onResume}>
          ▶️ Resume
        </button>
        <button disabled={!avatarController || (currentPlaybackMode === AvatarPlaybackMode.network && !isConnected)} onClick={onInterrupt}>
          Interrupt
        </button>
        <button disabled={!avatarController || currentPlaybackMode !== AvatarPlaybackMode.network || !isConnected} onClick={onDisconnect}>
          Disconnect
        </button>
        <button disabled={!avatarView} onClick={onUnloadCharacter} style={{ background: '#ef4444' }}>
          Unload Character
        </button>
      </div>
    </div>
  )
}

