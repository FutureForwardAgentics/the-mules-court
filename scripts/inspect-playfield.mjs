#!/usr/bin/env node

/**
 * Playfield Browser Inspection Tool
 *
 * Launches playfield.html in a headless browser and captures screenshots
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Output directory for screenshots
const outputDir = join(projectRoot, 'screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let devServer = null;
let browser = null;

async function startDevServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Vite dev server...');

    devServer = spawn('npm', ['run', 'dev'], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true
    });

    devServer.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Local:') || text.includes('localhost:5173')) {
        console.log('Dev server ready!');
        resolve('http://localhost:5173');
      }
    });

    devServer.stderr.on('data', (data) => {
      console.error('Dev server error:', data.toString());
    });

    setTimeout(() => {
      reject(new Error('Dev server did not start within 30 seconds'));
    }, 30000);
  });
}

async function inspectPlayfield(url) {
  console.log('Launching headless browser...');

  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Navigate to playfield.html
  const playfieldUrl = `${url}/playfield.html`;
  console.log(`Navigating to ${playfieldUrl}...`);
  await page.goto(playfieldUrl, { waitUntil: 'networkidle' });

  // Wait for React to render
  await page.waitForSelector('#root', { timeout: 10000 });

  // Wait for BabylonJS
  console.log('Waiting for BabylonJS initialization...');
  await page.waitForTimeout(2000);

  // Take screenshot of start screen
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const startScreenPath = join(outputDir, `playfield-start-${timestamp}.png`);
  await page.screenshot({ path: startScreenPath, fullPage: true });
  console.log(`Start screen saved: ${startScreenPath}`);

  // Click "Enter The Court" button
  console.log('Starting game...');
  const startButton = await page.waitForSelector('text=Enter The Court', { timeout: 5000 });
  await startButton.click();

  // Wait for game to initialize
  await page.waitForTimeout(3000);

  // Take screenshot of playfield (before draw)
  const playfieldPath = join(outputDir, `playfield-game-${timestamp}.png`);
  await page.screenshot({ path: playfieldPath, fullPage: true });
  console.log(`Playfield screenshot saved: ${playfieldPath}`);

  // Try to draw a card
  console.log('Attempting to draw card...');
  try {
    const drawButton = await page.waitForSelector('text=Draw Card', { timeout: 2000 });
    if (drawButton) {
      await drawButton.click();
      await page.waitForTimeout(2000);

      // Take screenshot after drawing
      const afterDrawPath = join(outputDir, `playfield-after-draw-${timestamp}.png`);
      await page.screenshot({ path: afterDrawPath, fullPage: true });
      console.log(`After draw screenshot saved: ${afterDrawPath}`);
    }
  } catch (e) {
    console.log('Draw button not available (might be different phase)');
  }

  // Get console logs
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

  // Inspect player areas
  const playerAreas = await page.evaluate(() => {
    const areas = [];
    const containers = document.querySelectorAll('[class*="player-"][class*="-container"]');
    containers.forEach((container, i) => {
      const rect = container.getBoundingClientRect();
      areas.push({
        index: i,
        id: container.id || container.className,
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        childCount: container.children.length
      });
    });
    return areas;
  });

  console.log('\nPlayer Areas Found:', playerAreas.length);
  playerAreas.forEach(area => {
    console.log(`  ${area.id}: ${area.childCount} children, ${area.bounds.width}x${area.bounds.height}`);
  });

  // Check for canvas element
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      width: canvas.width,
      height: canvas.height,
      displayWidth: rect.width,
      displayHeight: rect.height
    };
  });

  if (canvasInfo) {
    console.log('\nBabylonJS Canvas:', canvasInfo);
  } else {
    console.log('\nWARNING: No canvas element found!');
  }

  await browser.close();

  return {
    screenshots: [startScreenPath, playfieldPath],
    playerAreas,
    canvasInfo,
    logs: logs.slice(0, 20) // First 20 logs
  };
}

async function cleanup() {
  if (browser) {
    try {
      await browser.close();
    } catch (e) {
      console.error('Error closing browser:', e.message);
    }
  }

  if (devServer) {
    devServer.kill('SIGTERM');
    setTimeout(() => {
      if (devServer && !devServer.killed) {
        devServer.kill('SIGKILL');
      }
    }, 2000);
  }
}

async function main() {
  try {
    // Check if dev server is already running
    let serverUrl = 'http://localhost:5173';
    let startedServer = false;

    try {
      const response = await fetch(serverUrl);
      if (response.ok) {
        console.log('Using existing dev server at', serverUrl);
      }
    } catch (e) {
      serverUrl = await startDevServer();
      startedServer = true;
    }

    const result = await inspectPlayfield(serverUrl);

    console.log('\n=== Inspection Complete ===');
    result.screenshots.forEach(path => console.log(`Screenshot: ${path}`));

    if (result.logs.length > 0) {
      console.log('\nConsole Logs:');
      result.logs.forEach(log => console.log(`  ${log}`));
    }

    if (startedServer) {
      await cleanup();
    } else {
      if (browser) await browser.close();
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await cleanup();
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

main();
