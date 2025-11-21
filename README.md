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
- **Next.js**: http://localhost:5177

### 6. Start Using

**Network Mode (Real-time Audio Streaming):**
1. Enter the character ID in the interface
2. (Optional) Enter Session Token (if server requires authentication)
3. Click "Initialize SDK"
4. Click "Load Character (Network)"
5. Click "Connect Service"
6. Click "Start Recording" and start speaking
7. Click "Stop Recording" to send audio and receive animation
8. Observe the character's real-time animation effects

**External Data Mode (Pre-recorded Audio/Animation):**
> ⚠️ **Note**: External Data Mode requires the SPAvatar server-side SDK to generate animation keyframes. The examples use pre-generated data files.

1. Enter the character ID in the interface
2. Click "Initialize SDK"
3. Click "Load Character (External)"
4. Click "Play Data" to load and play pre-recorded audio and animation files
5. Observe the character's animation synchronized with audio

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

### 4. Next.js Example (`nextjs/`)

Complete example using Next.js 14+ with App Router.

**Use Cases:**
- Next.js project integration
- Server-side rendering (SSR) considerations
- WASM in Next.js environment
- Production deployment with Vercel

**Run:**
```bash
cd nextjs
npm install
npm run dev
```

**Access:** `http://localhost:5177`

**Features:**
- Next.js 14+ App Router
- Complete WASM configuration for Next.js
- Client-side rendering optimization
- Dynamic SDK imports
- TypeScript support
- Production-ready configuration

**Key Considerations:**
- ✅ Properly configured WASM support in `next.config.js`
- ✅ All browser API components use `'use client'` directive
- ✅ Dynamic imports for SDK to avoid SSR issues
- ✅ SSR disabled for components requiring browser APIs
- ✅ Detailed documentation for common Next.js + WASM issues

**See:** `nextjs/README.md` for detailed Next.js-specific documentation

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
- **SDK package** `@spatialwalk/avatarkit@^1.0.0-beta.16` or later (automatically installed with `npm install`)

## 📝 Usage Steps

All examples support two playback modes:

### Network Mode (Real-time Audio Streaming)

1. **Initialize SDK** - Configure environment and authentication
   - Select environment (US/CN/Test)
   - (Optional) Enter Session Token

2. **Enter Character ID** - Specify the character to load
   - Get character ID from SDK management platform

3. **Load Character** - Download and initialize character resources
   - SDK will automatically download character models and textures
   - Display loading progress

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

### External Data Mode (Pre-recorded Audio/Animation)

> ⚠️ **Important**: External Data Mode requires the SPAvatar digital human server-side SDK to generate animation keyframes. The audio and animation data files used in these examples are pre-generated using the server-side SDK. In production, you must integrate with the SPAvatar server-side SDK to generate animation keyframes from audio.

1. **Initialize SDK** - Configure environment
   - Select environment (US/CN/Test)

2. **Enter Character ID** - Specify the character to load
   - Get character ID from SDK management platform

3. **Load Character** - Download and initialize character resources
   - SDK will automatically download character models and textures
   - Display loading progress

4. **Play Data** - Load and play pre-recorded audio and animation files
   - Audio files are automatically resampled from 24kHz to 16kHz
   - Animation keyframes are synchronized with audio playback
   - Data is streamed at 2x playback speed to ensure smooth playback
   - **Note**: The animation keyframes must be generated using the SPAvatar server-side SDK

## 🔧 Configuration

### Environment Configuration

Examples support three environments:

- **`test`** - Test environment (default)
- **`us`** - US production environment
- **`cn`** - China production environment

### Session Token (Optional)

If the server requires authentication, provide a valid Session Token:

- Enter Session Token in the interface
- Or configure via code (check source code of each example)

### Character ID

Character ID can be obtained from the SDK management platform and is used to identify the virtual character to load.

## 🔧 Technical Details

- **SDK Import**: All examples use standard npm package import `import('@spatialwalk/avatarkit')`
- **Playback Modes**: 
  - **Network Mode**: Real-time audio streaming via WebSocket, server generates animation
  - **External Data Mode**: Pre-recorded audio and animation files, client-side playback
    - ⚠️ **Requires SPAvatar Server-side SDK**: External Data Mode requires the SPAvatar digital human server-side SDK to generate animation keyframes from audio. The examples use pre-generated data files, but in production you must integrate with the server-side SDK.
- **Animation Data**: FLAME parameter keyframe sequences
- **Audio Data Source**: 
  - Network Mode: Microphone recording in examples is for demonstration only. In actual applications, any audio source can be used (files, streaming media, synthesized audio, etc.)
  - External Data Mode: Pre-recorded PCM16 audio files (24kHz, automatically resampled to 16kHz). Animation keyframes must be generated using the SPAvatar server-side SDK.
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

A: Install via npm (SDK version 1.0.0-beta.16 or later):
```bash
npm install @spatialwalk/avatarkit@^1.0.0-beta.16
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

### Q: How to use External Data Mode in production?

A: External Data Mode requires the SPAvatar digital human server-side SDK to generate animation keyframes from audio. The examples use pre-generated data files for demonstration purposes. In production:

1. Integrate the SPAvatar server-side SDK into your backend service
2. Use the server-side SDK to generate animation keyframes from your audio files
3. Store the generated keyframes (FLAME parameter sequences) along with the audio files
4. Load and play both audio and animation keyframes in the client using External Data Mode

For more information about the server-side SDK, please contact the SDK provider or check the server-side SDK documentation.

## 📚 More Information

- Check the `README.md` in each example directory for detailed instructions
- Check the example source code for specific implementation details
- If you have questions, please submit a [GitHub Issue](https://github.com/spatialwalk/AvatarKit-Web-Demo/issues)
