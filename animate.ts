/**
 * Animation system for GuildGlyph.
 *
 * Strategy: pure CSS, no runtime deps.
 * - Each glyph gets timing values derived from its hash → no two glyphs
 *   animate in sync, even when many are on screen.
 * - Three animation targets injected as CSS classes:
 *     .gg-l0  primary layer   → slow CW rotation idle, faster on hover
 *     .gg-l1  secondary layer → slow CCW rotation idle, faster on hover
 *     .gg-cm  center mark     → gentle pulse idle, pop on hover
 * - The parent <svg> gets class .gg-root; hover state is driven by
 *     .gg-root:hover .gg-lN selectors (no JS needed).
 * - CSS custom properties on the <svg> element carry per-glyph timing.
 */

let injected = false;

export function injectStyles(): void {
  if (injected || typeof document === "undefined") return;
  injected = true;

  const style = document.createElement("style");
  style.dataset.guildGlyph = "1";
  style.textContent = `
    /* ── Keyframes ───────────────────────────────────────────────── */

    @keyframes gg-spin-cw {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes gg-spin-ccw {
      from { transform: rotate(0deg); }
      to   { transform: rotate(-360deg); }
    }
    @keyframes gg-pulse {
      0%, 100% { transform: scale(1);    opacity: 1; }
      50%       { transform: scale(1.35); opacity: 0.7; }
    }

    /* ── Idle — primary layer (slow CW) ─────────────────────────── */
    .gg-l0 {
      transform-origin: var(--gg-cx) var(--gg-cy);
      animation: gg-spin-cw var(--gg-t0) linear infinite;
    }

    /* ── Idle — secondary layer (slow CCW) ──────────────────────── */
    .gg-l1 {
      transform-origin: var(--gg-cx) var(--gg-cy);
      animation: gg-spin-ccw var(--gg-t1) linear infinite;
    }

    /* ── Idle — center mark (gentle pulse) ──────────────────────── */
    .gg-cm {
      transform-origin: var(--gg-cx) var(--gg-cy);
      animation: gg-pulse var(--gg-tp) ease-in-out infinite;
    }

    /* ── Hover — speed up primary ───────────────────────────────── */
    .gg-root:hover .gg-l0 {
      animation-duration: var(--gg-t0h);
    }

    /* ── Hover — speed up secondary ─────────────────────────────── */
    .gg-root:hover .gg-l1 {
      animation-duration: var(--gg-t1h);
    }

    /* ── Hover — pop center mark ─────────────────────────────────── */
    .gg-root:hover .gg-cm {
      animation-duration: var(--gg-tph);
      animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* ── Respect prefers-reduced-motion ─────────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .gg-l0, .gg-l1, .gg-cm {
        animation: none;
      }
    }
  `;
  document.head.appendChild(style);
}

export interface AnimTiming {
  /** CSS custom properties to set on the root <svg> */
  vars: Record<string, string>;
}

/**
 * Derive per-glyph animation timing from the hash.
 * Returns CSS custom property values to set inline on the svg element.
 *
 * Idle rotation:   12s–28s  (primary CW)  /  16s–36s (secondary CCW)
 * Hover rotation:  2s–5s    (primary)     /  3s–7s   (secondary)
 * Pulse:           2.5s–5s  idle          /  0.6s–1s hover
 */
export function resolveAnimTiming(hash: number, size: number): AnimTiming {
  // Pull timing from different bit regions of the hash
  const a = ((hash >>> 0)  & 0xff) / 255;   // 0–1
  const b = ((hash >>> 8)  & 0xff) / 255;
  const c = ((hash >>> 16) & 0xff) / 255;
  const d = ((hash >>> 24) & 0xff) / 255;

  const t0  = (12 + a * 16).toFixed(2) + "s";   // idle primary:    12–28s
  const t1  = (16 + b * 20).toFixed(2) + "s";   // idle secondary:  16–36s
  const tp  = (2.5 + c * 2.5).toFixed(2) + "s"; // idle pulse:      2.5–5s
  const t0h = (2 + d * 3).toFixed(2) + "s";     // hover primary:   2–5s
  const t1h = (3 + a * 4).toFixed(2) + "s";     // hover secondary: 3–7s
  const tph = (0.6 + b * 0.4).toFixed(2) + "s"; // hover pulse:     0.6–1s

  const cx = (size / 2).toFixed(1) + "px";
  const cy = cx;

  return {
    vars: {
      "--gg-cx":  cx,
      "--gg-cy":  cy,
      "--gg-t0":  t0,
      "--gg-t1":  t1,
      "--gg-tp":  tp,
      "--gg-t0h": t0h,
      "--gg-t1h": t1h,
      "--gg-tph": tph,
    },
  };
}
