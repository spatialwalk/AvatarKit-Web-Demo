/**
 * Main application component
 * Supports multiple avatar panels
 */

import { useState, useEffect } from 'react'
import { AvatarPanel } from './components/AvatarPanel'
import { AvatarKit, Environment, DrivingServiceMode } from '@spatialwalk/avatarkit'
import './App.css'

interface Panel {
  id: string
}

function App() {
  const [panels, setPanels] = useState<Panel[]>([{ id: '1' }])
  const [globalSDKInitialized, setGlobalSDKInitialized] = useState(false)
  const [sdkInitializing, setSdkInitializing] = useState(false)
  const [currentDrivingServiceMode, setCurrentDrivingServiceMode] = useState<DrivingServiceMode | null>(null)
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(Environment.test)
  const [sessionToken, setSessionToken] = useState('')

  // 检查是否已经初始化
  useEffect(() => {
    if (AvatarKit.isInitialized) {
      setGlobalSDKInitialized(true)
      setCurrentDrivingServiceMode(AvatarKit.configuration?.drivingServiceMode || DrivingServiceMode.sdk)
    }
  }, [])

  // 手动初始化 SDK (SDK Mode)
  const handleInitSDK = async (mode: DrivingServiceMode) => {
    if (AvatarKit.isInitialized || sdkInitializing) {
      return
    }
    
    try {
      setSdkInitializing(true)
      await AvatarKit.initialize('demo', { 
        environment: selectedEnvironment,
        drivingServiceMode: mode
      })
      
      // Set Session Token if provided
      if (sessionToken.trim()) {
        AvatarKit.setSessionToken(sessionToken.trim())
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

  return (
    <div className="container">
      <div className="header">
        <h1>🚀 SPAvatar SDK - React Example (Multi-Character)</h1>
        <p>支持同时显示多个角色视图</p>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {!globalSDKInitialized && !sdkInitializing && (
            <>
              {/* First row: Environment and Session Token */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>
                <span className="arrow-pointing-right" style={{ color: '#ff0000', fontSize: '48px', fontWeight: 'bold', lineHeight: '1', flexShrink: 0 }}>→</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <label style={{ color: 'white', fontSize: '14px', whiteSpace: 'nowrap' }}>Environment:</label>
                  <select
                    value={selectedEnvironment}
                    onChange={(e) => setSelectedEnvironment(e.target.value as Environment)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', fontSize: '14px', background: 'white', color: '#333', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <option value={Environment.test}>Test</option>
                    <option value={Environment.cn}>CN</option>
                    <option value={Environment.intl}>International</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <label style={{ color: 'white', fontSize: '14px', whiteSpace: 'nowrap' }}>Session Token:</label>
                  <input
                    type="text"
                    value={sessionToken}
                    onChange={(e) => setSessionToken(e.target.value)}
                    placeholder="Session Token (optional)"
                    style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', fontSize: '14px', background: 'white', color: '#333', minWidth: '200px', flexShrink: 0 }}
                    disabled={globalSDKInitialized}
                  />
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
          {sdkInitializing && (
            <p style={{ color: '#ffeb3b', margin: 0 }}>⏳ 正在初始化 SDK...</p>
          )}
          {globalSDKInitialized && currentDrivingServiceMode && (
            <p style={{ color: '#10b981', margin: 0 }}>
              ✅ SDK 已初始化 ({currentDrivingServiceMode === DrivingServiceMode.sdk ? 'SDK Mode' : 'Host Mode'}, {selectedEnvironment === Environment.cn ? 'CN' : selectedEnvironment === Environment.intl ? 'International' : 'Test'})
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
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
