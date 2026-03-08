import React, { useState, useMemo, useId } from "react";
import { createRoot } from "react-dom/client";
import { GuildGlyph } from "./GuildGlyph";
import { PALETTE, Palette } from "./palette";
import { paletteFromColor } from "./color";
import { injectStyles } from "./animate";

// ── Stress-test slug corpus ────────────────────────────────────────────────

const WORDS_A = [
  "arctic", "cobalt", "ember", "falcon", "ghost", "harbor", "iron",
  "jade", "kestrel", "lunar", "mossy", "nova", "obsidian", "polar",
  "quartz", "raven", "slate", "tidal", "umbra", "velvet", "wren",
  "xenon", "yew", "zinc", "amber", "blaze", "cedar", "drift",
];

const WORDS_B = [
  "fox", "hawk", "ridge", "peak", "stone", "cloud", "wave", "gate",
  "pine", "vale", "shelf", "brook", "grove", "spire", "crest", "bloom",
  "shore", "torch", "wind", "root", "reef", "moor", "fen", "mere",
];

const STRESS_SLUGS: string[] = [];
for (let i = 0; i < WORDS_A.length; i++) {
  for (let j = 0; j < 4 && STRESS_SLUGS.length < 96; j++) {
    STRESS_SLUGS.push(`${WORDS_A[i]}-${WORDS_B[(i * 3 + j * 7) % WORDS_B.length]}`);
  }
}

const SIZES = [32, 40, 48, 56, 64, 80, 96];

// ── Tiny design tokens ────────────────────────────────────────────────────

const C = {
  bg: "#0d0d0f",
  surface: "#141418",
  border: "#232328",
  muted: "#606068",
  text: "#e2e2e6",
  accent: "#818cf8",
} as const;

const card: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: 16,
};

// ── Components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        color: C.text,
        padding: "6px 10px",
        fontFamily: "inherit",
        fontSize: 13,
        outline: "none",
        ...style,
      }}
    />
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: color, border: `1px solid ${C.border}` }} />
      <span style={{ color: C.muted, fontSize: 10 }}>{label}</span>
    </div>
  );
}

function PaletteSwatches({ palette }: { palette: Palette }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      <Swatch color={palette.bg}     label="bg" />
      <Swatch color={palette.fg}     label="fg" />
      <Swatch color={palette.accent} label="accent" />
      <Swatch color={palette.dim}    label="dim" />
    </div>
  );
}

// ── Color mode types ──────────────────────────────────────────────────────

type ColorMode = "auto" | "color" | "palette";

// ── Main playground app ───────────────────────────────────────────────────

