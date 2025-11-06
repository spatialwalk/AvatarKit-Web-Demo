# SPAvatarKit SDK 示例

SPAvatarKit practice demos in vanilla, Vue, and React

这是一个完整的 SDK 使用示例集合，展示如何在不同框架中集成和使用 SPAvatarKit SDK。

## 📋 目录

- [快速开始](#快速开始)
- [示例列表](#示例列表)
- [前置要求](#前置要求)
- [使用步骤](#使用步骤)
- [配置说明](#配置说明)
- [常见问题](#常见问题)

## 🚀 快速开始

### 1. 克隆或下载仓库

```bash
# 克隆仓库
git clone https://github.com/spatialwalk/Avatarkit-web-demo.git
cd Avatarkit-web-demo

# 或者直接下载 ZIP 文件并解压
```

### 2. 选择一个示例并安装依赖

```bash
cd vanilla  # 或 react, vue
npm install
```

### 3. 确保 SDK 已安装

示例需要安装 `@spatialwalk/avatarkit` SDK：

```bash
npm install @spatialwalk/avatarkit
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 访问示例页面

- **Vanilla JS**: http://localhost:5174/demo.html
- **Vue 3**: http://localhost:5175
- **React**: http://localhost:5176

### 6. 开始使用

1. 在界面中输入角色 ID
2. （可选）输入 Session Token（如果服务器需要认证）
3. 点击"初始化 SDK"
4. 点击"加载角色"
5. 点击"连接服务"
6. 点击"开始录音"并开始说话
7. 观察角色的实时动画效果

## 📦 示例列表

### 1. Vanilla JS 示例 (`vanilla/`)

原生 JavaScript 示例，不依赖任何框架。

**适用场景：**
- 快速原型开发
- 不依赖框架的项目
- 学习 SDK 基础用法

**运行方式：**
```bash
cd vanilla
npm install
npm run dev
```

**访问地址：** `http://localhost:5174/demo.html`

**特点：**
- 纯 JavaScript，无框架依赖
- 代码结构简单直观
- 适合快速学习和测试

### 2. Vue 3 示例 (`vue/`)

使用 Vue 3 Composition API 的完整示例。

**适用场景：**
- Vue 3 项目集成
- 需要响应式状态管理
- 组件化开发

**运行方式：**
```bash
cd vue
npm install
npm run dev
```

**访问地址：** `http://localhost:5175`

**特点：**
- Vue 3 Composition API
- TypeScript 支持
- 响应式数据绑定

### 3. React 示例 (`react/`)

使用 React Hooks 的完整示例。

**适用场景：**
- React 项目集成
- 需要函数式编程风格
- 现代 React 开发

**运行方式：**
```bash
cd react
npm install
npm run dev
```

**访问地址：** `http://localhost:5176`

**特点：**
- React Hooks
- TypeScript 支持
- 函数式组件

## ⚙️ 前置要求

在运行示例之前，请确保满足以下要求：

- **Node.js** >= 16.0.0
- **npm/yarn/pnpm** 包管理器
- **现代浏览器**（支持 Web Audio API、WebSocket、WASM）
  - Chrome >= 90
  - Firefox >= 88
  - Safari >= 14.1
  - Edge >= 90
- **麦克风权限**（用于录音功能）
- **SDK 包**已安装（在示例目录中运行 `npm install @spatialwalk/avatarkit`）

## 📝 使用步骤

所有示例都遵循相同的基本流程：

1. **初始化 SDK** - 配置环境和认证信息
   - 选择环境（US/CN/Test）
   - （可选）输入 Session Token

2. **输入角色 ID** - 指定要加载的角色
   - 从 SDK 管理平台获取角色 ID

3. **加载角色** - 下载并初始化角色资源
   - SDK 会自动下载角色模型和纹理
   - 显示加载进度

4. **连接服务** - 建立 WebSocket 连接
   - 连接到实时动画服务
   - 等待连接成功

5. **开始录音** - 捕获音频并发送到服务器
   - 浏览器会请求麦克风权限
   - 开始说话，音频会被实时发送
   - 服务端积累到一定音频数据后会自动开始播放动画和音频
   - 停止录音时发送 `end=true` 可立即返回剩余的动画数据

6. **实时渲染** - 接收动画数据并渲染到 Canvas
   - 角色会根据音频实时生成动画
   - 可以看到角色的嘴部、表情等动画

## 🔧 配置说明

### 环境配置

示例支持三种环境：

- **`test`** - 测试环境（默认）
- **`us`** - 美国生产环境
- **`cn`** - 中国生产环境

### Session Token（可选）

如果服务器需要认证，需要提供有效的 Session Token：

- 在界面中输入 Session Token
- 或通过代码配置（查看各示例的源代码）

### 角色 ID

角色 ID 可以从 SDK 管理平台获取，用于标识要加载的虚拟角色。

## 🔧 技术细节

- **SDK 导入**：所有示例都使用标准的 npm 包导入方式 `import('@spatialwalk/avatarkit')`
- **动画数据**：FLAME 参数关键帧序列
- **音频格式**：16kHz PCM16 格式（由 SDK 自动处理）
- **WASM 支持**：所有示例都配置了正确的 WASM MIME 类型
- **渲染后端**：自动选择 WebGPU 或 WebGL

## ❓ 常见问题

### Q: 如何获取 Session Token？

A: Session Token 需要从 SDK 提供商获取。请联系 SDK 提供商或查看 SDK 主文档获取更多信息。

### Q: 示例运行后看不到角色？

A: 请检查以下几点：
- 角色 ID 是否正确
- 网络连接是否正常
- 浏览器控制台是否有错误信息
- 是否已经成功加载角色（查看日志面板）

### Q: 录音功能不工作？

A: 确保：
- 浏览器已授权麦克风权限
- 使用 HTTPS 或 localhost（某些浏览器要求）
- 检查浏览器控制台的错误信息

### Q: WebSocket 连接失败？

A: 可能的原因：
- 网络连接问题
- Session Token 无效或过期
- 服务器地址配置错误
- 检查浏览器控制台的错误信息

### Q: SDK 如何安装？

A: 通过 npm 安装：
```bash
npm install @spatialwalk/avatarkit
```

### Q: 支持哪些浏览器？

A: 支持所有现代浏览器：
- Chrome >= 90
- Firefox >= 88
- Safari >= 14.1
- Edge >= 90

### Q: 可以在移动设备上运行吗？

A: 可以，但需要：
- 支持 Web Audio API 的移动浏览器
- HTTPS 连接（用于麦克风权限）
- 足够的性能来运行 3D 渲染

### Q: 如何修改端口号？

A: 在每个示例的 `vite.config.ts` 中修改 `server.port` 配置。

## 📚 更多信息

- 查看每个示例目录下的 `README.md` 了解详细说明
- 查看示例源代码了解具体实现细节
- 如有问题，请提交 [GitHub Issue](https://github.com/spatialwalk/Avatarkit-web-demo/issues)
