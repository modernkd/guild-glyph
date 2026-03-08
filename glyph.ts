import React from "react";
import { stringHash, makeRands } from "./hash.js";
import { PALETTE, Palette } from "./palette.js";
import { TEAM_LAYERS, APP_LAYERS, layerCenterMark } from "./layers.js";

// Animation class names for each layer slot and the center mark.
// Consumed by animate.ts CSS and the GuildGlyph component.
export const ANIM_CLASSES = {
  layer0: "gg-l0",
  layer1: "gg-l1",
  centerMark: "gg-cm",
  root: "gg-root",
} as const;

function buildGlyph(
  seed: number,
  layerPool: typeof TEAM_LAYERS,
  palette: Palette,
  size: number,
  animate: boolean,
): React.ReactElement[] {
  const [r0, r1, r2, r3, r4] = makeRands(seed);
  const c = size / 2;
  const r = size * 0.3;

  // 2 or 3 layers — decision isolated to r4
  const layerCount = r4() > 0.38 ? 3 : 2;

  // Deterministic shuffle — each comparison uses its own hash region
  const order = [...Array(layerPool.length).keys()].sort((a, b) => {
    return makeRands(seed ^ (a * 31 + b * 97))[0]() - 0.5;
  });
  const chosen = order.slice(0, layerCount);

  const layerRands = [r1, r2, r3];
  const groups: React.ReactElement[] = [];

  chosen.forEach((idx, i) => {
    const layerShapes = layerPool[idx](c, r, palette, layerRands[i], `L${idx}`, animate);
    // Wrap each layer in a <g> so CSS can target it independently.
    // First two layers get animation classes; extras are static.
    const animClass = animate
      ? i === 0 ? ANIM_CLASSES.layer0
      : i === 1 ? ANIM_CLASSES.layer1
      : undefined
      : undefined;
    groups.push(
      React.createElement("g", { key: `g${i}`, className: animClass }, ...layerShapes)
    );
  });

  // Center mark — always on top, own animation class
  const cmShapes = layerCenterMark(c, r, palette, r4, "CM", animate);
  groups.push(
    React.createElement("g", {
      key: "gcm",
      className: animate ? ANIM_CLASSES.centerMark : undefined,
    }, ...cmShapes)
  );

  return groups;
}

export function resolveTeamGlyph(
  base: string,
  size: number,
  animate = false,
  overridePalette?: Palette,
) {
  const hash = stringHash(base);
  const palette = overridePalette ?? PALETTE[hash % PALETTE.length];
  const shapes = buildGlyph(hash, TEAM_LAYERS, palette, size, animate);
  return { shapes, palette, hash };
}

export function resolveAppGlyph(
  base: string,
  variant: string,
  size: number,
  animate = false,
  overridePalette?: Palette,
) {
  const teamHash = stringHash(base);
  const appHash = stringHash(`${base}/${variant}`);
  const basePalette = overridePalette ?? PALETTE[teamHash % PALETTE.length];
  // App palette inherits base colors but swaps fg/accent for visual distinction.
  // If a full palette override is supplied, use it as-is (no swap).
  const palette: Palette = overridePalette
    ? overridePalette
    : {
        bg: basePalette.bg,
        fg: basePalette.accent,
        accent: basePalette.fg,
        dim: basePalette.dim,
      };
  const shapes = buildGlyph(appHash, APP_LAYERS, palette, size, animate);
  return { shapes, palette, hash: appHash };
}
