# React Example

This is a SPAvatarKit SDK example using React Hooks with multi-character panel support, demonstrating how to integrate the SDK in a React application.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Navigate to react example directory
cd react

# Install dependencies
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access Example

Open browser and visit: `http://localhost:5176`

## 📋 Features

- ✅ SDK state management using React Hooks with `useCallback` optimization
- ✅ Functional components
- ✅ Lifecycle management (useEffect)
- ✅ TypeScript support
- ✅ Reactive state updates
- ✅ Complete error handling
- ✅ Resource cleanup (on component unmount)
- ✅ Multi-character panel support (up to 4 simultaneous instances)
- ✅ Global SDK initialization with lazy loading
- ✅ Independent panel state management
- ✅ Audio volume control (0-100% slider)
- ✅ SDK Mode: Real-time audio streaming via WebSocket
- ✅ Host Mode: Pre-recorded audio and animation playback (requires server-side SDK for keyframe generation)

## 🎯 Use Cases

- React project integration
- Functional programming style needed
- Modern React development
- Type-safe projects

## 🔧 Tech Stack

- **React 18** - UI framework
- **React Hooks** - State management
- **Vite** - Development server and build tool
- **TypeScript** - Type safety

## 📖 Code Explanation

### Usage Example

The code uses a modular design, with the main entry point in `src/App.tsx`:

```typescript
// src/App.tsx
import { useLogger } from './hooks/useLogger'
import { useAudioRecorder } from './hooks/useAudioRecorder'
import { useAvatarSDK } from './hooks/useAvatarSDK'

function App() {
  const logger = useLogger()
  const audioRecorder = useAudioRecorder()
  const sdk = useAvatarSDK()
  
  // Use Hooks to handle business logic
}
```

### Key Hooks

#### 1. useAvatarSDK Hook

Manages SDK initialization and state:

```typescript
const sdk = useAvatarSDK()

// Initialize
await sdk.initialize(environment, sessionToken)

// Load character
await sdk.loadCharacter(characterId, canvasContainer, callbacks)

// Connect service
await sdk.connect()
```

#### 2. useAudioRecorder Hook

Handles audio recording:

```typescript
const audioRecorder = useAudioRecorder()

// Start recording
await audioRecorder.start()

// Stop recording and get processed audio data
const audioBuffer = await audioRecorder.stop()
```

#### 3. useLogger Hook

Manages logs and status:

```typescript
const logger = useLogger()

logger.log('info', 'Message')
logger.updateStatus('Status message', 'success')
logger.clearLogs()
```

### Component Description

- **StatusBar** - Displays current status
- **ControlPanel** - Control buttons and forms
- **LogPanel** - Log display
- **AvatarCanvas** - Canvas container (using forwardRef)

### Code Flow

1. **Initialization** - Use `useLogger`, `useAudioRecorder`, `useAvatarSDK` Hooks
2. **User Interaction** - Call Hook methods through event handlers
3. **State Management** - Hooks manage state internally, components only handle UI
4. **Resource Cleanup** - Hooks automatically handle cleanup logic

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

### Character ID

Get character ID from SDK management platform.

## 📁 Project Structure

```
react/
├── src/
│   ├── components/          # UI components
│   │   ├── StatusBar.tsx    # Status bar component
│   │   ├── ControlPanel.tsx # Control panel component
│   │   ├── LogPanel.tsx     # Log panel component
│   │   └── AvatarCanvas.tsx # Canvas container component
│   ├── hooks/               # Custom Hooks
│   │   ├── useLogger.ts     # Logger Hook
│   │   ├── useAudioRecorder.ts # Audio recording Hook
│   │   └── useAvatarSDK.ts  # SDK Hook
│   ├── utils/               # Utility functions
│   │   └── audioUtils.ts    # Audio processing utilities
│   ├── types/               # Type definitions
│   │   └── index.ts         # Type definitions
│   ├── App.tsx              # Main app component (assembly only)
│   ├── App.css              # Styles
│   ├── main.tsx             # Entry file
│   └── vite-env.d.ts        # Vite type definitions
├── index.html               # HTML entry
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

### Code Structure Explanation

The code is organized following React best practices:

- **Componentization** - UI split into independent functional components
- **Hook Extraction** - Business logic encapsulated as reusable Hooks
- **Type Safety** - Complete TypeScript type definitions
- **Separation of Concerns** - Each file has a single responsibility

This structure makes the code:
- ✅ Easy to maintain (components and Hooks are independent)
- ✅ Easy to test (each Hook and component can be tested separately)
- ✅ Easy to reuse (Hooks can be reused in other components)
- ✅ Follows React best practices

## 💡 React Best Practices

### Using useRef to Store Latest Values

```typescript
const avatarViewRef = useRef<AvatarView | null>(null)

useEffect(() => {
  avatarViewRef.current = avatarView
}, [avatarView])
```

This ensures access to the latest value in cleanup functions.

### State Synchronization

Use `useState` to manage reactive state, use `useRef` to store values that need to be accessed in cleanup functions.

## ⚠️ Notes

- Requires browser support for Web Audio API, WebSocket, and WASM
- Requires user authorization for microphone permission
- Ensure `@spatialwalk/avatarkit` SDK is installed: `npm install @spatialwalk/avatarkit`
- Resources are automatically cleaned up on component unmount, no manual management needed
- **Host Mode**: Requires the SPAvatar digital human server-side SDK to generate animation keyframes from audio. The example uses pre-generated data files for demonstration. In production, you must integrate with the server-side SDK.

## 🔍 View Code

Main code files:

- **`src/App.tsx`** - Main app component, integrates all Hooks and components
- **`src/hooks/useAvatarSDK.ts`** - SDK management logic
- **`src/hooks/useAudioRecorder.ts`** - Audio recording logic
- **`src/hooks/useLogger.ts`** - Log and status management
- **`src/components/`** - UI component directory

Each module has clear responsibilities, making it easy to understand and maintain. Check the source code for specific implementation details.
