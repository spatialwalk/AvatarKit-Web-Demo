/**
 * Control panel component
 */

import { useState } from 'react'
import { Environment } from '../types'
import { Environment as SDKEnvironment } from '@spatialwalk/avatarkit'

interface ControlPanelProps {
  environment: Environment
  avatarId: string
  avatarIdList: string[]
  isInitialized: boolean
  avatarView: any
  avatarController: any
  isRecording: boolean
  isLoading: boolean
  isConnected: boolean
  currentPlaybackMode: 'network' | 'external'
  conversationState?: 'idle' | 'playing' | 'pausing' | null
  isSendingAudio?: boolean
  onAvatarIdChange: (id: string) => void
  onInit?: () => void
  onLoadAvatar: () => void
  onConnect: () => void
  onStartRecord: () => void
  onStopRecord: () => void
  onInterrupt: () => void
  onDisconnect: () => void
  onUnloadAvatar: () => void
}

export function ControlPanel({
  environment,
  avatarId,
  avatarIdList,
  isInitialized,
  avatarView,
  avatarController,
  isRecording,
  isLoading,
  isConnected,
  currentPlaybackMode,
  conversationState,
  isSendingAudio = false,
  onAvatarIdChange,
  onInit,
  onLoadAvatar,
  onConnect,
  onLoadAudio,
  onStartRecord,
  onStopRecord,
  onInterrupt,
  onDisconnect,
  onUnloadAvatar,
}: ControlPanelProps) {
  const [showAddIdModal, setShowAddIdModal] = useState(false)
  const [newAvatarId, setNewAvatarId] = useState('')
  
  const envName = environment === SDKEnvironment.cn ? 'CN' : 
                 environment === SDKEnvironment.intl ? 'International' : 
                 'Test'
  
  const handleAddAvatarId = () => {
    const trimmedId = newAvatarId.trim()
    if (trimmedId) {
      onAvatarIdChange(trimmedId)
      setNewAvatarId('')
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <label style={{ marginBottom: 0, display: 'inline-block', lineHeight: '22px' }}>Avatar ID</label>
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
            title="Add new Avatar ID"
          >
            ➕
          </button>
          <a
            href="https://docs.spatialreal.ai/overview/test-avatars"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: 0,
              margin: 0,
              background: '#10b981',
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
              flexShrink: 0,
              textDecoration: 'none'
            }}
            title="Get test avatar IDs"
          >
            🔗
          </a>
        </div>
        <select
          value={avatarId}
          onChange={(e) => onAvatarIdChange(e.target.value)}
        >
          <option value="">Select Avatar ID</option>
          {avatarIdList.map((id) => (
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
        <button disabled={!isInitialized || !!avatarView || isLoading || !avatarId.trim()} onClick={onLoadAvatar}>
          {onInit ? '2. Load Avatar' : '1. Load Avatar'}
        </button>
        <button disabled={!avatarView || currentPlaybackMode !== 'network' || isConnected || isLoading} onClick={onConnect}>
          {onInit ? '3. Connect Service' : '2. Connect Service'}
        </button>
        {currentPlaybackMode === 'network' && (
          <button disabled={!avatarController || !isConnected || isLoading || conversationState === 'playing' || conversationState === 'pausing' || isSendingAudio} onClick={onLoadAudio}>
            Load Audio
          </button>
        )}
        <button disabled={!avatarController || currentPlaybackMode !== 'network' || !isConnected || isRecording || isLoading || conversationState === 'playing' || conversationState === 'pausing' || isSendingAudio} onClick={onStartRecord}>
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
        <button disabled={!avatarView} onClick={onUnloadAvatar} style={{ background: '#ef4444' }}>
          Unload Avatar
        </button>
      </div>


      
      {/* Add Avatar ID Modal */}
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
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Add New Avatar ID</h3>
            <input
              type="text"
              value={newAvatarId}
              onChange={(e) => setNewAvatarId(e.target.value)}
              placeholder="Enter Avatar ID"
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
                  handleAddAvatarId()
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
                onClick={handleAddAvatarId}
                disabled={!newAvatarId.trim()}
                style={{
                  padding: '8px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: newAvatarId.trim() ? 'pointer' : 'not-allowed',
                  opacity: newAvatarId.trim() ? 1 : 0.5
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

