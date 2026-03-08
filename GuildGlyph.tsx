import React, { useEffect } from "react";
import { resolveTeamGlyph, resolveAppGlyph, ANIM_CLASSES } from "./glyph.js";
import { injectStyles, resolveAnimTiming } from "./animate.js";
import { paletteFromColor } from "./color.js";
import { Palette } from "./palette.js";

export interface GuildGlyphProps {
  /** Slug — always the palette anchor. Required. */
  base: string;
  /**
   * Variant slug — when provided, renders a variant glyph that inherits
   * the base's palette family (with fg/accent swapped). When omitted,
   * renders the base glyph.
   */
  variant?: string;
  /** Size in px. Applied to both width and height. Default: 64 */
  size?: number;
  /**
   * Enable animations.
   * - Idle: primary layer rotates CW, secondary CCW, center mark pulses.
   * - Hover: rotation speeds up, center mark pops.
   * - Timing is derived from the slug hash — no two glyphs animate in sync.
   * - Automatically respects `prefers-reduced-motion`.
   * Default: false
   */
  animate?: boolean;
  /**
   * Any valid CSS color string (hex, rgb(), hsl(), oklch(), named colors, …).
   * The library derives a full dark-background palette from it using OKLCH.
   * Ignored if `palette` is also provided.
   */
  color?: string;
  /**
   * Full palette override. When provided, the hash-selected palette (and any
   * `color` derivation) is bypassed entirely. You control all four colors.
   */
  palette?: Palette;
  /** Additional class name on the <svg> element. */
  className?: string;
  /** Additional inline styles on the <svg> element. */
  style?: React.CSSProperties;
  /** Accessible label. Defaults to "{base}" or "{base}/{variant}". */
  "aria-label"?: string;
}

export function GuildGlyph({
  base,
  variant,
  size = 64,
  animate = false,
  color,
  palette: paletteProp,
  className,
  style,
  "aria-label": ariaLabel,
}: GuildGlyphProps) {
  // Inject shared CSS once on first animated render
  useEffect(() => {
    if (animate) injectStyles();
  }, [animate]);

  const isApp = variant !== undefined && variant !== "";

  // Palette resolution order: explicit palette > color-derived > hash-selected.
  // For app glyphs with a color-derived palette, we still apply the fg/accent
  // swap so the visual distinction between base and variant is preserved.
  let overridePalette: Palette | undefined;
  if (paletteProp) {
    overridePalette = paletteProp;
  } else if (color) {
    const derived = paletteFromColor(color);
    if (derived) {
      overridePalette = isApp
        ? { bg: derived.bg, fg: derived.accent, accent: derived.fg, dim: derived.dim }
        : derived;
    }
  }

  const { shapes, palette, hash } = isApp
    ? resolveAppGlyph(base, variant!, size, animate, overridePalette)
    : resolveTeamGlyph(base, size, animate, overridePalette);

  const borderRadius = size * 0.18;
  const label = ariaLabel ?? (isApp ? `${base}/${variant}` : base);

  // Per-glyph timing vars — only computed when animate is on
  const animVars = animate ? resolveAnimTiming(hash, size).vars : {};

  const rootClass = [
    animate ? ANIM_CLASSES.root : undefined,
    className,
  ].filter(Boolean).join(" ") || undefined;

  return React.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: `0 0 ${size} ${size}`,
      role: "img",
      "aria-label": label,
      className: rootClass,
      style: {
        display: "block",
        flexShrink: 0,
        borderRadius,
        ...animVars,
        ...style,
      },
    },
    React.createElement("rect", {
      width: size,
      height: size,
      rx: borderRadius,
      fill: palette.bg,
    }),
    ...shapes
  );
}

export default GuildGlyph;
