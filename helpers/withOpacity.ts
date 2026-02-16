/**
 * Convert any valid CSS color (hex/rgb(a)/hsl(a)/named) to rgba() with applied opacity.
 * - opacity is multiplied with existing alpha (if any).
 * - returns a safe rgba(...) string.
 */
export function withOpacity(color: string, opacity: number): string {
  const aMul = clamp01(opacity);

  // Fast paths
  if (!color || typeof color !== "string") return `rgba(0,0,0,${aMul})`;

  const c = color.trim().toLowerCase();

  if (c === "transparent") return `rgba(0,0,0,0)`;

  // 1) HEX: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  if (c.startsWith("#")) {
    const rgba = parseHexToRgba(c);
    if (rgba) return toRgbaString(rgba.r, rgba.g, rgba.b, rgba.a * aMul);
    // if invalid hex, fall back
  }

  // 2) rgb()/rgba()
  const rgbMatch = c.match(/^rgba?\(\s*([^\)]*)\s*\)$/);
  if (rgbMatch) {
    const rgba = parseRgbFunc(rgbMatch[1]);
    if (rgba) return toRgbaString(rgba.r, rgba.g, rgba.b, rgba.a * aMul);
  }

  // 3) hsl()/hsla()
  const hslMatch = c.match(/^hsla?\(\s*([^\)]*)\s*\)$/);
  if (hslMatch) {
    const rgba = parseHslFunc(hslMatch[1]);
    if (rgba) return toRgbaString(rgba.r, rgba.g, rgba.b, rgba.a * aMul);
  }

  // 4) Named colors (and other CSS supported syntaxes)
  // Use the browser's CSS parser if available (React Native won't have this).
  if (typeof document !== "undefined") {
    const rgba = parseViaCssParser(color);
    if (rgba) return toRgbaString(rgba.r, rgba.g, rgba.b, rgba.a * aMul);
  }

  // Fallback: don't crash, just return black with requested opacity
  return `rgba(0,0,0,${aMul})`;
}

/** ===================== Helpers ===================== */

type RGBA = { r: number; g: number; b: number; a: number };

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

function clampByte(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(255, Math.max(0, Math.round(n)));
}

function toRgbaString(r: number, g: number, b: number, a: number): string {
  const alpha = clamp01(a);
  return `rgba(${clampByte(r)},${clampByte(g)},${clampByte(b)},${alpha})`;
}

function parseHexToRgba(hex: string): RGBA | null {
  const h = hex.replace("#", "").trim();

  // #RGB or #RGBA
  if (h.length === 3 || h.length === 4) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    const a = h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1;
    if ([r, g, b].some((v) => Number.isNaN(v)) || Number.isNaN(a)) return null;
    return { r, g, b, a };
  }

  // #RRGGBB or #RRGGBBAA
  if (h.length === 6 || h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    if ([r, g, b].some((v) => Number.isNaN(v)) || Number.isNaN(a)) return null;
    return { r, g, b, a };
  }

  return null;
}

/**
 * Parses inside of rgb()/rgba() like:
 *  - "255, 0, 0"
 *  - "255 0 0 / 0.5"
 *  - "100% 0% 0% / 50%"
 */
function parseRgbFunc(inner: string): RGBA | null {
  const normalized = inner.replace(/\s*\/\s*/, " / ").trim();

  // Split alpha if " / " exists
  const [rgbPart, aPart] = normalized.split(" / ").map((s) => s.trim());

  const comps = splitRgbComponents(rgbPart);
  if (!comps || comps.length !== 3) return null;

  const r = parseRgbComponent(comps[0]);
  const g = parseRgbComponent(comps[1]);
  const b = parseRgbComponent(comps[2]);
  if (r == null || g == null || b == null) return null;

  const a = aPart ? parseAlphaComponent(aPart) : 1;

  return { r, g, b, a };
}

function splitRgbComponents(s: string): string[] | null {
  // Allow either comma-separated or space-separated
  const hasComma = s.includes(",");
  const parts = hasComma
    ? s.split(",").map((p) => p.trim())
    : s
        .split(/\s+/)
        .map((p) => p.trim())
        .filter(Boolean);

  return parts.length ? parts : null;
}

function parseRgbComponent(s: string): number | null {
  if (s.endsWith("%")) {
    const p = Number(s.slice(0, -1));
    if (!Number.isFinite(p)) return null;
    return (p / 100) * 255;
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseAlphaComponent(s: string): number {
  const t = s.trim();
  if (t.endsWith("%")) {
    const p = Number(t.slice(0, -1));
    return clamp01(Number.isFinite(p) ? p / 100 : 1);
  }
  const n = Number(t);
  return clamp01(Number.isFinite(n) ? n : 1);
}

/**
 * Parses inside of hsl()/hsla() like:
 *  - "120, 50%, 50%"
 *  - "120 50% 50% / 0.5"
 */
function parseHslFunc(inner: string): RGBA | null {
  const normalized = inner.replace(/\s*\/\s*/, " / ").trim();
  const [hslPart, aPart] = normalized.split(" / ").map((s) => s.trim());

  const comps = splitHslComponents(hslPart);
  if (!comps || comps.length !== 3) return null;

  const h = parseHue(comps[0]);
  const s = parsePercent(comps[1]);
  const l = parsePercent(comps[2]);
  if (h == null || s == null || l == null) return null;

  const { r, g, b } = hslToRgb(h, s, l);
  const a = aPart ? parseAlphaComponent(aPart) : 1;

  return { r, g, b, a };
}

function splitHslComponents(s: string): string[] | null {
  const hasComma = s.includes(",");
  const parts = hasComma
    ? s.split(",").map((p) => p.trim())
    : s
        .split(/\s+/)
        .map((p) => p.trim())
        .filter(Boolean);

  return parts.length ? parts : null;
}

function parseHue(s: string): number | null {
  // Support deg/turn/rad/grad loosely; default deg if plain number
  const t = s.trim().toLowerCase();
  const num = parseFloat(t);
  if (!Number.isFinite(num)) return null;

  if (t.endsWith("turn")) return (num * 360) % 360;
  if (t.endsWith("rad")) return ((num * 180) / Math.PI) % 360;
  if (t.endsWith("grad")) return (num * 0.9) % 360;
  // deg or plain number
  return num % 360;
}

function parsePercent(s: string): number | null {
  const t = s.trim();
  if (!t.endsWith("%")) return null;
  const n = Number(t.slice(0, -1));
  if (!Number.isFinite(n)) return null;
  return clamp01(n / 100);
}

function hslToRgb(
  hDeg: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const h = (((hDeg % 360) + 360) % 360) / 360;

  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hueToRgb(p, q, h + 1 / 3) * 255;
  const g = hueToRgb(p, q, h) * 255;
  const b = hueToRgb(p, q, h - 1 / 3) * 255;

  return { r, g, b };
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

/**
 * Browser-only: lets CSS parse named colors reliably.
 * Not available in React Native (no document).
 */
function parseViaCssParser(color: string): RGBA | null {
  try {
    const el = document.createElement("div");
    el.style.color = color;
    document.body.appendChild(el);

    const computed = getComputedStyle(el).color; // usually "rgb(r, g, b)" or "rgba(r, g, b, a)"
    el.remove();

    const m = computed.toLowerCase().match(/^rgba?\(\s*([^\)]*)\s*\)$/);
    if (!m) return null;

    const rgba = parseRgbFunc(m[1]);
    return rgba;
  } catch {
    return null;
  }
}
