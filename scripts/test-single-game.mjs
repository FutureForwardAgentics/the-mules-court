#!/usr/bin/env node

/**
 * Test a single game to verify automation works
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

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

async function playGame(page, playerCount) {
  console.log(`\n=== Playing ${playerCount}-player game ===`);

  // Track console errors
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.error('  Browser error:', text);
    }
  });

  // Track page errors
  page.on('pageerror', error => {
    console.error('  Page error:', error.message);
  });

  // Navigate to app
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForSelector('#root', { timeout: 10000 });

  // Wait for React to render
  await page.waitForTimeout(1000);

  // Select player count
  console.log(`Selecting ${playerCount} players...`);
  const playerButton = await page.getByText(`${playerCount} Players`, { exact: false });
  await playerButton.click();
  await page.waitForTimeout(300);

  // Click start button
  console.log('Starting game...');
  const startButton = await page.getByText('Submit to the Mule', { exact: false });
  await startButton.click();
  await page.waitForTimeout(1000);

  // Play game to completion
  let actionsCount = 0;
  const maxActions = 500;

  while (actionsCount < maxActions) {
    // Check if game ended
    const gameEndModal = await page.locator('[data-testid="game-end-modal"]').count();
    if (gameEndModal > 0) {
      console.log(`✅ Game completed successfully after ${actionsCount} actions`);
      return;
    }

    // Check for round end modal button
    const roundEndButton = await page.locator('[data-testid="round-end-continue-button"]').count();
    if (roundEndButton > 0) {
      console.log('  Round ended, continuing...');
      await page.locator('[data-testid="round-end-continue-button"]').click();
      await page.waitForTimeout(500);
      actionsCount++;
      continue;
    }

    // Check for next round button (in main area)
    const nextRoundButton = await page.locator('[data-testid="next-round-button"]').count();
    if (nextRoundButton > 0) {
      console.log('  Starting next round...');
      await page.locator('[data-testid="next-round-button"]').click();
      await page.waitForTimeout(500);
      actionsCount++;
      continue;
    }

    // Check if it's player's turn to draw
    const drawButton = await page.locator('[data-testid="draw-card-button"]').count();
    if (drawButton > 0) {
      console.log('  Drawing card...');
      await page.locator('[data-testid="draw-card-button"]').click();
      await page.waitForTimeout(500);
      actionsCount++;
      continue;
    }

    // Check if player needs to play a card
    const cards = await page.locator('[data-testid^="card-"]').all();
    if (cards.length > 0) {
      console.log(`  Playing card (${cards.length} available)...`);
      try {
        await cards[0].click();
        console.log('  Card clicked successfully');
        await page.waitForTimeout(500);
        console.log('  Waited after click');
      } catch (err) {
        console.error('  Error clicking card:', err.message);
        throw err;
      }
      actionsCount++;
      continue;
    }

    // Wait for AI to play
    await page.waitForTimeout(200);
    actionsCount++;
  }

  throw new Error(`Game did not complete within ${maxActions} actions`);
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

    console.log('Launching browser...');
    browser = await chromium.launch({
      headless: false, // Visible browser for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    // Test a 2-player game
    await playGame(page, 2);

    await context.close();
    await browser.close();

    if (startedServer && devServer) {
      devServer.kill('SIGTERM');
    }

    console.log('\n✅ Test passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (browser) await browser.close();
    if (devServer) devServer.kill('SIGTERM');
    process.exit(1);
  }
}

main();
