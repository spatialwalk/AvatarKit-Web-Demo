# Vue 3 示例

这是一个使用 Vue 3 Composition API 的 SPAvatarKit SDK 示例，展示如何在 Vue 应用中集成 SDK。

## 🚀 快速开始

### 1. 安装依赖

```bash
# 进入 vue 示例目录
cd vue

# 安装依赖
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问示例

打开浏览器访问：`http://localhost:5175`

## 📋 功能特性

- ✅ 使用 Vue 3 Composition API 管理 SDK 状态
- ✅ 响应式数据绑定
- ✅ 组件化架构
- ✅ 生命周期管理（onUnmounted）
- ✅ TypeScript 支持
- ✅ 计算属性（computed）控制按钮状态
- ✅ 完整的错误处理
- ✅ 资源清理（组件卸载时）

## 🎯 适用场景

- Vue 3 项目集成
- 需要响应式状态管理
- 组件化开发
- 需要类型安全的项目

## 🔧 技术栈

- **Vue 3** - UI 框架
- **Composition API** - 组合式 API
- **Vite** - 开发服务器和构建工具
- **TypeScript** - 类型安全

## 📖 代码说明

### 关键步骤

#### 1. SDK 初始化（使用 Composition API）

```typescript
const isInitialized = ref(false)

async function handleInit() {
  await AvatarKit.initialize('demo', {
    environment: environment.value,
    sessionToken: sessionToken.value || undefined,
  })
  isInitialized.value = true
}
```

#### 2. 加载角色

```typescript
const avatarView = ref<AvatarView | null>(null)
const canvasContainerRef = ref<HTMLElement | null>(null)

async function handleLoadCharacter() {
  avatarManager.value = AvatarManager.shared
  const avatar = await avatarManager.value.load(characterId.value)
  avatarView.value = new AvatarView(avatar, canvasContainerRef.value!)
}
```

#### 3. 连接服务

```typescript
const avatarController = ref<AvatarController | null>(null)

async function handleConnect() {
  await avatarView.value!.avatarController.start()
  avatarController.value = avatarView.value!.avatarController
}
```

#### 4. 计算属性控制按钮状态

```typescript
const canInit = computed(() => !isInitialized.value)
const canLoad = computed(() => isInitialized.value && !avatarManager.value)
const canConnect = computed(() => !!avatarView.value && !avatarController.value)
```

#### 5. 资源清理

```typescript
onUnmounted(async () => {
  // 组件卸载时清理资源
  if (avatarController.value) {
    avatarController.value.close()
  }
  if (avatarView.value) {
    await avatarView.value.dispose()
  }
  if (isInitialized.value) {
    AvatarKit.cleanup()
  }
})
```

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
vue/
├── src/
│   ├── App.vue         # 主应用组件
│   ├── main.ts         # 入口文件
│   └── vite-env.d.ts   # Vite 类型定义
├── index.html          # HTML 入口
├── package.json        # 依赖配置
├── vite.config.ts      # Vite 配置
├── tsconfig.json       # TypeScript 配置
└── README.md           # 本文件
```

## 💡 Vue 3 最佳实践

### 使用 ref 管理响应式状态

```typescript
const avatarView = ref<AvatarView | null>(null)
const isRecording = ref(false)
```

### 使用 computed 计算属性

```typescript
const canStartRecord = computed(() => 
  !!avatarController.value && !isRecording.value
)
```

### 使用 onUnmounted 清理资源

确保在组件卸载时正确清理 SDK 资源，避免内存泄漏。

## ⚠️ 注意事项

- 需要浏览器支持 Web Audio API、WebSocket 和 WASM
- 需要用户授权麦克风权限
- 确保已安装 `@spatialwalk/avatarkit` SDK：`npm install @spatialwalk/avatarkit`
- 组件卸载时会自动清理资源，无需手动管理

## 🔍 查看代码

主要代码在 `src/App.vue` 中，包含：
- Vue 3 Composition API
- 响应式状态管理
- 计算属性
- SDK 集成逻辑

查看源代码了解具体实现细节。

