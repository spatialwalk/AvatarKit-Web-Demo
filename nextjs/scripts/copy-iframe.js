/**
 * Copy iframe content build to Next.js public directory
 * Cross-platform compatible script
 */

const fs = require('fs')
const path = require('path')

const srcDir = path.join(__dirname, '../iframe-content/dist')
const destDir = path.join(__dirname, '../public/iframe')

// Remove existing directory
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true })
}

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '../public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// Copy files
if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, destDir, { recursive: true })
  console.log('✅ iframe content copied to public/iframe')
} else {
  console.error('❌ iframe content not found. Please build iframe-content first.')
  process.exit(1)
}

