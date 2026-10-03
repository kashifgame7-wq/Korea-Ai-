import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Crisp SVG of Korea AI Studio icon (dark rounded background, cyber/neon gradients, Korean AI insignia and sparkles)
const svgNormal = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="108" fill="#131314"/>
  <circle cx="256" cy="256" r="210" fill="url(#bg_glow)" opacity="0.15"/>
  <rect x="24" y="24" width="464" height="464" rx="92" stroke="#333537" stroke-width="4"/>
  
  <!-- Korean Taegeuk inspired modern dynamic curve -->
  <path d="M256 120 C331 120 392 181 392 256 C392 331 331 392 256 392 C181 392 120 331 120 256 C120 181 181 120 256 120 Z" fill="url(#core_grad)"/>
  
  <!-- Sleek Yin-Yang spiral cut -->
  <path d="M256 120 C324 120 380 176 380 244 C380 312 324 256 256 256 C188 256 132 300 132 368 C124 334 120 296 120 256 C120 181 181 120 256 120 Z" fill="url(#accent_grad)" opacity="0.9"/>
  
  <!-- AI Sparkle Core -->
  <path d="M256 186 L267 235 L316 246 L267 257 L256 306 L245 257 L196 246 L245 235 Z" fill="#ffffff" filter="drop-shadow(0 0 16px rgba(255,255,255,0.8))"/>
  
  <!-- Korean Character / AI Symbol Accent -->
  <circle cx="256" cy="256" r="14" fill="#ffffff"/>
  
  <!-- Mini Satellite Sparkles -->
  <path d="M350 160 L355 178 L373 183 L355 188 L350 206 L345 188 L327 183 L345 178 Z" fill="#4285f4"/>
  <path d="M162 330 L166 344 L180 348 L166 352 L162 366 L158 352 L144 348 L158 344 Z" fill="#d96570"/>

  <defs>
    <radialGradient id="bg_glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#4285f4"/>
      <stop offset="100%" stop-color="#131314" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="core_grad" x1="120" y1="120" x2="392" y2="392" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4285f4"/>
      <stop offset="50%" stop-color="#9b72cb"/>
      <stop offset="100%" stop-color="#d96570"/>
    </linearGradient>
    <linearGradient id="accent_grad" x1="120" y1="120" x2="380" y2="368" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
</svg>
`;

// Maskable icon with 15% inner safe padding so Android doesn't clip details
const svgMaskable = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#131314"/>
  <circle cx="256" cy="256" r="180" fill="url(#bg_glow_m)" opacity="0.2"/>
  
  <!-- Scaled content inside safe zone (approx 75% scale centered) -->
  <g transform="translate(64, 64) scale(0.75)">
    <!-- Korean Taegeuk inspired modern dynamic curve -->
    <path d="M256 120 C331 120 392 181 392 256 C392 331 331 392 256 392 C181 392 120 331 120 256 C120 181 181 120 256 120 Z" fill="url(#core_grad_m)"/>
    
    <!-- Sleek Yin-Yang spiral cut -->
    <path d="M256 120 C324 120 380 176 380 244 C380 312 324 256 256 256 C188 256 132 300 132 368 C124 334 120 296 120 256 C120 181 181 120 256 120 Z" fill="url(#accent_grad_m)" opacity="0.9"/>
    
    <!-- AI Sparkle Core -->
    <path d="M256 186 L267 235 L316 246 L267 257 L256 306 L245 257 L196 246 L245 235 Z" fill="#ffffff"/>
    <circle cx="256" cy="256" r="14" fill="#ffffff"/>
    
    <!-- Mini Satellite Sparkles -->
    <path d="M350 160 L355 178 L373 183 L355 188 L350 206 L345 188 L327 183 L345 178 Z" fill="#4285f4"/>
    <path d="M162 330 L166 344 L180 348 L166 352 L162 366 L158 352 L144 348 L158 344 Z" fill="#d96570"/>
  </g>

  <defs>
    <radialGradient id="bg_glow_m" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#4285f4"/>
      <stop offset="100%" stop-color="#131314" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="core_grad_m" x1="120" y1="120" x2="392" y2="392" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4285f4"/>
      <stop offset="50%" stop-color="#9b72cb"/>
      <stop offset="100%" stop-color="#d96570"/>
    </linearGradient>
    <linearGradient id="accent_grad_m" x1="120" y1="120" x2="380" y2="368" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
</svg>
`;

async function buildIcons() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgNormal);
  console.log('Saved icon.svg');

  // pwa-512x512.png
  await sharp(Buffer.from(svgNormal))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // pwa-192x192.png
  await sharp(Buffer.from(svgNormal))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // pwa-maskable-512x512.png
  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // apple-touch-icon.png (180x180)
  await sharp(Buffer.from(svgNormal))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // favicon.png & favicon.ico
  await sharp(Buffer.from(svgNormal))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated favicon.ico');
}

buildIcons().catch(console.error);
