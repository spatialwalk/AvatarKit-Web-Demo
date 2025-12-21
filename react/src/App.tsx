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
      await AvatarSDK.initialize('app_mj8526em_9fpt9s', { 
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
    } catch (error) {
      console.error('Failed to initialize global SDK:', error)
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
      return // 至少保留一个面板
    }
    setPanels(panels.filter(p => p.id !== panelId))
  }

  const generateTemporaryToken = async () => {
    try {
      // Get environment
      const isCN = selectedEnvironment === Environment.cn
      const consoleApiHost = isCN ? 'console.open.spatialwalk.top' : 'console.ap-northeast.spatialwalk.cloud'
      
      // Calculate expireAt (current timestamp + 1 hour)
      const expireAt = Math.floor(Date.now() / 1000) + 3600
      
      // API Key
      const apiKey = 'sk-Z_8IsL6HU-2s5A-_QjwSagW_iiQx0TwtEiY5dLrgP68='
      
      // Make API request
      const response = await fetch(`https://${consoleApiHost}/v1/console/session-tokens`, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expireAt: expireAt,
          modelVersion: ''
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to generate token: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      const token = data.token || data.sessionToken || data.data?.token || data.data?.sessionToken
      
      if (token) {
        setSessionToken(token)
        
        // 如果 SDK 已初始化，立即设置 token
        if (AvatarSDK.isInitialized) {
          AvatarSDK.setSessionToken(token)
          console.log('Temporary token generated and set to SDK')
        } else {
          console.log('Temporary token generated (will be set when SDK initializes)')
        }
      } else {
        throw new Error('Token not found in response')
      }
    } catch (error: any) {
      console.error('Failed to generate temporary token:', error)
      alert(`生成临时 token 失败: ${error.message}`)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🚀 SPAvatar SDK - React Example (Multi-Character)</h1>
        <p>支持同时显示多个角色视图</p>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative' }}>
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
              </div>
              {/* Second row: Init buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                <button 
                  onClick={() => handleInitSDK(DrivingServiceMode.sdk)}
                  className="btn-init-sdk"
                >
                  🔧 初始化 SDK (SDK Mode)
                </button>
                <button 
                  onClick={() => handleInitSDK(DrivingServiceMode.host)}
                  className="btn-init-sdk"
                >
                  🔧 初始化 SDK (Host Mode)
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
              readOnly
              placeholder="Session Token (auto-generated only)"
              style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', fontSize: '14px', background: '#f0f0f0', color: '#666', minWidth: '200px', flexShrink: 0, cursor: 'not-allowed' }}
            />
            <button
              onClick={generateTemporaryToken}
              title="生成临时token，有效期1小时"
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
              Auto
            </button>
          </div>
          {sdkInitializing && (
            <p style={{ color: '#ffeb3b', margin: 0 }}>⏳ 正在初始化 SDK...</p>
          )}
          {globalSDKInitialized && currentDrivingServiceMode && (
            <p style={{ color: '#10b981', margin: 0 }}>
              ✅ SDK 已初始化 ({currentDrivingServiceMode === DrivingServiceMode.sdk ? 'SDK Mode' : 'Host Mode'}, {selectedEnvironment === Environment.cn ? 'CN' : 'International'})
            </p>
          )}
          {panels.length < 4 && (
            <button 
              className="btn-add-panel-header" 
              onClick={handleAddPanel}
            >
              + 添加角色面板
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
