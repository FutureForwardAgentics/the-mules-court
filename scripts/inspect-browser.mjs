#!/usr/bin/env node

/**
 * Browser Inspection Tool
 *
 * Launches the React dev server, renders the app in a headless browser,
 * captures screenshots, and inspects the DOM structure.
 *
 * Usage: node scripts/inspect-browser.mjs [options]
 *
 * Options:
 *   --screenshot-only   Only take a screenshot, don't return DOM
 *   --dom-only          Only return DOM structure, no screenshot
 *   --selector <sel>    Inspect specific element by CSS selector
 *   --viewport <size>   Set viewport size (default: 1280x720)
 *   --wait <ms>         Additional wait time after load (default: 2000ms)
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  screenshotOnly: args.includes('--screenshot-only'),
  domOnly: args.includes('--dom-only'),
  selector: args.includes('--selector') ? args[args.indexOf('--selector') + 1] : null,
  viewport: args.includes('--viewport') ? args[args.indexOf('--viewport') + 1] : '1280x720',
  wait: args.includes('--wait') ? parseInt(args[args.indexOf('--wait') + 1]) : 2000,
};

const [width, height] = options.viewport.split('x').map(Number);

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

    let output = '';

    devServer.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;

      // Look for the local server URL
      if (text.includes('Local:') || text.includes('localhost:5173')) {
        console.log('Dev server ready!');
        resolve('http://localhost:5173');
      }
    });

    devServer.stderr.on('data', (data) => {
      console.error('Dev server error:', data.toString());
    });

    devServer.on('error', (error) => {
      reject(new Error(`Failed to start dev server: ${error.message}`));
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      reject(new Error('Dev server did not start within 30 seconds'));
    }, 30000);
  });
}

async function inspectBrowser(url) {
  console.log('Launching headless browser...');

  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2, // Retina display
  });

  const page = await context.newPage();

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for React to render
  await page.waitForSelector('#root', { timeout: 10000 });

  // Additional wait time for PixiJS to initialize
  console.log(`Waiting ${options.wait}ms for PixiJS initialization...`);
  await page.waitForTimeout(options.wait);

  const result = {};

  // Take screenshot
  if (!options.domOnly) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = join(outputDir, `screenshot-${timestamp}.png`);

    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    result.screenshot = screenshotPath;
    console.log(`Screenshot saved to: ${screenshotPath}`);
  }

  // Inspect DOM
  if (!options.screenshotOnly) {
    const selector = options.selector || 'body';

    const domStructure = await page.evaluate((sel) => {
      function getElementInfo(el) {
        if (!el) return null;

        const rect = el.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(el);

        return {
          tagName: el.tagName.toLowerCase(),
          id: el.id || null,
          className: el.className || null,
          textContent: el.textContent?.trim().substring(0, 100) || null,
          attributes: Array.from(el.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {}),
          boundingBox: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          childCount: el.children.length,
          children: Array.from(el.children).slice(0, 20).map(child => ({
            tagName: child.tagName.toLowerCase(),
            id: child.id || null,
            className: child.className || null
          }))
        };
      }

      const element = document.querySelector(sel);
      return getElementInfo(element);
    }, selector);

    result.dom = domStructure;
    console.log('\nDOM Structure:');
    console.log(JSON.stringify(domStructure, null, 2));
  }

  // Get page title and URL
  result.title = await page.title();
  result.url = page.url();

  // Get console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  await page.waitForTimeout(500); // Capture any console logs
  result.consoleLogs = consoleLogs;

  await browser.close();
  return result;
}

async function cleanup() {
  console.log('\nCleaning up...');

  if (browser) {
    try {
      await browser.close();
    } catch (e) {
      console.error('Error closing browser:', e.message);
    }
  }

  if (devServer) {
    devServer.kill('SIGTERM');

    // Force kill after 2 seconds if still running
    setTimeout(() => {
      if (devServer && !devServer.killed) {
        devServer.kill('SIGKILL');
      }
    }, 2000);
  }
}

// Main execution
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
      // Server not running, start it
      serverUrl = await startDevServer();
      startedServer = true;
    }

    const result = await inspectBrowser(serverUrl);

    console.log('\n=== Inspection Complete ===');
    console.log(`Title: ${result.title}`);
    console.log(`URL: ${result.url}`);
    if (result.screenshot) {
      console.log(`Screenshot: ${result.screenshot}`);
    }
    if (result.consoleLogs?.length > 0) {
      console.log('\nConsole Logs:');
      result.consoleLogs.forEach(log => {
        console.log(`  [${log.type}] ${log.text}`);
      });
    }

    // Only cleanup if we started the server
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

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, cleaning up...');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, cleaning up...');
  await cleanup();
  process.exit(0);
});

main();
