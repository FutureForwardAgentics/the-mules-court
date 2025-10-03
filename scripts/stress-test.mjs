#!/usr/bin/env node

/**
 * Automated Game Stress Test
 *
 * Plays multiple games to completion using Playwright automation
 * Tests 2-player (100 games), 3-player (50 games), 4-player (25 games)
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const TEST_CONFIG = {
  2: { games: 100, tokensToWin: 7 },
  3: { games: 50, tokensToWin: 5 },
  4: { games: 25, tokensToWin: 4 },
};

let devServer = null;
let browser = null;
const errors = [];
const warnings = [];

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

    devServer.on('error', (error) => {
      reject(new Error(`Failed to start dev server: ${error.message}`));
    });

    setTimeout(() => {
      reject(new Error('Dev server did not start within 30 seconds'));
    }, 30000);
  });
}

async function playGame(page, playerCount) {
  // Track console messages
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push({ playerCount, message: text });
    } else if (msg.type() === 'warning') {
      warnings.push({ playerCount, message: text });
    }
  });

  // Navigate to app
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForSelector('#root', { timeout: 10000 });

  // Wait for React to render
  await page.waitForTimeout(1000);

  // Select player count
  const playerButton = await page.getByText(`${playerCount} Players`, { exact: false });
  await playerButton.click();
  await page.waitForTimeout(300);

  // Click start button
  const startButton = await page.getByText('Submit to the Mule', { exact: false });
  await startButton.click();
  await page.waitForTimeout(1000);

  // Play game to completion
  let actionsCount = 0;
  const maxActions = 500; // Safety limit

  while (actionsCount < maxActions) {
    // Check if game ended
    const gameEndModal = await page.locator('[data-testid="game-end-modal"]').count();
    if (gameEndModal > 0) {
      console.log(`  Game completed after ${actionsCount} actions`);
      break;
    }

    // Check for round end modal button
    const roundEndButton = await page.locator('[data-testid="round-end-continue-button"]').count();
    if (roundEndButton > 0) {
      await page.locator('[data-testid="round-end-continue-button"]').click();
      await page.waitForTimeout(500);
      actionsCount++;
      continue;
    }

    // Check for next round button (in main area)
    const nextRoundButton = await page.locator('[data-testid="next-round-button"]').count();
    if (nextRoundButton > 0) {
      await page.locator('[data-testid="next-round-button"]').click();
      await page.waitForTimeout(500);
      actionsCount++;
      continue;
    }

    // Check if it's player's turn to draw
    const drawButton = await page.locator('[data-testid="draw-card-button"]').count();
    if (drawButton > 0) {
      await page.locator('[data-testid="draw-card-button"]').click();
      await page.waitForTimeout(500);
      actionsCount++;
      continue;
    }

    // Check if player needs to play a card
    const cards = await page.locator('[data-testid^="card-"]').all();
    if (cards.length > 0) {
      // Player has cards, play the first one
      await cards[0].click();
      await page.waitForTimeout(500);
      actionsCount++;
      continue;
    }

    // Check for end turn button (after playing card)
    const endTurnButton = await page.locator('[data-testid="end-turn-button"]').count();
    if (endTurnButton > 0) {
      await page.locator('[data-testid="end-turn-button"]').click();
      await page.waitForTimeout(500);
      actionsCount++;
      continue;
    }

    // Wait for AI to play
    await page.waitForTimeout(200);
    actionsCount++;

    // Safety check - if no actions for a while, something is wrong
    if (actionsCount % 100 === 0) {
      const phase = await page.evaluate(() => {
        const statusText = document.querySelector('.text-white')?.textContent;
        return statusText || 'unknown';
      });
      console.log(`    [${actionsCount} actions] Current phase: ${phase}`);
    }
  }

  if (actionsCount >= maxActions) {
    errors.push({ playerCount, message: `Game did not complete within ${maxActions} actions` });
  }
}

async function runStressTest() {
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

    console.log('Launching headless browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Run tests for each player count
    for (const [playerCount, config] of Object.entries(TEST_CONFIG)) {
      console.log(`\n=== Testing ${playerCount}-Player Games (${config.games} games) ===`);

      for (let i = 0; i < config.games; i++) {
        const context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
        });
        const page = await context.newPage();

        try {
          console.log(`  Playing game ${i + 1}/${config.games}...`);
          await playGame(page, parseInt(playerCount));
        } catch (error) {
          errors.push({ playerCount, message: `Game ${i + 1} failed: ${error.message}` });
          console.error(`  ❌ Game ${i + 1} failed:`, error.message);
        } finally {
          await context.close();
        }
      }

      console.log(`  ✅ Completed ${config.games} games for ${playerCount} players`);
    }

    // Report results
    console.log('\n=== Test Results ===');
    console.log(`Total Errors: ${errors.length}`);
    console.log(`Total Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. [${err.playerCount}p] ${err.message}`);
      });
    }

    if (warnings.length > 0 && warnings.length <= 20) {
      console.log('\n⚠️  Warnings:');
      warnings.slice(0, 20).forEach((warn, idx) => {
        console.log(`  ${idx + 1}. [${warn.playerCount}p] ${warn.message}`);
      });
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ All tests passed with no errors or warnings!');
    }

    // Cleanup
    if (browser) await browser.close();
    if (startedServer && devServer) {
      devServer.kill('SIGTERM');
    }

    process.exit(errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('Stress test failed:', error.message);
    if (browser) await browser.close();
    if (devServer) devServer.kill('SIGTERM');
    process.exit(1);
  }
}

runStressTest();
