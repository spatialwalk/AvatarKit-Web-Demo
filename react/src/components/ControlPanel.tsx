/**
 * Control panel component
 */

import { Environment } from '../types'
import { AvatarPlaybackMode } from '@spatialwalk/avatarkit'

interface ControlPanelProps {
  environment: Environment
  characterId: string
  sessionToken: string
  playbackMode: AvatarPlaybackMode
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
  onPlaybackModeChange: (mode: AvatarPlaybackMode) => void
  onInit: () => void
  onLoadCharacter: (mode: AvatarPlaybackMode) => void
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
  playbackMode,
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
  onPlaybackModeChange,
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

      <div className="form-group">
        <label>Playback Mode</label>
        <select
          value={playbackMode}
          onChange={(e) => onPlaybackModeChange(e.target.value as AvatarPlaybackMode)}
        >
          <option value={AvatarPlaybackMode.network}>Network Mode</option>
          <option value={AvatarPlaybackMode.external}>External Data Mode</option>
        </select>
      </div>

      <div className="button-group">
        <button disabled={isInitialized || isLoading} onClick={onInit}>
          1. Initialize SDK
        </button>
        <button disabled={!isInitialized || !!avatarView || isLoading || !characterId.trim()} onClick={() => onLoadCharacter(AvatarPlaybackMode.network)}>
          2. Load Character (Network)
        </button>
        <button disabled={!isInitialized || !!avatarView || isLoading || !characterId.trim()} onClick={() => onLoadCharacter(AvatarPlaybackMode.external)}>
          2. Load Character (External)
        </button>
        <button disabled={!avatarView || currentPlaybackMode !== AvatarPlaybackMode.network || isConnected || isLoading} onClick={onConnect}>
          3. Connect Service
        </button>
        <button disabled={!avatarController || currentPlaybackMode !== AvatarPlaybackMode.network || !isConnected || isRecording || isLoading} onClick={onStartRecord}>
          4. Start Recording
        </button>
        <button disabled={!avatarController || (currentPlaybackMode === AvatarPlaybackMode.network && !isRecording) || (currentPlaybackMode === AvatarPlaybackMode.external && isLoading)} onClick={onStopRecord}>
          {currentPlaybackMode === AvatarPlaybackMode.network ? 'Stop Recording' : 'Play Data'}
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

