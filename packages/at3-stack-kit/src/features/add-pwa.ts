/**
 * Add PWA support to existing project
 */

import { join } from "node:path";
import { ensureDir, writeFile } from "fs-extra";

export async function addPWA(projectPath: string): Promise<void> {
  // Add manifest.json
  await addManifest(projectPath);

  // Add service worker
  await addServiceWorker(projectPath);

  // Update package.json
  await updatePackageJson(projectPath);

  console.log("✓ PWA support added");
}

async function addManifest(projectPath: string): Promise<void> {
  const publicPath = join(projectPath, "public");
  await ensureDir(publicPath);

  const manifest = {
    name: "AT3 App",
    short_name: "AT3",
    description: "AT3 Stack Application",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };

  await writeFile(join(publicPath, "manifest.json"), JSON.stringify(manifest, null, 2));
}

async function addServiceWorker(projectPath: string): Promise<void> {
  const publicPath = join(projectPath, "public");

  const sw = `// Basic service worker for PWA
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Add caching logic here
});
`;

  await writeFile(join(publicPath, "sw.js"), sw);
}

function updatePackageJson(_projectPath: string): void {
  // Add PWA-related dependencies if needed
  console.log("PWA package.json updates would go here");
}
