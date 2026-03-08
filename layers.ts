import React from "react";
import { Palette } from "./palette.js";

type Rand = () => number;
type Layer = (c: number, r: number, pal: Palette, rand: Rand, key: string, animate: boolean) => React.ReactElement[];

const toRad = (d: number) => (d * Math.PI) / 180;
const polar = (cx: number, cy: number, r: number, angle: number): [number, number] => [
  cx + r * Math.cos(toRad(angle)),
  cy + r * Math.sin(toRad(angle)),
];

// ── SMIL helpers ──────────────────────────────────────────────────────────────

function smilAnimate(attrs: Record<string, string | number>): React.ReactElement {
  return React.createElement("animate", attrs as Record<string, unknown>);
}

// ── Layers ────────────────────────────────────────────────────────────────────

export const layerRing: Layer = (c, r, pal, rand, key) => {
  const sweep = 60 + rand() * 280;
  const startA = rand() * 360;
  const [x1, y1] = polar(c, c, r, startA);
  const [x2, y2] = polar(c, c, r, startA + sweep);
  const large = sweep > 180 ? 1 : 0;
  const sw = r * 0.14 + rand() * r * 0.1;
  if (rand() > 0.65) {
    return [
      React.createElement("circle", { key, cx: c, cy: c, r, fill: pal.dim, stroke: pal.fg, strokeWidth: sw * 0.5 }),
    ];
  }
  return [
    React.createElement("path", {
      key,
      d: `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`,
      stroke: pal.fg, strokeWidth: sw, fill: "none", strokeLinecap: "round",
    }),
  ];
};

export const layerInnerRing: Layer = (c, r, pal, rand, key) => {
  const r2 = r * (0.32 + rand() * 0.38);
  const sweep = 80 + rand() * 250;
  const startA = rand() * 360;
  const [x1, y1] = polar(c, c, r2, startA);
  const [x2, y2] = polar(c, c, r2, startA + sweep);
  const large = sweep > 180 ? 1 : 0;
  const sw = r2 * 0.2;
  return [
    React.createElement("path", {
      key,
      d: `M${x1},${y1} A${r2},${r2} 0 ${large} 1 ${x2},${y2}`,
      stroke: pal.accent, strokeWidth: sw, fill: "none", strokeLinecap: "round",
    }),
  ];
};

export const layerPolygon: Layer = (c, r, pal, rand, key) => {
  const sides = Math.floor(3 + rand() * 5);
  const rot = rand() * 360;
  const pr = r * (0.65 + rand() * 0.4);
  const pts = Array.from({ length: sides }, (_, i) => {
    const [x, y] = polar(c, c, pr, rot + (i / sides) * 360);
    return `${x},${y}`;
  }).join(" ");
  const filled = rand() > 0.58;
  const sw = r * 0.1 + rand() * r * 0.08;
  return [
    React.createElement("polygon", {
      key, points: pts,
      stroke: pal.fg, strokeWidth: sw, strokeLinejoin: "round",
      fill: filled ? pal.dim : "none",
    }),
  ];
};

export const layerCross: Layer = (c, r, pal, rand, key) => {
  const rot = rand() * 90;
  const arm1 = r * (0.55 + rand() * 0.5);
  const arm2 = r * (0.4 + rand() * 0.55);
  const sw = r * 0.12 + rand() * r * 0.06;
  return [[rot, arm1, pal.fg], [rot + 90, arm2, pal.accent]].map(([a, len, stroke], i) => {
    const [x1, y1] = polar(c, c, len as number, a as number);
    const [x2, y2] = polar(c, c, len as number, (a as number) + 180);
    return React.createElement("line", {
      key: `${key}_${i}`, x1, y1, x2, y2,
      stroke: stroke as string, strokeWidth: sw, strokeLinecap: "round",
    });
  });
};

