/**
 * Control panel component
 */

import { useState } from 'react'
import { Environment } from '../types'
import { Environment as SDKEnvironment, AvatarSDK } from '@spatialwalk/avatarkit'

interface ControlPanelProps {
  environment: Environment
  characterId: string
  characterIdList: string[]
  isInitialized: boolean
  avatarView: any
  avatarController: any
  isRecording: boolean
  isLoading: boolean
  isConnected: boolean
  currentPlaybackMode: 'network' | 'external'
  onCharacterIdChange: (id: string) => void
  onInit?: () => void
  onLoadCharacter: () => void
  onConnect: () => void
  onStartRecord: () => void
  onStopRecord: () => void
  onInterrupt: () => void
  onDisconnect: () => void
  onUnloadCharacter: () => void
  volume: number
  onVolumeChange: (volume: number) => void
}

export function ControlPanel({
  environment,
  characterId,
  characterIdList,
  isInitialized,
  avatarView,
  avatarController,
  isRecording,
  isLoading,
  isConnected,
  currentPlaybackMode,
  onCharacterIdChange,
  onInit,
  onLoadCharacter,
  onConnect,
  onStartRecord,
  onStopRecord,
  onInterrupt,
  onDisconnect,
  onUnloadCharacter,
  volume,
  onVolumeChange,
}: ControlPanelProps) {
  const [showAddIdModal, setShowAddIdModal] = useState(false)
  const [newCharacterId, setNewCharacterId] = useState('')
  
  const envName = environment === SDKEnvironment.cn ? 'CN' : 
                 environment === SDKEnvironment.intl ? 'International' : 
                 'Test'
  
  const handleAddCharacterId = () => {
    const trimmedId = newCharacterId.trim()
    if (trimmedId) {
      onCharacterIdChange(trimmedId)
      setNewCharacterId('')
      setShowAddIdModal(false)
    }
  }
  
  return (
    <div className="control-panel">
      <h2>🎮 Control Panel</h2>
      <div className="form-group">
        <label>Environment</label>
        <div style={{ padding: '8px 12px', background: '#f0f0f0', borderRadius: '6px', color: '#666', fontSize: '14px' }}>
          {envName}
        </div>
      </div>


      <div className="form-group">
        <label>Session Token</label>
        <span style={{ color: '#666', fontSize: '14px', padding: '8px 12px', background: '#f0f0f0', borderRadius: '6px', display: 'inline-block', minWidth: '200px' }}>
          {(AvatarSDK.configuration as any)?.sessionToken || '-'}
        </span>
      </div>

      <div className="form-group">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <label style={{ marginBottom: 0, display: 'inline-block', lineHeight: '22px' }}>Character ID</label>
          <button
            onClick={() => setShowAddIdModal(true)}
            style={{
              padding: 0,
              margin: 0,
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: '22px',
              width: '22px',
              height: '22px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title="Add new Character ID"
          >
            ➕
          </button>
        </div>
        <select
          value={characterId}
          onChange={(e) => onCharacterIdChange(e.target.value)}
        >
          <option value="">Select Character ID</option>
          {characterIdList.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
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
      
      {/* Add Character ID Modal */}
      {showAddIdModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowAddIdModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              minWidth: '400px',
              maxWidth: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Add New Character ID</h3>
            <input
              type="text"
              value={newCharacterId}
              onChange={(e) => setNewCharacterId(e.target.value)}
              placeholder="Enter Character ID"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCharacterId()
                } else if (e.key === 'Escape') {
                  setShowAddIdModal(false)
                }
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddIdModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCharacterId}
                disabled={!newCharacterId.trim()}
                style={{
                  padding: '8px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: newCharacterId.trim() ? 'pointer' : 'not-allowed',
                  opacity: newCharacterId.trim() ? 1 : 0.5
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