function App() {
  const [base, setBase]         = useState("arctic-fox");
  const [variant, setVariant]   = useState("");
  const [size, setSize]         = useState(128);
  const [animate, setAnimate]   = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>("auto");
  const [colorInput, setColorInput] = useState("#818cf8");
  const [pickerColor, setPickerColor] = useState("#818cf8");
  const [stressAnimate, setStressAnimate] = useState(false);

  // Sync picker ↔ text input
  function handleTextColor(v: string) {
    setColorInput(v);
    // Only update picker if it looks like a hex
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setPickerColor(v);
  }
  function handlePickerColor(v: string) {
    setPickerColor(v);
    setColorInput(v);
  }

  const colorProp   = colorMode === "color"   ? colorInput  : undefined;
  const paletteProp = colorMode === "palette" ? PALETTE[0]  : undefined;

  const previewPalette = useMemo<Palette | null>(() => {
    if (colorMode === "color")   return paletteFromColor(colorInput);
    if (colorMode === "palette") return PALETTE[0];
    return null;
  }, [colorMode, colorInput]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>
          guild-glyph<span style={{ color: C.muted }}> / playground</span>
        </h1>
      </div>

      {/* Main controls + preview */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, marginBottom: 32 }}>

        {/* Controls */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 18 }}>

          <div>
            <Label>base</Label>
            <Input value={base} onChange={setBase} placeholder="arctic-fox" />
          </div>

          <div>
            <Label>variant <span style={{ color: C.border }}>optional</span></Label>
            <Input value={variant} onChange={setVariant} placeholder="main-catalog" />
          </div>

          <div>
            <Label>size — {size}px</Label>
            <input
              type="range" min={32} max={256} value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.accent }}
            />
          </div>

          <div>
            <Label>animate</Label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox" checked={animate}
                onChange={(e) => { setAnimate(e.target.checked); if (e.target.checked) injectStyles(); }}
                style={{ accentColor: C.accent, width: 14, height: 14 }}
              />
              <span style={{ color: C.text }}>enabled</span>
            </label>
          </div>

          <div>
            <Label>color mode</Label>
            <div style={{ display: "flex", gap: 6 }}>
              {(["auto", "color", "palette"] as ColorMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setColorMode(m)}
                  style={{
                    flex: 1,
                    padding: "5px 0",
                    borderRadius: 6,
                    border: `1px solid ${colorMode === m ? C.accent : C.border}`,
                    background: colorMode === m ? `${C.accent}22` : "transparent",
                    color: colorMode === m ? C.accent : C.muted,
                    fontFamily: "inherit",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {colorMode === "color" && (
            <div>
              <Label>color</Label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={pickerColor}
                  onChange={(e) => handlePickerColor(e.target.value)}
                  style={{ width: 36, height: 32, borderRadius: 6, border: `1px solid ${C.border}`, background: "none", cursor: "pointer", padding: 2 }}
                />
                <Input
                  value={colorInput}
                  onChange={handleTextColor}
                  placeholder="#818cf8 or oklch(0.7 0.18 265)"
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ marginTop: 6, color: C.muted, fontSize: 11 }}>
                any CSS color — hex, oklch(), hsl(), named…
              </div>
            </div>
          )}

        </div>

        {/* Preview */}
        <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, minHeight: 280 }}>
          <GuildGlyph
            base={base || "placeholder"}
            variant={variant || undefined}
            size={size}
            animate={animate}
            color={colorProp}
            palette={paletteProp}
          />
          {previewPalette && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {colorMode === "color" ? "derived palette" : "override palette"}
              </div>
              <PaletteSwatches palette={previewPalette} />
            </div>
          )}
        </div>
      </div>

      {/* Built-in palette browser */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 14, color: C.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          built-in palettes
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
          {PALETTE.map((p, i) => (
            <div key={i} style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 12 }}>
              <GuildGlyph base={`palette-${i}-demo`} size={56} />
              <PaletteSwatches palette={p} />
            </div>
          ))}
        </div>
      </section>

      {/* Color derivation sampler */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 14, color: C.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          color derivation sampler
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {[
            "#f43f5e", "#fb923c", "#facc15", "#4ade80", "#2dd4bf",
            "#60a5fa", "#818cf8", "#e879f9", "tomato", "steelblue",
            "oklch(0.72 0.20 265)", "oklch(0.65 0.18 145)",
          ].map((c) => {
            const p = paletteFromColor(c);
            return (
              <div key={c} style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 12, minWidth: 100 }}>
                <GuildGlyph base="sampler" color={c} size={56} />
                <div style={{ color: C.muted, fontSize: 10, textAlign: "center", wordBreak: "break-all" }}>{c}</div>
                {p && <PaletteSwatches palette={p} />}
              </div>
            );
          })}
        </div>
      </section>

      {/* Stress test grid */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            stress test — {STRESS_SLUGS.length} glyphs
          </h2>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: C.muted }}>
            <input
              type="checkbox"
              checked={stressAnimate}
              onChange={(e) => { setStressAnimate(e.target.checked); if (e.target.checked) injectStyles(); }}
              style={{ accentColor: C.accent }}
            />
            <span style={{ fontSize: 12 }}>animate all</span>
          </label>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {STRESS_SLUGS.map((slug, i) => {
            const sz = SIZES[i % SIZES.length];
            const showVariant = i % 3 === 2;
            return (
              <div key={slug} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <GuildGlyph
                  base={slug}
                  variant={showVariant ? "variant" : undefined}
                  size={sz}
                  animate={stressAnimate}
                />
                <span style={{ color: C.border, fontSize: 9, maxWidth: sz, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {slug}
                </span>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}

// ── Mount ─────────────────────────────────────────────────────────────────

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
