# Vue 3 Example

This is a SPAvatarKit SDK example using Vue 3 Composition API with multi-character panel support, demonstrating how to integrate the SDK in a Vue application.

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
- ✅ Multi-character panel support (up to 4 simultaneous instances)
- ✅ Global SDK initialization with lazy loading
- ✅ Independent panel state management
- ✅ Network Mode: Real-time audio streaming via WebSocket
- ✅ External Data Mode: Pre-recorded audio and animation playback (requires server-side SDK for keyframe generation)

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

#### 2. Load Character

```typescript
const avatarView = ref<AvatarView | null>(null)
const canvasContainerRef = ref<HTMLElement | null>(null)

async function handleLoadCharacter() {
  avatarManager.value = AvatarManager.shared
  const avatar = await avatarManager.value.load(characterId.value)
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

- **`test`** - Test environment (default)
- **`us`** - US production environment
- **`cn`** - China production environment

### Session Token (Optional)

Enter Session Token in the interface, or configure via code.

### Character ID

Get character ID from SDK management platform.

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
- **External Data Mode**: Requires the SPAvatar digital human server-side SDK to generate animation keyframes from audio. The example uses pre-generated data files for demonstration. In production, you must integrate with the server-side SDK.

## 🔍 View Code

Main code is in `src/App.vue`, including:
- Vue 3 Composition API
- Reactive state management
- Computed properties
- SDK integration logic

Check the source code for specific implementation details.
