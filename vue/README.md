# Vue 3 Example

This is an AvatarKit SDK example using Vue 3 Composition API with multi-avatar panel support, demonstrating how to integrate the SDK in a Vue application.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Navigate to vue example directory
cd vue

# Install dependencies
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access Example

Open browser and visit: `http://localhost:5175`

## 📋 Features

- ✅ SDK state management using Vue 3 Composition API
- ✅ Reactive data binding
- ✅ Component-based architecture
- ✅ Lifecycle management (onUnmounted)
- ✅ TypeScript support
- ✅ Computed properties control button state
- ✅ Complete error handling
- ✅ Resource cleanup (on component unmount)
- ✅ Multi-avatar panel support (up to 4 simultaneous instances)
- ✅ Global SDK initialization with lazy loading
- ✅ Independent panel state management
- ✅ Audio volume control (0-100% slider)
- ✅ SDK Mode: Real-time audio streaming via WebSocket
- ✅ Host Mode: Pre-recorded audio and animation playback (requires server-side SDK for keyframe generation)

## 🎯 Use Cases

- Vue 3 project integration
- Reactive state management needed
- Component-based development
- Type-safe projects

## 🔧 Tech Stack

- **Vue 3** - UI framework
- **Composition API** - Composition API
- **Vite** - Development server and build tool
- **TypeScript** - Type safety

## 📖 Code Explanation

### Key Steps

#### 1. SDK Initialization (using Composition API)

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

#### 2. Load Avatar

```typescript
const avatarView = ref<AvatarView | null>(null)
const canvasContainerRef = ref<HTMLElement | null>(null)

async function handleLoadAvatar() {
  avatarManager.value = AvatarManager.shared
  const avatar = await avatarManager.value.load(avatarId.value)
  avatarView.value = new AvatarView(avatar, canvasContainerRef.value!)
}
```

#### 3. Connect Service

```typescript
const avatarController = ref<AvatarController | null>(null)

async function handleConnect() {
  await avatarView.value!.avatarController.start()
  avatarController.value = avatarView.value!.avatarController
}
```

#### 4. Computed Properties Control Button State

```typescript
const canInit = computed(() => !isInitialized.value)
const canLoad = computed(() => isInitialized.value && !avatarManager.value)
const canConnect = computed(() => !!avatarView.value && !avatarController.value)
```

#### 5. Resource Cleanup

```typescript
onUnmounted(async () => {
  // Clean up resources when component unmounts
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

## 🔑 Configuration

### Environment Configuration

- **`intl`** - International production environment (default)
- **`cn`** - China production environment

### Session Token (Required)

**All environments now require a Session Token for authentication.**

**Quick Setup:**
1. Click the **"Auto"** button next to the "Session Token" input field
2. The button will generate a temporary token valid for 1 hour
3. The token will be automatically filled into the input field
4. **Important**: Generate the token **before** initializing the SDK, so it will be automatically set during initialization
5. If SDK is already initialized, the token will be set immediately when generated

**Manual Entry:**
- You can also manually enter a Session Token if you have one
- The token must be valid and not expired

### Avatar ID

Get avatar ID from SDK management platform.

## 📁 Project Structure

```
vue/
├── src/
│   ├── components/          # UI components
│   │   ├── StatusBar.vue    # Status bar component
│   │   ├── ControlPanel.vue # Control panel component
│   │   ├── LogPanel.vue     # Log panel component
│   │   └── AvatarCanvas.vue # Canvas container component
│   ├── composables/         # Composables
│   │   ├── useLogger.ts     # Logger composable
│   │   ├── useAudioRecorder.ts # Audio recording composable
│   │   └── useAvatarSDK.ts  # SDK composable
│   ├── utils/               # Utility functions
│   │   └── audioUtils.ts    # Audio processing utilities
│   ├── types/               # Type definitions
│   │   └── index.ts         # Type definitions
│   ├── App.vue              # Main app component
│   ├── main.ts              # Entry file
│   └── vite-env.d.ts        # Vite type definitions
├── index.html               # HTML entry
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## 💡 Vue 3 Best Practices

### Using ref to Manage Reactive State

```typescript
const avatarView = ref<AvatarView | null>(null)
const isRecording = ref(false)
```

### Using computed Properties

```typescript
const canStartRecord = computed(() => 
  !!avatarController.value && !isRecording.value
)
```

### Using onUnmounted to Clean Up Resources

Ensure SDK resources are properly cleaned up when component unmounts to avoid memory leaks.

## ⚠️ Notes

- Requires browser support for Web Audio API, WebSocket, and WASM
- Requires user authorization for microphone permission
- Ensure `@spatialwalk/avatarkit` SDK is installed: `npm install @spatialwalk/avatarkit`
- Resources are automatically cleaned up on component unmount, no manual management needed
- **Host Mode**: Requires the Avatar digital human server-side SDK to generate animation keyframes from audio. The example uses pre-generated data files for demonstration. In production, you must integrate with the server-side SDK.

## 🔍 View Code

Main code is in `src/App.vue`, including:
- Vue 3 Composition API
- Reactive state management
- Computed properties
- SDK integration logic

Check the source code for specific implementation details.
