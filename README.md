# AvatarKit SDK Examples

AvatarKit practice demos in vanilla, Vue, React, and Next.js

This is a complete SDK usage example collection demonstrating how to integrate and use the AvatarKit SDK in different frameworks.

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

> ⚠️ **Important**: The default App ID and Session Token provided in these demos are **paired together** and can **only be used to drive the publicly available test avatars** (Rohan, Dr.Kellan, Priya, Josh, etc.). If you want to create your own avatars and test them, please visit the [Developer Platform](https://dash.spatialreal.ai) to create your own App and avatars.

**SDK Mode (Real-time Audio Streaming):**
1. **App ID and Session Token** - The demo automatically generates a default Session Token on page load. You can also manually edit both App ID and Session Token if needed.
   - ⚠️ **Note**: The default App ID and Session Token are paired and only work with test avatars. For your own avatars, create your App at the [Developer Platform](https://dash.spatialreal.ai).
   - The Session Token input field is editable - you can manually enter your own token
   - Click "Inject" button to inject the token to SDK after initialization
2. Click "初始化 SDK (SDK Mode)" to initialize the SDK
   - Select environment (International/CN)
   - The Session Token will be automatically set if you generated it in step 1
3. Enter the avatar ID in the interface
4. Click "Load Avatar" to load the avatar
5. Click "Connect Service" to establish WebSocket connection
6. Click "Start Recording" and start speaking
7. Click "Stop Recording" to send audio and receive animation
8. Observe the avatar's real-time animation effects
9. Adjust volume using the volume slider (0-100%) - located on the right side above the transform button
10. Use the play/pause button (bottom left) to control playback when the avatar is playing or paused

**Host Mode (Pre-recorded Audio/Animation):**
> ⚠️ **Note**: Host Mode requires the Avatar server-side SDK to generate animation keyframes. The examples use pre-generated data files.

1. **App ID and Session Token** - The demo automatically generates a default Session Token on page load. You can also manually edit both App ID and Session Token if needed.
   - ⚠️ **Note**: The default App ID and Session Token are paired and only work with test avatars. For your own avatars, create your App at the [Developer Platform](https://dash.spatialreal.ai).
   - The Session Token input field is editable - you can manually enter your own token
   - Click "Inject" button to inject the token to SDK after initialization
2. Click "初始化 SDK (Host Mode)" to initialize the SDK in Host mode
   - Select environment (International/CN)
   - The Session Token will be automatically set if you generated it in step 1
3. Enter the avatar ID in the interface
4. Click "Load Avatar" to load the avatar
5. Click "Play Data" to load and play pre-recorded audio and animation files
6. Observe the avatar's animation synchronized with audio
7. Adjust volume using the volume slider (0-100%) - located on the right side above the transform button
8. Use the play/pause button (bottom left) to control playback when the avatar is playing or paused

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
- Add custom avatar IDs dynamically via ➕ button

### 2. Vue 3 Example (`vue/`)

Complete example using Vue 3 Composition API with multi-avatar panel support.

**Use Cases:**
- Vue 3 project integration
- Reactive state management needed
- Component-based development
- Multiple avatar instances display

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
- Multi-avatar panel support (up to 4 simultaneous instances)
- Global SDK initialization pattern
- Independent panel state management
- Add custom avatar IDs dynamically via ➕ button

### 3. React Example (`react/`)

Complete example using React Hooks with multi-avatar panel support.

**Use Cases:**
- React project integration
- Functional programming style needed
- Modern React development
- Multiple avatar instances display

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
- Multi-avatar panel support (up to 4 simultaneous instances)
- Global SDK initialization pattern
- Independent panel state management
- Add custom avatar IDs dynamically via ➕ button

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
- Add custom avatar IDs dynamically via ➕ button

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
- **SDK package** `@spatialwalk/avatarkit@^1.0.0-beta.39` or later (automatically installed with `npm install`)

## 📝 Usage Steps

All examples support two initialization modes:

### SDK Mode (Real-time Audio Streaming)

The mode is selected when initializing the SDK. Choose "初始化 SDK (SDK Mode)" button.

1. **Generate Session Token** (Required for Demo) - Generate a temporary token (can be done before or after SDK initialization)
   - ⚠️ **Note**: This auto-generation is for demo purposes only. In production, you must manually inject a valid token from your SDK provider using `AvatarSDK.setSessionToken(token)`.
   - Click the "Auto" button next to "Session Token" input field
   - The button tooltip shows "生成临时token，有效期1小时" (Generate temporary token, valid for 1 hour)
   - The token will be automatically filled into the read-only input field
   - **Note**: The Session Token input field is read-only and can only be set via the "Auto" button in demos
   - If SDK is already initialized, the token will be set immediately
   - If SDK is not initialized yet, the token will be automatically set when you initialize the SDK

2. **Initialize SDK** - Initialize SDK in SDK mode
   - Click "初始化 SDK (SDK Mode)" button
   - Select environment (International/CN)
   - The Session Token generated in step 1 will be automatically set

3. **Enter Avatar ID** - Specify the avatar to load
   - Get avatar ID from SDK management platform
   - Or click the ➕ button next to "Avatar ID" to add a custom avatar ID

4. **Load Avatar** - Download and initialize avatar resources
   - SDK will automatically download avatar models and textures
   - Display loading progress
   - **Note**: Mode is determined by SDK initialization, no need to select mode when loading avatar

5. **Connect Service** - Establish WebSocket connection
   - Connect to animation service
   - Wait for successful connection
   - ⚠️ **Important**: Audio context is automatically initialized when connecting (must be in user gesture context)

6. **Start Recording** - Capture audio and send to server
   - Browser will request microphone permission
   - Start speaking, audio data will be collected
   - When stopping recording, all audio data will be processed and sent to server
   - Server will start playing animation and audio after receiving complete audio data
   - **Note**: Recording is just a demonstration method. In actual applications, you can obtain audio data from any source (such as audio files, streaming media, etc.)

7. **Real-time Rendering** - Receive animation data and render to Canvas
   - Avatar will generate animations based on audio in real-time
   - You can see avatar's mouth, expressions, and other animations

### Host Mode (Pre-recorded Audio/Animation)

The mode is selected when initializing the SDK. Choose "初始化 SDK (Host Mode)" button.

> ⚠️ **Important**: Host Mode requires the Avatar digital human server-side SDK to generate animation keyframes. The audio and animation data files used in these examples are pre-generated using the server-side SDK. In production, you must integrate with the Avatar server-side SDK to generate animation keyframes from audio.

1. **Generate Session Token** (Required for Demo) - Generate a temporary token (can be done before or after SDK initialization)
   - ⚠️ **Note**: This auto-generation is for demo purposes only. In production, you must manually inject a valid token from your SDK provider using `AvatarSDK.setSessionToken(token)`.
   - Click the "Auto" button next to "Session Token" input field
   - The button tooltip shows "生成临时token，有效期1小时" (Generate temporary token, valid for 1 hour)
   - The token will be automatically filled into the read-only input field
   - **Note**: The Session Token input field is read-only and can only be set via the "Auto" button in demos
   - If SDK is already initialized, the token will be set immediately
   - If SDK is not initialized yet, the token will be automatically set when you initialize the SDK

2. **Initialize SDK** - Initialize SDK in Host mode
   - Click "初始化 SDK (Host Mode)" button
   - Select environment (International/CN)
   - The Session Token generated in step 1 will be automatically set

3. **Enter Avatar ID** - Specify the avatar to load
   - Get avatar ID from SDK management platform
   - Or click the ➕ button next to "Avatar ID" to add a custom avatar ID

4. **Load Avatar** - Download and initialize avatar resources
   - SDK will automatically download avatar models and textures
   - Display loading progress
   - **Note**: Mode is determined by SDK initialization, no need to select mode when loading avatar

5. **Play Data** - Load and play pre-recorded audio and animation files
   - ⚠️ **Important**: Audio context is automatically initialized before sending audio data (must be in user gesture context)
   - Audio files are automatically resampled from 24kHz to 16kHz
   - First, audio data is sent via `yieldAudioData()` to get a `conversationId`
   - Then, animation keyframes are sent via `yieldFramesData()` with the `conversationId`
   - Animation keyframes are synchronized with audio playback
   - **Note**: The animation keyframes must be generated using the Avatar server-side SDK

## 🔧 Configuration

### Environment Configuration

Examples support two environments:

- **`intl`** - International production environment (default)
- **`cn`** - China production environment

### App ID and Session Token (Required)

**All environments now require an App ID and Session Token for authentication.**

> ⚠️ **Important Note**: 
> - The default App ID and Session Token provided in these demos are **paired together** and can **only be used to drive the publicly available test avatars** (Rohan, Dr.Kellan, Priya, Josh, etc.).
> - If you want to create your own avatars and test them, please visit the [Developer Platform](https://dash.spatialreal.ai) to create your own App and avatars.
> - The "Auto" button in these demos is **only for demonstration purposes**. In actual production applications, you must **manually inject a valid Session Token** obtained from your SDK provider. The auto-generation feature is not available in production and should not be relied upon.

**Demo Quick Setup:**
1. Click the **"Auto"** button next to the "Session Token" input field
2. The button will generate a temporary token valid for 1 hour (demo only)
3. The token will be automatically filled into the read-only input field
4. **Note**: The Session Token input field is read-only and can only be set via the "Auto" button (manual input is disabled in demos)
5. If SDK is already initialized, the token will be set immediately
6. If SDK is not initialized yet, you can generate the token before or after initialization - it will be automatically set when you initialize the SDK

**For Production Integration:**
- You must obtain a valid Session Token from your SDK provider
- Use `AvatarSDK.setSessionToken(token)` to inject the token programmatically
- The token must be valid and not expired
- Handle token refresh logic in your application as needed

**Demo Token Generation:**
- The "Auto" button calls the console API to generate a temporary token (demo only)
- Token expires after 1 hour
- You can generate a new token anytime by clicking "Auto" again

### App ID

The App ID is used to identify your application. The demos provide a default App ID that is paired with the default Session Token.

> ⚠️ **Important**: The default App ID and Session Token are **paired together** and can **only be used to drive the publicly available test avatars**. To create and test your own avatars, please visit the [Developer Platform](https://dash.spatialreal.ai) to create your own App.

### Avatar ID

Avatar ID can be obtained from the SDK management platform and is used to identify the virtual avatar to load.

**Getting Test Avatar IDs:**
- Visit [Test Avatars](https://docs.spatialreal.ai/overview/test-avatars) to get test avatar IDs for testing
- Test avatars include: Rohan, Dr.Kellan, Priya, and Josh
- **Note**: These test avatars can only be used with the default App ID and Session Token provided in the demos

**Adding Custom Avatar IDs:**
- Click the ➕ button next to the "Avatar ID" label to add a new avatar ID
- Or click the 🔗 link icon button to open the test avatars page in a new tab
- Enter the avatar ID in the popup modal
- The new ID will be added to the dropdown list and automatically selected
- Added IDs are temporary and only persist for the current session (not saved after page refresh)

### ⚠️ Audio Context Initialization (Required)

> **🚨 Critical**: Before using any audio-related features, you **MUST** initialize the audio context in a user gesture context (e.g., `click`, `touchstart` event handlers). This is required by browser security policies. Calling `initializeAudioContext()` outside a user gesture will fail.

**How It Works in Demos:**
- **SDK Mode**: Audio context is automatically initialized when you click "Connect Service" (inside the button's click event handler)
- **Host Mode**: Audio context is automatically initialized when you click "Play Data" (inside the button's click event handler)
- All audio operations (sending audio, playing audio, etc.) require prior initialization

**For Your Own Projects:**
```typescript
// SDK Mode: Initialize audio context before calling start()
button.addEventListener('click', async () => {
  await avatarView.controller.initializeAudioContext() // MUST be in user gesture context
  await avatarView.controller.start()
  // Now you can send audio data
  avatarView.controller.send(audioData, false)
})

// Host Mode: Initialize audio context before calling yieldAudioData()
button.addEventListener('click', async () => {
  await avatarView.controller.initializeAudioContext() // MUST be in user gesture context
  // Now you can send audio data
  const conversationId = avatarView.controller.yieldAudioData(audioData, false)
  avatarView.controller.yieldFramesData(keyframes, conversationId)
})
```

**Important Notes:**
- `initializeAudioContext()` **MUST** be called within a user gesture event handler (click, touchstart, etc.)
- Calling `initializeAudioContext()` outside a user gesture context will fail
- All audio operations require prior initialization
- Initialization only needs to be done once per `AvatarController` instance
- See SDK documentation for more details

### ⚠️ WASM Configuration (Required for Production)

> **🚨 Critical**: All demo projects include essential WASM (WebAssembly) configuration that is **required for production deployment**. This configuration ensures WASM files are properly served with correct MIME types and are accessible in production environments.

**Why This Matters:**
- WASM files must be served with the `application/wasm` MIME type for browsers to execute them correctly
- Some hosting platforms (like Cloudflare Pages) require explicit headers configuration
- Without proper configuration, WASM files may fail to load in production, causing the SDK to malfunction

**What's Configured:**

All Vite-based demos (vanilla, Vue, React, and Next.js iframe-content) include:

1. **Development Server MIME Type Configuration**
   - Automatically sets `Content-Type: application/wasm` for `.wasm` files during development
   - Ensures WASM files load correctly in the dev server

2. **Build-Time WASM File Copying**
   - Automatically copies WASM files from `node_modules/@spatialwalk/avatarkit/dist/` to `dist/assets/` after build
   - Ensures WASM files are included in the production build output

3. **Production Headers File Generation**
   - Automatically creates `dist/_headers` file for Cloudflare Pages deployment
   - Configures `Content-Type: application/wasm` for all `.wasm` files
   - Required for Cloudflare Pages and other platforms that support `_headers` files

4. **Vite Configuration**
   - `optimizeDeps.exclude: ['@spatialwalk/avatarkit']` - Prevents Vite from pre-bundling the SDK, allowing WASM files to load correctly
   - `assetsInclude: ['**/*.wasm']` - Marks WASM files as static assets

**For Your Own Projects:**

If you're integrating the SDK into your own project, you **must** include similar configuration:

```typescript
// vite.config.ts example
import { copyFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  plugins: [
    // ... your other plugins
    {
      name: 'configure-wasm-mime',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm')
          }
          next()
        })
      },
    },
    {
      name: 'copy-wasm-file',
      closeBundle() {
        const wasmSource = join(__dirname, 'node_modules/@spatialwalk/avatarkit/dist/avatar_core_wasm.wasm')
        const wasmDest = join(__dirname, 'dist/assets/avatar_core_wasm.wasm')
        const headersDest = join(__dirname, 'dist/_headers')
        
        if (existsSync(wasmSource)) {
          copyFileSync(wasmSource, wasmDest)
        }
        
        const headersContent = '/*.wasm\n  Content-Type: application/wasm\n'
        writeFileSync(headersDest, headersContent)
      },
    },
  ],
  optimizeDeps: {
    exclude: ['@spatialwalk/avatarkit'],
  },
  assetsInclude: ['**/*.wasm'],
})
```

**For Other Build Tools:**

- **Webpack**: Configure `module.rules` to handle `.wasm` files with correct MIME type
- **Rollup**: Use plugins to copy WASM files and configure headers
- **Other Platforms**: Ensure your hosting platform serves `.wasm` files with `Content-Type: application/wasm`

**Verification:**

After building, verify:
1. WASM file exists in `dist/assets/avatar_core_wasm.wasm`
2. `dist/_headers` file exists (for Cloudflare Pages)
3. Your hosting platform serves `.wasm` files with correct MIME type

> ⚠️ **Note**: Next.js main app doesn't need WASM configuration because the SDK runs in a separate iframe (Vite app) that has its own WASM configuration.

## 🔧 Technical Details

- **SDK Import**: All examples use standard npm package import `import('@spatialwalk/avatarkit')`
- **SDK Version**: `@spatialwalk/avatarkit@^1.0.0-beta.39`
- **Audio Context Initialization**: ⚠️ **Critical**: Before using any audio-related features, you **MUST** initialize the audio context in a user gesture context using `avatarView.controller.initializeAudioContext()`. All demos automatically handle this when you click "Connect Service" (SDK Mode) or "Play Data" (Host Mode). See [Audio Context Initialization](#-audio-context-initialization-required) section for details.
- **Volume Control**: Audio volume can be adjusted using `setVolume(volume)` API (0.0 to 1.0). All examples include a volume slider in the UI, positioned on the right side above the transform button.
- **Play/Pause Control**: A play/pause button is available in the bottom left corner of the avatar view. It appears when the avatar is in `playing` or `pausing` state, allowing you to pause or resume playback.
- **Initialization Modes**: 
  - **SDK Mode**: Real-time audio streaming via WebSocket, server generates animation
  - **Host Mode**: Pre-recorded audio and animation files, client-side playback
    - ⚠️ **Requires Avatar Server-side SDK**: Host Mode requires the Avatar digital human server-side SDK to generate animation keyframes from audio. The examples use pre-generated data files, but in production you must integrate with the server-side SDK.
  - **Mode Selection**: The mode is selected during SDK initialization via `AvatarSDK.initialize()`, not when loading avatars
- **Key API Changes (v22)**: 
  - `onAvatarState` → `onConversationState` (callback renamed)
  - `AvatarState` → `ConversationState` (enum renamed, values: `idle`, `playing`, `pausing`)
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
  - Host Mode: Pre-recorded PCM16 audio files (24kHz, automatically resampled to 16kHz). Animation keyframes must be generated using the Avatar server-side SDK.
- **Audio Resampling**: High-quality resampling using Web Audio API's OfflineAudioContext with anti-aliasing
- **WASM Support**: All examples are configured with correct WASM MIME types, automatic WASM file copying, and production headers generation. See [WASM Configuration](#-wasm-configuration-required-for-production) section for details.
- **Rendering Backend**: Automatically selects WebGPU or WebGL
- **State Management**: 
  - React: Uses custom Hooks (`useAvatarSDK`, `useAudioRecorder`, `useLogger`)
  - Vue: Uses Composables (`useAvatarSDK`, `useAudioRecorder`, `useLogger`)
  - Vanilla: Uses class-based modules with clear separation of concerns

## ❓ FAQ

### Q: How to get App ID and Session Token?

A: 
- **For Demo**: The demos provide a default App ID and Session Token that are paired together. These can only be used to drive the publicly available test avatars (Rohan, Dr.Kellan, Priya, Josh, etc.). The Session Token is automatically generated on page load, and you can also manually edit both App ID and Session Token if needed.
- **For Your Own Avatars**: If you want to create your own avatars and test them, please visit the [Developer Platform](https://dash.spatialreal.ai) to create your own App and avatars. You will get your own App ID and can generate Session Tokens for your App.
- **For Production**: Session Token needs to be obtained from the SDK provider. Please contact the SDK provider or check the main SDK documentation for more information. You must manually inject the token using `AvatarSDK.setSessionToken(token)` in your application.

### Q: Can't see the avatar after running the example?

A: Please check the following:
- Is the avatar ID correct?
- Is the network connection normal?
- Are there any error messages in the browser console?
- Has the avatar been successfully loaded? (Check the log panel)

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

A: Install via npm (SDK version 1.0.0-beta.39 or later):
```bash
npm install @spatialwalk/avatarkit@^1.0.0-beta.39
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

A: Host Mode requires the Avatar digital human server-side SDK to generate animation keyframes from audio. The examples use pre-generated data files for demonstration purposes. In production:

1. Initialize SDK in Host Mode: `AvatarSDK.initialize('demo', { drivingServiceMode: DrivingServiceMode.host })`
2. Integrate the Avatar server-side SDK into your backend service
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
