# SPAvatarKit SDK Examples

SPAvatarKit practice demos in vanilla, Vue, React, and Next.js

This is a complete SDK usage example collection demonstrating how to integrate and use the SPAvatarKit SDK in different frameworks.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Example List](#example-list)
- [Prerequisites](#prerequisites)
- [Usage Steps](#usage-steps)
- [Configuration](#configuration)
- [FAQ](#faq)

## 🚀 Quick Start

### 1. Clone or Download the Repository

```bash
# Clone the repository
git clone https://github.com/spatialwalk/AvatarKit-Web-Demo.git
cd AvatarKit-Web-Demo

# Or download the ZIP file and extract it
```

### 2. Choose an Example and Install Dependencies

```bash
cd vanilla  # or react, vue, nextjs
npm install
```

### 3. Ensure SDK is Installed

Examples require the `@spatialwalk/avatarkit` SDK to be installed:

```bash
npm install @spatialwalk/avatarkit
```

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Access the Example Pages

- **Vanilla JS**: http://localhost:5174/demo.html
- **Vue 3**: http://localhost:5175
- **React**: http://localhost:5176
- **Next.js iframe**: http://localhost:5177 (requires iframe-content server on port 5178)

### 6. Start Using

**SDK Mode (Real-time Audio Streaming):**
1. Click "初始化 SDK (SDK Mode)" to initialize the SDK
2. Enter the character ID in the interface
3. (Optional) Enter Session Token (if server requires authentication)
4. Click "Load Character" to load the character
5. Click "Connect Service" to establish WebSocket connection
6. Click "Start Recording" and start speaking
7. Click "Stop Recording" to send audio and receive animation
8. Observe the character's real-time animation effects
9. Adjust volume using the volume slider (0-100%)

**Host Mode (Pre-recorded Audio/Animation):**
> ⚠️ **Note**: Host Mode requires the SPAvatar server-side SDK to generate animation keyframes. The examples use pre-generated data files.

1. Click "初始化 SDK (Host Mode)" to initialize the SDK in Host mode
2. Enter the character ID in the interface
3. Click "Load Character" to load the character
4. Click "Play Data" to load and play pre-recorded audio and animation files
5. Observe the character's animation synchronized with audio
6. Adjust volume using the volume slider (0-100%)

## 📦 Example List

### 1. Vanilla JS Example (`vanilla/`)

Native JavaScript example with no framework dependencies.

**Use Cases:**
- Rapid prototyping
- Framework-independent projects
- Learning basic SDK usage

**Run:**
```bash
cd vanilla
npm install
npm run dev
```

**Access:** `http://localhost:5174/demo.html`

**Features:**
- Pure JavaScript, no framework dependencies
- Simple and intuitive code structure
- Suitable for quick learning and testing
- Add custom character IDs dynamically via ➕ button

### 2. Vue 3 Example (`vue/`)

Complete example using Vue 3 Composition API with multi-character panel support.

**Use Cases:**
- Vue 3 project integration
- Reactive state management needed
- Component-based development
- Multiple character instances display

**Run:**
```bash
cd vue
npm install
npm run dev
```

**Access:** `http://localhost:5175`

**Features:**
- Vue 3 Composition API
- TypeScript support
- Reactive data binding
- Multi-character panel support (up to 4 simultaneous instances)
- Global SDK initialization pattern
- Independent panel state management
- Add custom character IDs dynamically via ➕ button

### 3. React Example (`react/`)

Complete example using React Hooks with multi-character panel support.

**Use Cases:**
- React project integration
- Functional programming style needed
- Modern React development
- Multiple character instances display

**Run:**
```bash
cd react
npm install
npm run dev
```

**Access:** `http://localhost:5176`

**Features:**
- React Hooks with `useCallback` optimization
- TypeScript support
- Functional components
- Multi-character panel support (up to 4 simultaneous instances)
- Global SDK initialization pattern
- Independent panel state management
- Add custom character IDs dynamically via ➕ button

### 4. Next.js iframe Example (`nextjs/`)

Complete example using Next.js 14+ with App Router and iframe integration to avoid WASM packaging conflicts.

**Use Cases:**
- Next.js project integration
- Avoiding WASM packaging compatibility issues (Vite vs webpack)
- Maintaining clean separation between Next.js app and SDK code
- Production deployment with Vercel (single deployment)

**Run:**
```bash
cd nextjs
npm run install:all  # Install dependencies for both Next.js and iframe content
npm run dev          # Starts both services automatically
```

**Access:** `http://localhost:5177`

**Features:**
- Next.js 14+ App Router
- iframe integration (SDK runs in separate Vite app)
- **Development**: Two services (iframe Vite server + Next.js) with hot reload
- **Production**: Single deployment (iframe content bundled as static files)
- No WASM configuration needed in Next.js
- postMessage communication between Next.js and iframe
- TypeScript support
- Production-ready configuration
- Add custom character IDs dynamically via ➕ button

**Key Considerations:**
- ✅ SDK runs in separate iframe (Vite app) to avoid packaging conflicts
- ✅ No special WASM configuration needed in Next.js
- ✅ **Development**: Two services for hot reload (standard practice)
- ✅ **Production**: Single deployment (iframe content included in build)
- ✅ Clean separation of concerns
- ✅ Cross-origin communication via postMessage

**Why iframe?**
Due to incompatibility between Vite-packaged WASM files and Next.js webpack configuration, directly integrating the SDK can cause packaging issues. Using an iframe approach completely isolates the SDK environment while keeping deployment simple.

**See:** `nextjs/README.md` for detailed Next.js iframe integration documentation

## ⚙️ Prerequisites

Before running the examples, ensure the following requirements are met:

- **Node.js** >= 16.0.0
- **npm/yarn/pnpm** package manager
- **Modern browser** (supports Web Audio API, WebSocket, WASM)
  - Chrome >= 90
  - Firefox >= 88
  - Safari >= 14.1
  - Edge >= 90
- **Microphone permission** (for recording functionality)
- **SDK package** `@spatialwalk/avatarkit@^1.0.0-beta.34` or later (automatically installed with `npm install`)

## 📝 Usage Steps

All examples support two initialization modes:

### SDK Mode (Real-time Audio Streaming)

The mode is selected when initializing the SDK. Choose "初始化 SDK (SDK Mode)" button.

1. **Initialize SDK** - Initialize SDK in SDK mode
   - Click "初始化 SDK (SDK Mode)" button
   - Select environment (International/CN)
   - (Optional) Enter Session Token

2. **Enter Character ID** - Specify the character to load
   - Get character ID from SDK management platform
   - Or click the ➕ button next to "Character ID" to add a custom character ID

3. **Load Character** - Download and initialize character resources
   - SDK will automatically download character models and textures
   - Display loading progress
   - **Note**: Mode is determined by SDK initialization, no need to select mode when loading character

4. **Connect Service** - Establish WebSocket connection
   - Connect to animation service
   - Wait for successful connection

5. **Start Recording** - Capture audio and send to server
   - Browser will request microphone permission
   - Start speaking, audio data will be collected
   - When stopping recording, all audio data will be processed and sent to server
   - Server will start playing animation and audio after receiving complete audio data
   - **Note**: Recording is just a demonstration method. In actual applications, you can obtain audio data from any source (such as audio files, streaming media, etc.)

6. **Real-time Rendering** - Receive animation data and render to Canvas
   - Character will generate animations based on audio in real-time
   - You can see character's mouth, expressions, and other animations

### Host Mode (Pre-recorded Audio/Animation)

The mode is selected when initializing the SDK. Choose "初始化 SDK (Host Mode)" button.

> ⚠️ **Important**: Host Mode requires the SPAvatar digital human server-side SDK to generate animation keyframes. The audio and animation data files used in these examples are pre-generated using the server-side SDK. In production, you must integrate with the SPAvatar server-side SDK to generate animation keyframes from audio.

1. **Initialize SDK** - Initialize SDK in Host mode
   - Click "初始化 SDK (Host Mode)" button
   - Select environment (International/CN)

2. **Enter Character ID** - Specify the character to load
   - Get character ID from SDK management platform
   - Or click the ➕ button next to "Character ID" to add a custom character ID

3. **Load Character** - Download and initialize character resources
   - SDK will automatically download character models and textures
   - Display loading progress
   - **Note**: Mode is determined by SDK initialization, no need to select mode when loading character

4. **Play Data** - Load and play pre-recorded audio and animation files
   - Audio files are automatically resampled from 24kHz to 16kHz
   - First, audio data is sent via `yieldAudioData()` to get a `conversationId`
   - Then, animation keyframes are sent via `yieldFramesData()` with the `conversationId`
   - Animation keyframes are synchronized with audio playback
   - **Note**: The animation keyframes must be generated using the SPAvatar server-side SDK

## 🔧 Configuration

### Environment Configuration

Examples support two environments:

- **`intl`** - International production environment (default)
- **`cn`** - China production environment

### Session Token (Optional)

If the server requires authentication, provide a valid Session Token:

- Enter Session Token in the interface
- Or configure via code (check source code of each example)

### Character ID

Character ID can be obtained from the SDK management platform and is used to identify the virtual character to load.

**Getting Test Character IDs:**
- Visit [Test Avatars](https://docs.spatialreal.ai/overview/test-avatars) to get test character IDs for testing
- Test avatars include: Rohan, Dr.Kellan, Priya, and Josh

**Adding Custom Character IDs:**
- Click the ➕ button next to the "Character ID" label to add a new character ID
- Or click the 🔗 link icon button to open the test avatars page in a new tab
- Enter the character ID in the popup modal
- The new ID will be added to the dropdown list and automatically selected
- Added IDs are temporary and only persist for the current session (not saved after page refresh)

## 🔧 Technical Details

- **SDK Import**: All examples use standard npm package import `import('@spatialwalk/avatarkit')`
- **SDK Version**: `@spatialwalk/avatarkit@^1.0.0-beta.34`
- **Volume Control**: Audio volume can be adjusted using `setVolume(volume)` API (0.0 to 1.0). All examples include a volume slider in the UI.
- **Initialization Modes**: 
  - **SDK Mode**: Real-time audio streaming via WebSocket, server generates animation
  - **Host Mode**: Pre-recorded audio and animation files, client-side playback
    - ⚠️ **Requires SPAvatar Server-side SDK**: Host Mode requires the SPAvatar digital human server-side SDK to generate animation keyframes from audio. The examples use pre-generated data files, but in production you must integrate with the server-side SDK.
  - **Mode Selection**: The mode is selected during SDK initialization via `AvatarSDK.initialize()`, not when loading characters
- **Key API Changes (v22)**: 
  - `onAvatarState` → `onConversationState` (callback renamed)
  - `AvatarState` → `ConversationState` (enum renamed, values: `idle`, `playing`)
  - `Environment.us` → `Environment.intl` (renamed for internationalization)
  - `AvatarPlaybackMode` enum removed, use `DrivingServiceMode` or string literals (`'network'`, `'external'`)
  - Added `setVolume(volume: number)` and `getVolume(): number` for audio volume control
- **Key API Changes (v18+)**: 
  - `sendAudioChunk()` → `yieldAudioData()` (returns `conversationId`)
  - `sendKeyframes()` → `yieldFramesData()` (requires `conversationId`)
  - `reqId` → `conversationId` (renamed throughout)
  - `getCurrentReqId()` → `getCurrentConversationId()`
  - `generateReqId()` → `generateConversationId()`
- **Host Mode Streaming Flow**: 
  1. Send initial audio chunk via `yieldAudioData()` to get `conversationId`
  2. Stream audio chunks and corresponding keyframes in sync (audio chunk → matching keyframes)
  3. Send any remaining keyframes after audio completes
  4. Uses 30ms send interval to maintain buffer and prevent stuttering
- **Animation Data**: FLAME parameter keyframe sequences
- **Audio Data Source**: 
  - SDK Mode: Microphone recording in examples is for demonstration only. In actual applications, any audio source can be used (files, streaming media, synthesized audio, etc.)
  - Host Mode: Pre-recorded PCM16 audio files (24kHz, automatically resampled to 16kHz). Animation keyframes must be generated using the SPAvatar server-side SDK.
- **Audio Resampling**: High-quality resampling using Web Audio API's OfflineAudioContext with anti-aliasing
- **WASM Support**: All examples are configured with correct WASM MIME types
- **Rendering Backend**: Automatically selects WebGPU or WebGL
- **State Management**: 
  - React: Uses custom Hooks (`useAvatarSDK`, `useAudioRecorder`, `useLogger`)
  - Vue: Uses Composables (`useAvatarSDK`, `useAudioRecorder`, `useLogger`)
  - Vanilla: Uses class-based modules with clear separation of concerns

## ❓ FAQ

### Q: How to get Session Token?

A: Session Token needs to be obtained from the SDK provider. Please contact the SDK provider or check the main SDK documentation for more information.

### Q: Can't see the character after running the example?

A: Please check the following:
- Is the character ID correct?
- Is the network connection normal?
- Are there any error messages in the browser console?
- Has the character been successfully loaded? (Check the log panel)

### Q: Recording function not working?

A: Ensure:
- Browser has granted microphone permission
- Using HTTPS or localhost (required by some browsers)
- Check browser console for error messages

### Q: WebSocket connection failed?

A: Possible reasons:
- Network connection issues
- Session Token invalid or expired
- Server address configuration error
- Check browser console for error messages

### Q: How to install SDK?

A: Install via npm (SDK version 1.0.0-beta.34 or later):
```bash
npm install @spatialwalk/avatarkit@^1.0.0-beta.34
```

The examples automatically install the correct version when you run `npm install`.

### Q: Which browsers are supported?

A: All modern browsers are supported:
- Chrome >= 90
- Firefox >= 88
- Safari >= 14.1
- Edge >= 90

### Q: Can it run on mobile devices?

A: Yes, but requires:
- Mobile browser supporting Web Audio API
- HTTPS connection (for microphone permission)
- Sufficient performance to run 3D rendering

### Q: How to modify the port number?

A: Modify the `server.port` configuration in each example's `vite.config.ts`.

### Q: How to use Host Mode in production?

A: Host Mode requires the SPAvatar digital human server-side SDK to generate animation keyframes from audio. The examples use pre-generated data files for demonstration purposes. In production:

1. Initialize SDK in Host Mode: `AvatarSDK.initialize('demo', { drivingServiceMode: DrivingServiceMode.host })`
2. Integrate the SPAvatar server-side SDK into your backend service
3. Use the server-side SDK to generate animation keyframes from your audio files
4. Store the generated keyframes (FLAME parameter sequences) along with the audio files
5. Load and play both audio and animation keyframes in the client using Host Mode:
   - First, send audio chunks via `yieldAudioData()` to get a `conversationId`
   - Then, send animation keyframes via `yieldFramesData()` with the `conversationId`

For more information about the server-side SDK, please contact the SDK provider or check the server-side SDK documentation.

## 📚 More Information

- Check the `README.md` in each example directory for detailed instructions
- Check the example source code for specific implementation details
- If you have questions, please submit a [GitHub Issue](https://github.com/spatialwalk/AvatarKit-Web-Demo/issues)
