/**
 * Control panel component
 */

import { Environment } from '../types'
import { DrivingServiceMode, Environment as SDKEnvironment } from '@spatialwalk/avatarkit'

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
  currentPlaybackMode: 'network' | 'external'
  onEnvironmentChange: (env: Environment) => void
  onCharacterIdChange: (id: string) => void
  onSessionTokenChange: (token: string) => void
  onInit?: () => void
  onLoadCharacter: () => void
  onConnect: () => void
  onStartRecord: () => void
  onStopRecord: () => void
  onInterrupt: () => void
  onDisconnect: () => void
  onUnloadCharacter: () => void
  conversationState: 'idle' | 'playing' | null
  volume: number
  onVolumeChange: (volume: number) => void
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
  onInterrupt,
  onDisconnect,
  onUnloadCharacter,
  conversationState,
  volume,
  onVolumeChange,
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
          <option value={SDKEnvironment.intl}>International</option>
          <option value={SDKEnvironment.cn}>CN</option>
          <option value={SDKEnvironment.test}>Test</option>
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
        <button disabled={!avatarView || currentPlaybackMode !== 'network' || isConnected || isLoading} onClick={onConnect}>
          {onInit ? '3. Connect Service' : '2. Connect Service'}
        </button>
        <button disabled={!avatarController || currentPlaybackMode !== 'network' || !isConnected || isRecording || isLoading} onClick={onStartRecord}>
          {onInit ? '4. Start Recording' : '3. Start Recording'}
        </button>
        <button disabled={!avatarController || (currentPlaybackMode === 'network' && !isRecording) || (currentPlaybackMode === 'external' && isLoading)} onClick={onStopRecord}>
          {currentPlaybackMode === 'network' ? 'Stop Recording' : 'Play Data'}
        </button>
        <button disabled={!avatarController || (currentPlaybackMode === 'network' && !isConnected)} onClick={onInterrupt}>
          Interrupt
        </button>
        <button disabled={!avatarController || currentPlaybackMode !== 'network' || !isConnected} onClick={onDisconnect}>
          Disconnect
        </button>
        <button disabled={!avatarView} onClick={onUnloadCharacter} style={{ background: '#ef4444' }}>
          Unload Character
        </button>
      </div>

      <div className="form-group" style={{ marginTop: '16px' }}>
        <label>
          🔊 Volume: {volume}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(parseInt(e.target.value))}
          disabled={!avatarView}
          style={{ width: '100%', cursor: avatarView ? 'pointer' : 'not-allowed' }}
        />
      </div>
    </div>
  )
}

