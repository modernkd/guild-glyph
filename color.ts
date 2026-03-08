import { Palette } from "./palette.js";

// ── sRGB ↔ Linear RGB ─────────────────────────────────────────────────────

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function delinearize(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// ── Linear RGB ↔ OKLab ────────────────────────────────────────────────────
// Björn Ottosson's OKLab matrices (direct linear RGB path, no XYZ step).

function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

// ── OKLab ↔ OKLCH ─────────────────────────────────────────────────────────

function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  const H = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return [L, C, H];
}

function oklchToOklab(L: number, C: number, H: number): [number, number, number] {
  const rad = (H * Math.PI) / 180;
  return [L, C * Math.cos(rad), C * Math.sin(rad)];
}

// ── OKLCH → hex ───────────────────────────────────────────────────────────

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function toHexByte(x: number): string {
  return Math.round(clamp01(x) * 255)
    .toString(16)
    .padStart(2, "0");
}

export function oklchToHex(L: number, C: number, H: number): string {
  const [la, lb, lc] = oklchToOklab(L, C, H);
  const [r, g, b] = oklabToLinearRgb(la, lb, lc);
  return `#${toHexByte(delinearize(r))}${toHexByte(delinearize(g))}${toHexByte(delinearize(b))}`;
}

// ── CSS color string → OKLCH ──────────────────────────────────────────────
// Uses a 1×1 canvas to parse any valid CSS color (hex, rgb(), hsl(),
// oklch(), named colors, etc.). Returns null in non-browser environments.

function cssToLinearRgb(color: string): [number, number, number] | null {
  if (typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Reset to transparent black first; if the color string is invalid
    // the assignment silently fails and fillStyle stays as-is.
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = color; // may be a no-op for invalid values
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [linearize(d[0] / 255), linearize(d[1] / 255), linearize(d[2] / 255)];
  } catch {
    return null;
  }
}

export function cssToOklch(color: string): [number, number, number] | null {
  const rgb = cssToLinearRgb(color);
  if (!rgb) return null;
  const lab = linearRgbToOklab(...rgb);
  return oklabToOklch(...lab);
}

// ── Palette derivation ─────────────────────────────────────────────────────
// Given any CSS color, derive a harmonious dark-background palette.
//
// Strategy:
//   fg     — the input color, brightness-lifted if too dark
//   accent — hue +25°, slightly different lightness/chroma
//   bg     — very dark, near-achromatic, hue-tinted
//   dim    — slightly lighter bg

export function paletteFromColor(color: string): Palette | null {
  const lch = cssToOklch(color);
  if (!lch) return null;

  const [, C, H] = lch;

  // Ensure fg is visible on a dark background
  const fgL = 0.75;
  const fgC = Math.max(C, 0.10);

  const fg     = oklchToHex(fgL,        fgC,               H);
  const accent = oklchToHex(fgL - 0.05, fgC * 1.15,        (H + 25) % 360);
  const bg     = oklchToHex(0.12,       Math.min(C * 0.18, 0.025), H);
  const dim    = oklchToHex(0.18,       Math.min(C * 0.22, 0.035), H);

  return { bg, fg, accent, dim };
}
