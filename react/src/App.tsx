/**
 * Main application component
 * Supports multiple avatar panels
 */

import { useState, useEffect } from 'react'
import { AvatarPanel } from './components/AvatarPanel'
import { AvatarSDK, Environment, DrivingServiceMode } from '@spatialwalk/avatarkit'
import './App.css'

interface Panel {
  id: string
}

function App() {
  const [panels, setPanels] = useState<Panel[]>([{ id: '1' }])
  const [globalSDKInitialized, setGlobalSDKInitialized] = useState(false)
  const [sdkInitializing, setSdkInitializing] = useState(false)
  const [currentDrivingServiceMode, setCurrentDrivingServiceMode] = useState<DrivingServiceMode | null>(null)
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(Environment.intl)
  const [selectedSampleRate, setSelectedSampleRate] = useState(16000)
  const [appId, setAppId] = useState('')
  const [sessionToken, setSessionToken] = useState('')

  // 检查是否已经初始化
  useEffect(() => {
    if (AvatarSDK.isInitialized) {
      setGlobalSDKInitialized(true)
      setCurrentDrivingServiceMode(AvatarSDK.configuration?.drivingServiceMode || DrivingServiceMode.sdk)
    }
  }, [])

  // 手动初始化 SDK (SDK Mode)
  const handleInitSDK = async (mode: DrivingServiceMode) => {
    if (AvatarSDK.isInitialized || sdkInitializing) {
      return
    }
    
    try {
      setSdkInitializing(true)
      
      if (!appId.trim()) {
        throw new Error('App ID is required')
      }
      
      await AvatarSDK.initialize(appId, { 
        environment: selectedEnvironment,
        drivingServiceMode: mode,
        audioFormat: {
          channelCount: 1,
          sampleRate: selectedSampleRate
        }
      } as any)
      
      // Set Session Token if provided
      if (sessionToken.trim()) {
        AvatarSDK.setSessionToken(sessionToken.trim())
      }
      
      setCurrentDrivingServiceMode(mode)
      setGlobalSDKInitialized(true)
    } catch (error: any) {
      console.error('Failed to initialize global SDK:', error)
      alert(`Failed to initialize SDK: ${error?.message || 'Unknown error'}`)
    } finally {
      setSdkInitializing(false)
    }
  }

  const handleAddPanel = () => {
    const newId = String(panels.length + 1)
    setPanels([...panels, { id: newId }])
  }

  const handleRemovePanel = (panelId: string) => {
    if (panels.length <= 1) {
      return // Keep at least one panel
    }
    setPanels(panels.filter(p => p.id !== panelId))
  }

  // 注入 token 到 SDK
  const injectToken = () => {
    if (!sessionToken.trim()) {
      alert('Please enter a session token')
      return
    }
    
    if (!AvatarSDK.isInitialized) {
      alert('SDK not initialized yet. Please initialize SDK first.')
      return
    }
    
    try {
      AvatarSDK.setSessionToken(sessionToken.trim())
      console.log('Session token injected to SDK')
      alert('Session token injected successfully')
    } catch (error: any) {
      console.error('Failed to inject token:', error)
      alert(`Failed to inject token: ${error.message}`)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🚀 Avatar SDK - React Example (Multi-Avatar)</h1>
        <p>Supports multiple avatar views simultaneously</p>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {/* Notice: Get App ID and Token from Developer Platform */}
          <div style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#1f2937', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', maxWidth: '800px', textAlign: 'center', fontWeight: 600, fontSize: '15px', lineHeight: 1.5, marginBottom: '8px' }}>
            📋 <strong>Get your App ID and Session Token from the</strong>{' '}
            <a 
              href="https://dash.spatialreal.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#1e40af', textDecoration: 'underline', fontWeight: 700, margin: '0 4px' }}
            >
              Developer Platform
            </a>
            {' '}<strong>to initialize the SDK</strong>
          </div>
          {!globalSDKInitialized && !sdkInitializing && (
            <>
              {/* First row: Environment and Sample Rate */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>
                <span className="arrow-pointing-right" style={{ color: '#ff0000', fontSize: '48px', fontWeight: 'bold', lineHeight: '1', flexShrink: 0 }}>→</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <label style={{ color: 'white', fontSize: '14px', whiteSpace: 'nowrap' }}>Environment:</label>
                  <select
                    value={selectedEnvironment}
                    onChange={(e) => setSelectedEnvironment(e.target.value as Environment)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', fontSize: '14px', background: 'white', color: '#333', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <option value={Environment.intl}>International</option>
                    <option value={Environment.cn}>CN</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <label style={{ color: 'white', fontSize: '14px', whiteSpace: 'nowrap' }}>Sample Rate:</label>
                  <select
                    value={selectedSampleRate}
                    onChange={(e) => setSelectedSampleRate(parseInt(e.target.value, 10))}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', fontSize: '14px', background: 'white', color: '#333', cursor: 'pointer', flexShrink: 0 }}
                    disabled={globalSDKInitialized}
                  >
                    <option value={8000}>8000 Hz</option>
                    <option value={16000}>16000 Hz</option>
                    <option value={22050}>22050 Hz</option>
                    <option value={24000}>24000 Hz</option>
                    <option value={32000}>32000 Hz</option>
                    <option value={44100}>44100 Hz</option>
                    <option value={48000}>48000 Hz</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <label style={{ color: 'white', fontSize: '14px', whiteSpace: 'nowrap' }}>App ID:</label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="App ID"
                    disabled={globalSDKInitialized}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', fontSize: '14px', background: 'white', color: '#333', minWidth: '300px', flexShrink: 0 }}
                  />
                </div>
              </div>
              {/* Second row: Init buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                <button 
                  onClick={() => handleInitSDK(DrivingServiceMode.sdk)}
                  className="btn-init-sdk"
                >
                  🔧 Initialize SDK (SDK Mode)
                </button>
                <button 
                  onClick={() => handleInitSDK(DrivingServiceMode.host)}
                  className="btn-init-sdk"
                >
                  🔧 Initialize SDK (Host Mode)
                </button>
              </div>
            </>
          )}
          {/* Session Token input should always be visible (can be set at any time) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
            <label style={{ color: 'white', fontSize: '14px', whiteSpace: 'nowrap' }}>Session Token:</label>
            <input
              type="text"
              value={sessionToken}
              onChange={(e) => setSessionToken(e.target.value)}
              placeholder="Session Token"
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', background: 'white', color: '#333', minWidth: '300px', flexShrink: 0, cursor: 'text' }}
            />
            <button
              onClick={injectToken}
              title="Inject token to SDK"
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '14px',
                background: '#10b981',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#059669'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#10b981'
              }}
            >
              Inject
            </button>
          </div>
          {sdkInitializing && (
            <p style={{ color: '#ffeb3b', margin: 0 }}>⏳ Initializing SDK...</p>
          )}
          {globalSDKInitialized && currentDrivingServiceMode && (
            <p style={{ color: '#10b981', margin: 0 }}>
              ✅ SDK initialized ({currentDrivingServiceMode === DrivingServiceMode.sdk ? 'SDK Mode' : 'Host Mode'}, {selectedEnvironment === Environment.cn ? 'CN' : 'International'})
            </p>
          )}
          {panels.length < 4 && (
            <button 
              className="btn-add-panel-header" 
              onClick={handleAddPanel}
            >
              + Add Avatar Panel
            </button>
          )}
        </div>
      </div>

      <div className="content">
        <div className="panels-container">
          {panels.map(panel => (
            <AvatarPanel
              key={panel.id}
              panelId={panel.id}
              globalSDKInitialized={globalSDKInitialized}
              onRemove={panels.length > 1 ? () => handleRemovePanel(panel.id) : undefined}
              getSampleRate={() => selectedSampleRate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