export const layerDots: Layer = (c, r, pal, rand, key, animate) => {
  const count = Math.floor(2 + rand() * 6);
  const ringR = r * (0.5 + rand() * 0.58);
  const startA = rand() * 360;
  const dotR = r * (0.055 + rand() * 0.075);
  // Always consume this rand so shape stays deterministic regardless of animate
  const durRaw = rand();
  const dur = (1.4 + durRaw * 1.2).toFixed(2);

  return Array.from({ length: count }, (_, i) => {
    const [x, y] = polar(c, c, ringR, startA + (i / count) * 360);
    const fill = i % 2 === 0 ? pal.accent : pal.fg;
    const opacity = 0.65 + rand() * 0.35;
    const rBig = (dotR * 1.65).toFixed(2);
    // Stagger each dot's phase across the duration cycle
    const begin = ((i / count) * parseFloat(dur)).toFixed(2) + "s";

    return React.createElement(
      "circle",
      { key: `${key}_${i}`, cx: x, cy: y, r: dotR, fill, opacity },
      animate
        ? smilAnimate({
            attributeName: "r",
            values: `${dotR};${rBig};${dotR}`,
            dur: `${dur}s`,
            begin,
            repeatCount: "indefinite",
          })
        : null,
    );
  });
};

export const layerCenterMark: Layer = (c, r, pal, rand, key) => {
  const v = Math.floor(rand() * 5);
  const cr = r * (0.055 + rand() * 0.095);
  if (v === 0) return [React.createElement("circle", { key, cx: c, cy: c, r: cr, fill: pal.accent })];
  if (v === 1) return [React.createElement("circle", { key, cx: c, cy: c, r: cr, fill: "none", stroke: pal.accent, strokeWidth: cr * 0.55 })];
  if (v === 2) {
    const s = cr * 1.4;
    return [React.createElement("rect", { key, x: c - s, y: c - s, width: s * 2, height: s * 2, rx: s * 0.25, fill: pal.accent })];
  }
  if (v === 3) {
    const s = cr * 1.4;
    return [React.createElement("rect", { key, x: c - s, y: c - s, width: s * 2, height: s * 2, rx: s * 0.25, fill: "none", stroke: pal.accent, strokeWidth: cr * 0.45 })];
  }
  return [];
};

export const layerBrackets: Layer = (c, r, pal, rand, key) => {
  const inset = r * (0.52 + rand() * 0.48);
  const armLen = r * (0.22 + rand() * 0.38);
  const sw = r * 0.11;
  const corners = [
    { x: c - inset, y: c - inset, dx: 1,  dy: 1  },
    { x: c + inset, y: c - inset, dx: -1, dy: 1  },
    { x: c + inset, y: c + inset, dx: -1, dy: -1 },
    { x: c - inset, y: c + inset, dx: 1,  dy: -1 },
  ];
  return corners
    .filter(() => rand() > 0.2)
    .map((co, i) =>
      React.createElement("path", {
        key: `${key}_${i}`,
        d: `M${co.x},${co.y + co.dy * armLen} L${co.x},${co.y} L${co.x + co.dx * armLen},${co.y}`,
        stroke: rand() > 0.5 ? pal.fg : pal.accent,
        strokeWidth: sw, fill: "none", strokeLinecap: "round", strokeLinejoin: "round",
      })
    );
};

export const layerLines: Layer = (c, r, pal, rand, key, animate) => {
  const count = Math.floor(2 + rand() * 4);
  const baseAngle = rand() * 180;
  const sw = r * 0.075 + rand() * r * 0.055;
  // Always consumed — animation duration
  const durRaw = rand();
  const dur = (1.0 + durRaw * 1.2).toFixed(2);
  // Dash length: looks good relative to line size
  const dash = r * 0.32;
  const gap = r * 0.18;

  return Array.from({ length: count }, (_, i) => {
    const offset = (i - (count - 1) / 2) * (r * 0.3);
    const perpA = baseAngle + 90;
    const ox = offset * Math.cos(toRad(perpA));
    const oy = offset * Math.sin(toRad(perpA));
    const halfLen = r * (0.38 + rand() * 0.52);
    const [x1, y1] = polar(c + ox, c + oy, halfLen, baseAngle);
    const [x2, y2] = polar(c + ox, c + oy, halfLen, baseAngle + 180);
    const stroke = i % 2 === 0 ? pal.fg : pal.accent;
    const opacity = 0.55 + rand() * 0.45;
    // Stagger phase so lines don't all march in lockstep
    const begin = ((i / count) * parseFloat(dur)).toFixed(2) + "s";
    const strokeWidth = sw * (1 - i * 0.07);

    if (animate) {
      return React.createElement(
        "line",
        {
          key: `${key}_${i}`, x1, y1, x2, y2, stroke, strokeWidth,
          strokeLinecap: "round", opacity,
          strokeDasharray: `${dash} ${gap}`,
        },
        smilAnimate({
          attributeName: "stroke-dashoffset",
          from: String(dash + gap),
          to: "0",
          dur: `${dur}s`,
          begin,
          repeatCount: "indefinite",
        }),
      );
    }

    return React.createElement("line", {
      key: `${key}_${i}`, x1, y1, x2, y2, stroke, strokeWidth,
      strokeLinecap: "round", opacity,
    });
  });
};

