# React 示例

这是一个使用 React Hooks 的 SPAvatarKit SDK 示例，展示如何在 React 应用中集成 SDK。

## 🚀 快速开始

### 1. 安装依赖

```bash
# 进入 react 示例目录
cd react

# 安装依赖
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问示例

打开浏览器访问：`http://localhost:5176`

## 📋 功能特性

- ✅ 使用 React Hooks 管理 SDK 状态
- ✅ 函数式组件
- ✅ 生命周期管理（useEffect）
- ✅ TypeScript 支持
- ✅ 响应式状态更新
- ✅ 完整的错误处理
- ✅ 资源清理（组件卸载时）

## 🎯 适用场景

- React 项目集成
- 需要函数式编程风格
- 现代 React 开发
- 需要类型安全的项目

## 🔧 技术栈

- **React 18** - UI 框架
- **React Hooks** - 状态管理
- **Vite** - 开发服务器和构建工具
- **TypeScript** - 类型安全

## 📖 代码说明

### 使用示例

代码采用模块化设计，主要入口在 `src/App.tsx`：

```typescript
// src/App.tsx
import { useLogger } from './hooks/useLogger'
import { useAudioRecorder } from './hooks/useAudioRecorder'
import { useAvatarSDK } from './hooks/useAvatarSDK'

function App() {
  const logger = useLogger()
  const audioRecorder = useAudioRecorder()
  const sdk = useAvatarSDK()
  
  // 使用 Hooks 处理业务逻辑
}
```

### 关键 Hooks

#### 1. useAvatarSDK Hook

管理 SDK 的初始化和状态：

```typescript
const sdk = useAvatarSDK()

// 初始化
await sdk.initialize(environment, sessionToken)

// 加载角色
await sdk.loadCharacter(characterId, canvasContainer, callbacks)

// 连接服务
await sdk.connect()
```

#### 2. useAudioRecorder Hook

处理音频录制：

```typescript
const audioRecorder = useAudioRecorder()

// 开始录音
await audioRecorder.start()

// 停止录音并获取处理后的音频数据
const audioBuffer = await audioRecorder.stop()
```

#### 3. useLogger Hook

管理日志和状态：

```typescript
const logger = useLogger()

logger.log('info', '消息')
logger.updateStatus('状态消息', 'success')
logger.clearLogs()
```

### 组件说明

- **StatusBar** - 显示当前状态
- **ControlPanel** - 控制按钮和表单
- **LogPanel** - 日志显示
- **AvatarCanvas** - Canvas 容器（使用 forwardRef）

### 代码流程

1. **初始化** - 使用 `useLogger`、`useAudioRecorder`、`useAvatarSDK` Hooks
2. **用户交互** - 通过事件处理器调用 Hooks 方法
3. **状态管理** - Hooks 内部管理状态，组件只负责 UI
4. **资源清理** - Hooks 自动处理清理逻辑

## 🔑 配置说明

### 环境配置

- **`test`** - 测试环境（默认）
- **`us`** - 美国生产环境
- **`cn`** - 中国生产环境

### Session Token（可选）

在界面中输入 Session Token，或通过代码配置。

### 角色 ID

从 SDK 管理平台获取角色 ID。

## 📁 项目结构

```
react/
├── src/
│   ├── components/          # UI 组件
│   │   ├── StatusBar.tsx    # 状态栏组件
│   │   ├── ControlPanel.tsx # 控制面板组件
│   │   ├── LogPanel.tsx     # 日志面板组件
│   │   └── AvatarCanvas.tsx # Canvas 容器组件
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useLogger.ts     # 日志 Hook
│   │   ├── useAudioRecorder.ts # 录音 Hook
│   │   └── useAvatarSDK.ts  # SDK Hook
│   ├── utils/               # 工具函数
│   │   └── audioUtils.ts    # 音频处理工具
│   ├── types/               # 类型定义
│   │   └── index.ts         # 类型定义
│   ├── App.tsx              # 主应用组件（仅组装）
│   ├── App.css              # 样式文件
│   ├── main.tsx             # 入口文件
│   └── vite-env.d.ts        # Vite 类型定义
├── index.html               # HTML 入口
├── package.json             # 依赖配置
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── README.md                # 本文件
```

### 代码结构说明

代码采用 React 最佳实践组织：

- **组件化** - UI 拆分为独立的功能组件
- **Hooks 提取** - 业务逻辑封装为可复用的 Hooks
- **类型安全** - 完整的 TypeScript 类型定义
- **关注点分离** - 每个文件职责单一

这种结构使得代码：
- ✅ 易于维护（组件和 Hooks 独立）
- ✅ 易于测试（可以单独测试每个 Hook 和组件）
- ✅ 易于复用（Hooks 可以在其他组件中复用）
- ✅ 符合 React 最佳实践

## 💡 React 最佳实践

### 使用 useRef 保存最新值

```typescript
const avatarViewRef = useRef<AvatarView | null>(null)

useEffect(() => {
  avatarViewRef.current = avatarView
}, [avatarView])
```

这样可以确保在清理函数中访问到最新的值。

### 状态同步

使用 `useState` 管理响应式状态，使用 `useRef` 保存需要在清理函数中访问的值。

## ⚠️ 注意事项

- 需要浏览器支持 Web Audio API、WebSocket 和 WASM
- 需要用户授权麦克风权限
- 确保已安装 `@spatialwalk/avatarkit` SDK：`npm install @spatialwalk/avatarkit`
- 组件卸载时会自动清理资源，无需手动管理

## 🔍 查看代码

主要代码文件：

- **`src/App.tsx`** - 主应用组件，整合所有 Hooks 和组件
- **`src/hooks/useAvatarSDK.ts`** - SDK 管理逻辑
- **`src/hooks/useAudioRecorder.ts`** - 音频录制逻辑
- **`src/hooks/useLogger.ts`** - 日志和状态管理
- **`src/components/`** - UI 组件目录

每个模块都有清晰的职责，便于理解和维护。查看源代码了解具体实现细节。

