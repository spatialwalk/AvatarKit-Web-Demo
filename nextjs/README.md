# Next.js iframe Integration Example

This is a SPAvatarKit SDK example using Next.js with iframe integration, demonstrating how to integrate the SDK in a Next.js application without encountering WASM packaging compatibility issues.

## 💡 Why Use iframe Integration?

Due to incompatibility between Vite-packaged WASM files and Next.js webpack configuration, directly integrating the SDK in Next.js can cause packaging issues. Using an iframe approach provides:

- ✅ **Complete isolation** - SDK runs in a separate environment, avoiding packaging conflicts
- ✅ **No special configuration** - SDK runs in an independent Vite app
- ✅ **Clean Next.js app** - No SDK-related code in the Next.js application
- ✅ **Single service** - Only one Next.js server needed in development and production
- ✅ **Production ready** - iframe content is bundled with Next.js build

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd nextjs
npm run install:all
```

This will install dependencies for both Next.js app and iframe content.

### 2. Start Development Servers

```bash
npm run dev
```

This will automatically start **both services**:
- **iframe content** dev server on `http://localhost:5178` (Vite, with hot reload)
- **Next.js app** dev server on `http://localhost:5177`

**That's it!** Both services run in parallel. You can modify iframe content and see changes instantly with hot reload.

### 3. Access the Example

Open your browser and visit: `http://localhost:5177`

The Next.js app will embed the SDK demo in an iframe from the Vite dev server.

> **Note**: In development, iframe content runs on a separate Vite server for hot reload. In production, iframe content is built as static files and bundled with Next.js.

## 📁 Project Structure

```
nextjs/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page with iframe
│   └── globals.css        # Global styles
├── iframe-content/        # SDK demo (Vite app)
│   ├── src/              # SDK demo source code
│   ├── demo.html         # Entry HTML
│   ├── vite.config.ts    # Vite configuration
│   └── package.json      # iframe content dependencies
├── public/               # Static assets
├── next.config.js        # Next.js configuration
├── package.json          # Next.js dependencies
└── README.md            # This file
```

## 🔧 Configuration

### Development Setup

**Two Services (Best Practice for Development):**
- **iframe content**: Vite dev server on port `5178` (hot reload enabled)
- **Next.js app**: Next.js dev server on port `5177`
- **iframe URL**: `http://localhost:5178/demo.html` (development)
- **Hot Reload**: Changes to iframe content are reflected immediately

This is the standard practice because:
- ✅ Fast development iteration (hot reload)
- ✅ No need to rebuild iframe content on every change
- ✅ Better developer experience

### Production Setup

**Single Deployment (Recommended):**

1. **Build everything:**
   ```bash
   npm run build
   ```
   
   This automatically:
   - Builds iframe content as static files
   - Copies them to `public/iframe/`
   - Builds Next.js app (iframe content is included)

2. **Deploy Next.js app** to Vercel or your preferred hosting service
   - The iframe content is bundled in the Next.js build
   - **No separate deployment needed**
   - Single service, single deployment
   - iframe URL automatically switches to `/iframe/demo.html` in production

**Alternative: Separate Deployment**

If you need to deploy iframe content separately (e.g., for CDN distribution):

1. Build iframe content: `cd iframe-content && npm run build`
2. Deploy `iframe-content/dist` to a static hosting service or CDN
3. Set environment variable when building Next.js:
   ```bash
   NEXT_PUBLIC_IFRAME_URL=https://your-cdn-domain.com/demo.html npm run build
   ```

## 📡 Communication (postMessage)

The example includes a basic postMessage communication setup. You can extend this to:

- Control SDK operations from Next.js app
- Receive status updates from the iframe
- Synchronize state between Next.js and iframe

### Example: Sending message to iframe

```typescript
// In Next.js app
iframeRef.current?.contentWindow?.postMessage(
  { type: 'command', action: 'loadCharacter', characterId: 'xxx' },
  '*'
)
```

### Example: Receiving messages from iframe

```typescript
// In Next.js app
window.addEventListener('message', (event) => {
  if (event.data.type === 'sdk-ready') {
    console.log('SDK in iframe is ready')
  }
})
```

## 📋 Features

- ✅ SDK initialization
- ✅ Character loading (with progress display)
- ✅ WebSocket connection management
- ✅ Real-time audio recording and sending
- ✅ Real-time animation rendering
- ✅ Conversation interruption (supports interruption in both network and external data modes)
- ✅ Audio volume control (0-100% slider)
- ✅ Log panel (real-time status display)
- ✅ SDK Mode: Real-time audio streaming via WebSocket
- ✅ Host Mode: Pre-recorded audio and animation playback (requires server-side SDK for keyframe generation)
- ✅ iframe integration to avoid WASM packaging conflicts

## 🎯 Use Cases

- Next.js projects that need to integrate SPAvatar SDK
- Avoiding WASM packaging conflicts
- Maintaining clean separation between Next.js app and SDK code
- Multi-framework integration scenarios

## 🔍 Key Files

- **`app/page.tsx`** - Main Next.js page with iframe integration
- **`iframe-content/demo.html`** - SDK demo entry point
- **`iframe-content/vite.config.ts`** - Vite configuration for iframe content

## ⚠️ Important Notes

1. **Development**: Two services run automatically with `npm run dev` (iframe Vite server + Next.js server)
2. **Hot Reload**: Changes to iframe content are reflected immediately (no rebuild needed)
3. **Production**: iframe content is automatically built and bundled with Next.js - single deployment
4. **Security**: Implement proper origin validation in production for postMessage if using external iframe URL

## 🔗 Related Documentation

- See the main [README.md](../README.md) for general SDK usage
- See [vanilla/README.md](../vanilla/README.md) for SDK implementation details