export const layerSpoke: Layer = (c, r, pal, rand, key) => {
  const count = Math.floor(3 + rand() * 6);
  const rot = rand() * 360;
  const inner = r * (0.08 + rand() * 0.18);
  const outer = r * (0.5 + rand() * 0.52);
  const sw = r * 0.085;
  return Array.from({ length: count }, (_, i) => {
    const a = rot + (i / count) * 360;
    const [x1, y1] = polar(c, c, inner, a);
    const [x2, y2] = polar(c, c, outer, a);
    return React.createElement("line", {
      key: `${key}_${i}`, x1, y1, x2, y2,
      stroke: i % 2 === 0 ? pal.fg : pal.accent,
      strokeWidth: sw, strokeLinecap: "round",
      opacity: 0.5 + rand() * 0.5,
    });
  });
};

export const layerWave: Layer = (c, r, pal, rand, key, animate) => {
  const segments = Math.floor(4 + rand() * 6);
  const amplitude = r * (0.12 + rand() * 0.22);
  const baseY = c + (rand() - 0.5) * r * 0.6;
  // Always consumed — animation duration
  const durRaw = rand();
  const dur = (1.6 + durRaw * 1.6).toFixed(2);

  const startX = c - r * 0.85;
  const endX = c + r * 0.85;
  const sw = r * 0.1;

  // Build a wave path; invert=true flips all crests to troughs
  const buildPath = (invert: boolean) => {
    let d = `M${startX.toFixed(2)},${baseY.toFixed(2)}`;
    for (let i = 0; i < segments; i++) {
      const x    = startX + (endX - startX) * ((i + 1) / segments);
      const prevX = startX + (endX - startX) * (i / segments);
      const midX  = (prevX + x) / 2;
      const yOff  = (i % 2 === 0 ? 1 : -1) * amplitude * (invert ? -1 : 1);
      d += ` Q${midX.toFixed(2)},${(baseY + yOff).toFixed(2)} ${x.toFixed(2)},${baseY.toFixed(2)}`;
    }
    return d;
  };

  const path1 = buildPath(false);

  if (animate) {
    const path2 = buildPath(true);
    return [
      React.createElement(
        "path",
        { key, d: path1, stroke: pal.fg, strokeWidth: sw, fill: "none", strokeLinecap: "round" },
        smilAnimate({
          attributeName: "d",
          values: `${path1};${path2};${path1}`,
          dur: `${dur}s`,
          repeatCount: "indefinite",
        }),
      ),
    ];
  }

  return [
    React.createElement("path", { key, d: path1, stroke: pal.fg, strokeWidth: sw, fill: "none", strokeLinecap: "round" }),
  ];
};

export const layerGrid: Layer = (c, r, pal, rand, key) => {
  const cols = Math.floor(2 + rand() * 3);
  const rows = Math.floor(2 + rand() * 3);
  const cellW = (r * 1.6) / cols;
  const cellH = (r * 1.6) / rows;
  const startX = c - r * 0.8;
  const startY = c - r * 0.8;
  const shapes: React.ReactElement[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (rand() > 0.35) {
        const x = startX + col * cellW + cellW * 0.1;
        const y = startY + row * cellH + cellH * 0.1;
        const w = cellW * 0.8;
        const h = cellH * 0.8;
        const useAccent = rand() > 0.5;
        shapes.push(
          React.createElement("rect", {
            key: `${key}_${row}_${col}`,
            x, y, width: w, height: h, rx: w * 0.18,
            fill: useAccent ? pal.dim : "none",
            stroke: useAccent ? pal.accent : pal.fg,
            strokeWidth: r * 0.06,
            opacity: 0.5 + rand() * 0.5,
          })
        );
      }
    }
  }
  return shapes;
};

// ── Pools ─────────────────────────────────────────────────────────────────────

export const TEAM_LAYERS: Layer[] = [
  layerRing, layerPolygon, layerCross, layerDots,
  layerBrackets, layerLines, layerSpoke, layerWave, layerGrid,
];

export const APP_LAYERS: Layer[] = [
  layerInnerRing, layerPolygon, layerCross, layerDots,
  layerBrackets, layerLines, layerSpoke, layerWave, layerGrid,
];
