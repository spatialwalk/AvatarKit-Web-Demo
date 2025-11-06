# Vanilla JS 示例

这是一个使用原生 JavaScript 的 SPAvatarKit SDK 示例，展示如何在不使用任何框架的情况下集成 SDK。

## 🚀 快速开始

### 1. 安装依赖

```bash
# 进入 vanilla 示例目录
cd vanilla

# 安装依赖
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问示例

打开浏览器访问：`http://localhost:5174/demo.html`

## 📋 功能特性

- ✅ SDK 初始化
- ✅ 角色加载（支持进度显示）
- ✅ WebSocket 连接管理
- ✅ 实时音频录制和发送
- ✅ 动画实时渲染
- ✅ 打断对话功能
- ✅ 日志面板（实时状态显示）

## 🎯 适用场景

- 快速原型开发
- 不依赖框架的项目
- 学习 SDK 基础用法
- 作为其他框架示例的参考

## 🔧 技术栈

- **原生 JavaScript** (ES Modules)
- **Vite** - 开发服务器和构建工具

## 📖 代码说明

### 使用示例

代码采用模块化设计，主要入口在 `src/js/app.js`：

```javascript
// src/js/app.js
import { Logger, updateStatus } from './logger.js'
import { AudioRecorder } from './audioRecorder.js'
import { AvatarSDKManager } from './avatarSDK.js'

// 初始化应用
const app = new App()
```

### 关键模块

#### 1. SDK 管理 (`src/js/avatarSDK.js`)

```javascript
const sdkManager = new AvatarSDKManager(logger)

// 初始化 SDK
await sdkManager.initialize(environment, sessionToken)

// 加载角色
await sdkManager.loadCharacter(characterId, canvasContainer, callbacks)

// 连接服务
await sdkManager.connect()
```

#### 2. 音频录制 (`src/js/audioRecorder.js`)

```javascript
const audioRecorder = new AudioRecorder()

// 开始录音
await audioRecorder.start()

// 停止录音并获取处理后的音频数据
const audioBuffer = await audioRecorder.stop()
```

#### 3. 日志系统 (`src/js/logger.js`)

```javascript
const logger = new Logger(logPanel)

logger.info('信息')
logger.success('成功')
logger.warning('警告')
logger.error('错误')
```

### 代码流程

1. **初始化阶段** - `App` 类创建实例，加载 SDK
2. **用户交互** - 通过事件监听器处理按钮点击
3. **SDK 操作** - 通过 `AvatarSDKManager` 封装类管理 SDK
4. **音频处理** - 通过 `AudioRecorder` 类处理录音和音频格式转换
5. **状态更新** - 通过 `Logger` 和 `updateStatus` 更新 UI

## 🔑 配置说明

### 环境配置

- **`test`** - 测试环境（默认）
- **`us`** - 美国生产环境
- **`cn`** - 中国生产环境

### Session Token（可选）

如果服务器需要认证，在界面中输入有效的 Session Token。

### 角色 ID

从 SDK 管理平台获取角色 ID，用于加载指定的虚拟角色。

## 📁 项目结构

```
vanilla/
├── demo.html              # 主演示页面（HTML 结构）
├── index.html             # 入口页面
├── package.json           # 依赖配置
├── vite.config.ts         # Vite 配置
├── src/
│   ├── styles/
│   │   └── main.css       # 样式文件
│   ├── js/
│   │   ├── app.js         # 主应用逻辑
│   │   ├── logger.js      # 日志系统
│   │   ├── audioRecorder.js # 音频录制功能
│   │   └── avatarSDK.js   # SDK 封装
│   └── utils/
│       └── audioUtils.js  # 音频处理工具
└── README.md              # 本文件
```

### 代码结构说明

代码按照关注点分离原则组织：

- **`demo.html`** - 只包含 HTML 结构，引用外部 CSS 和 JS
- **`src/styles/main.css`** - 所有样式定义
- **`src/js/app.js`** - 主应用类，整合所有模块，处理用户交互
- **`src/js/logger.js`** - 日志系统和状态更新工具
- **`src/js/audioRecorder.js`** - 音频录制功能封装
- **`src/js/avatarSDK.js`** - SDK 初始化和管理的封装
- **`src/utils/audioUtils.js`** - 音频处理工具函数（重采样、格式转换等）

这种结构使得代码：
- ✅ 易于维护（每个文件职责单一）
- ✅ 易于测试（功能模块独立）
- ✅ 易于扩展（添加新功能只需新增模块）
- ✅ 符合最佳实践（关注点分离）

## ⚠️ 注意事项

- 需要浏览器支持 Web Audio API、WebSocket 和 WASM
- 需要用户授权麦克风权限
- 建议使用 HTTPS 或 localhost（某些浏览器要求）
- 确保已安装 `@spatialwalk/avatarkit` SDK：`npm install @spatialwalk/avatarkit`

## 🔍 查看代码

代码已经模块化，主要文件：

- **`src/js/app.js`** - 主应用逻辑，整合所有模块
- **`src/js/avatarSDK.js`** - SDK 封装，处理初始化和角色管理
- **`src/js/audioRecorder.js`** - 音频录制和处理
- **`src/js/logger.js`** - 日志和状态管理
- **`src/utils/audioUtils.js`** - 音频工具函数

每个模块都有清晰的职责，便于理解和维护。查看源代码了解具体实现细节。

