#!/usr/bin/env node
/**
 * Records a GIF of interacting with the guild-glyph playground.
 *
 * Steps captured:
 *   1. Page loads with default state
 *   2. Clear the base input and type "guild-glyph" character by character
 *   3. Enable the animate checkbox
 *   4. Watch the glyph animate for a moment
 *
 * Uses Playwright screenshots + gif-encoder-2 (pure JS).
 */

import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import GIFEncoder from "gif-encoder-2";
import { PNG } from "pngjs";
import { createWriteStream } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const PLAYGROUND_URL = process.env.PLAYGROUND_URL || "http://localhost:5173/";
const WIDTH = 900;
const HEIGHT = 620;
const FPS = 10;
const FRAME_DELAY = 1000 / FPS; // ms between frames

async function captureFrame(page) {
  const buf = await page.screenshot({ type: "png" });
  const png = PNG.sync.read(buf);
  return png.data; // raw RGBA pixel buffer
}

async function main() {
  const gifPath = resolve(ROOT, "playground.gif");
  const frames = [];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    reducedMotion: "no-preference",
  });

  // Navigate to the playground
  await page.goto(PLAYGROUND_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Capture initial state (a few frames to let user see it)
  for (let i = 0; i < 10; i++) {
    frames.push(await captureFrame(page));
    await page.waitForTimeout(FRAME_DELAY);
  }

  // -- Interaction 1: Click the base input and clear it --
  const baseInput = page.locator('input[placeholder="arctic-fox"]');
  await baseInput.click({ clickCount: 3 }); // select all text
  frames.push(await captureFrame(page));
  await page.waitForTimeout(200);

  await page.keyboard.press("Backspace");
  await page.waitForTimeout(150);
  frames.push(await captureFrame(page));

  // -- Type "guild-glyph" character by character --
  const text = "guild-glyph";
  for (const char of text) {
    await baseInput.type(char, { delay: 0 });
    await page.waitForTimeout(80);
    frames.push(await captureFrame(page));
    await page.waitForTimeout(40);
  }

  // Pause to show the typed text
  for (let i = 0; i < 8; i++) {
    frames.push(await captureFrame(page));
    await page.waitForTimeout(FRAME_DELAY);
  }

  // -- Interaction 2: Enable animations --
  const animateCheckbox = page.locator('input[type="checkbox"]').first();
  await animateCheckbox.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  frames.push(await captureFrame(page));

  await animateCheckbox.click();
  await page.waitForTimeout(100);
  frames.push(await captureFrame(page));

  // -- Let the animation play, capturing frames --
  for (let i = 0; i < 30; i++) {
    frames.push(await captureFrame(page));
    await page.waitForTimeout(FRAME_DELAY);
  }

  await browser.close();

  // -- Encode GIF --
  console.log(`Encoding ${frames.length} frames to GIF...`);

  const encoder = new GIFEncoder(WIDTH, HEIGHT, "neuquant", true);
  encoder.setDelay(Math.round(FRAME_DELAY));
  encoder.setRepeat(0); // loop forever
  encoder.setQuality(10);

  const output = createWriteStream(gifPath);
  encoder.createReadStream().pipe(output);

  encoder.start();
  for (const frame of frames) {
    encoder.addFrame(frame);
  }
  encoder.finish();

  await new Promise((res) => output.on("finish", res));
  console.log(`\n✓ GIF saved to: ${gifPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
