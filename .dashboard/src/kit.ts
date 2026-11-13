import opentype from "opentype.js";
import { c, STROKE } from "../theme";

const load = async (pkg: string, file: string) =>
  opentype.parse(await Bun.file(new URL(`../node_modules/@fontsource/${pkg}/files/${file}.woff`, import.meta.url)).arrayBuffer());

const fonts = {
  display: await load("archivo-black", "archivo-black-latin-400-normal"),
  body: await load("space-grotesk", "space-grotesk-latin-500-normal"),
  bold: await load("space-grotesk", "space-grotesk-latin-700-normal"),
  mono: await load("space-mono", "space-mono-latin-700-normal"),
};
export type FontName = keyof typeof fonts;

export interface Piece {
  w: number;
  h: number;
  svg: string;
  css?: string;
}

export interface TextStyle {
  size: number;
  font?: FontName;
  fill?: string;
  // Extra letter spacing in em.
  track?: number;
  anchor?: "start" | "middle" | "end";
  stroke?: string;
  sw?: number;
}

export const n = (v: number) => +v.toFixed(1);

const f2 = (v: number) => +v.toFixed(2);

// opentype.js's own toPathData emitted NaN for some fractional x offsets (seen with Space Mono "T" at x=26.352000000000004), so the offset and rounding are applied here.
function pathData(commands: opentype.PathCommand[], dx: number) {
  let d = "";
  for (const cmd of commands) {
    if (cmd.type === "Z") d += "Z";
    else if (cmd.type === "Q") d += `Q${f2(cmd.x1 + dx)} ${f2(cmd.y1)} ${f2(cmd.x + dx)} ${f2(cmd.y)}`;
    else if (cmd.type === "C") d += `C${f2(cmd.x1 + dx)} ${f2(cmd.y1)} ${f2(cmd.x2 + dx)} ${f2(cmd.y2)} ${f2(cmd.x + dx)} ${f2(cmd.y)}`;
    else d += `${cmd.type}${f2(cmd.x + dx)} ${f2(cmd.y)}`;
  }
  return d;
}

const outlines = new Map<string, { d: string; w: number }>();

// README images cannot load fonts, so every string becomes glyph outlines with the exact advance widths the layout was computed from.
function outline(s: string, { size, font = "bold", track = 0 }: TextStyle) {
  const key = `${font}|${size}|${track}|${s}`;
  const hit = outlines.get(key);
  if (hit) return hit;
  const face = fonts[font];
  const scale = size / face.unitsPerEm;
  const glyphs = [...s].map((ch) => {
    const glyph = face.charToGlyph(ch);
    if (glyph.index === 0) throw new Error(`font "${font}" has no glyph for "${ch}" in "${s}"`);
    return glyph;
  });
  let x = 0;
  let d = "";
  glyphs.forEach((glyph, i) => {
    d += pathData(glyph.getPath(0, 0, size).commands, x);
    x += (glyph.advanceWidth ?? 0) * scale;
    if (i < glyphs.length - 1) x += face.getKerningValue(glyph, glyphs[i + 1]) * scale + track * size;
  });
  const out = { d, w: x };
  outlines.set(key, out);
  return out;
}

export const measure = (s: string, style: TextStyle) => outline(s, style).w;

// y is the baseline.
export function text(s: string, x: number, y: number, style: TextStyle) {
  const { d, w } = outline(s, style);
  const dx = style.anchor === "middle" ? x - w / 2 : style.anchor === "end" ? x - w : x;
  const stroke = style.stroke
    ? ` stroke="${style.stroke}" stroke-width="${style.sw ?? 2}" stroke-linejoin="round" paint-order="stroke"`
    : "";
  return `<path transform="translate(${n(dx)} ${n(y)})" d="${d}" fill="${style.fill ?? c.ink}"${stroke}/>`;
}

// Fails the build instead of shipping text that spills out of its box.
export function fits(s: string, style: TextStyle, max: number) {
  const w = measure(s, style);
  if (w > max) throw new Error(`"${s}" is ${n(w)}px wide, box allows ${n(max)}px`);
}

// Live numbers grow without warning, so they shrink to their box where fixed copy would fail the build.
export function shrunk(s: string, style: TextStyle, max: number): TextStyle {
  const w = measure(s, style);
  return w <= max ? style : { ...style, size: Math.floor(((style.size * max) / w) * 10) / 10 };
}

// Stacked lines centred on (cx, cy).
export function lines(rows: readonly string[], cx: number, cy: number, lineH: number, style: TextStyle) {
  const top = cy - ((rows.length - 1) * lineH) / 2 + style.size * 0.36;
  return rows.map((row, i) => text(row, cx, top + i * lineH, { anchor: "middle", ...style })).join("");
}

interface RectStyle {
  fill?: string;
  r?: number;
  sw?: number;
  stroke?: string;
}

export function rect(x: number, y: number, w: number, h: number, { fill = c.paper, r = 0, sw = STROKE, stroke = c.ink }: RectStyle = {}) {
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

// A rect with the hard, unblurred offset shadow that defines the style.
export function box(x: number, y: number, w: number, h: number, { shadow = 6, shadowFill = c.ink, ...style }: RectStyle & { shadow?: number; shadowFill?: string } = {}) {
  return rect(x + shadow, y + shadow, w, h, { ...style, fill: shadowFill, stroke: shadowFill }) + rect(x, y, w, h, style);
}

export const at = (x: number, y: number, svg: string) => `<g transform="translate(${n(x)} ${n(y)})">${svg}</g>`;
export const rot = (deg: number, cx: number, cy: number, svg: string) => `<g transform="rotate(${deg} ${n(cx)} ${n(cy)})">${svg}</g>`;

// The fonts carry no arrow glyph, so the "opens elsewhere" arrow is drawn.
export function arrow(x: number, y: number, s: number, color: string = c.ink) {
  return `<path d="M${n(x)} ${n(y + s)}L${n(x + s)} ${n(y)}M${n(x + s * 0.25)} ${n(y)}H${n(x + s)}V${n(y + s * 0.75)}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
}

export function chip(label: string, { fill = c.yellow, color = c.ink, link = false }: { fill?: string; color?: string; link?: boolean } = {}): Piece {
  const style: TextStyle = { size: 12, font: "mono", track: 0.12, fill: color };
  const tw = measure(label.toUpperCase(), style);
  const w = tw + 20 + (link ? 18 : 0);
  const h = 34;
  const svg = box(0, 0, w, h, { fill, shadow: 4 }) + text(label.toUpperCase(), 10, 21.5, style) + (link ? arrow(tw + 17, 12, 9, color) : "");
  return { w, h, svg };
}

const REDUCED = "@media (prefers-reduced-motion:reduce){*{animation:none!important}}";

function doc(w: number, h: number, label: string, body: string, css = "") {
  const style = css ? `<style>${css}${REDUCED}</style>` : "";
  const safe = label.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${n(h)}" width="${n(w)}" height="${n(h)}" role="img" aria-label="${safe}"><title>${safe}</title>${style}${body}</svg>\n`;
}

// A cream sheet of grid paper holding a column of pieces. It has a border and no outer shadow so it reads the same on GitHub's light and dark backgrounds.
export function page(id: string, label: string, pieces: Piece[], { w, pad, gap = 26, r = 0, shadowMax }: { w: number; pad: number; gap?: number; r?: number; shadowMax: number }) {
  let y = pad;
  let body = "";
  for (const piece of pieces) {
    body += at(pad, y, piece.svg);
    y += piece.h + shadowMax + gap;
  }
  const h = y - gap + pad;
  const sheet = `<defs><pattern id="${id}-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="${c.ink}" stroke-opacity=".07"/></pattern></defs>${rect(1.5, 1.5, w - 3, h - 3, { r })}${rect(1.5, 1.5, w - 3, h - 3, { r, fill: `url(#${id}-grid)` })}`;
  return doc(w, h, label, sheet + body, pieces.map((p) => p.css ?? "").join(""));
}

// A piece on a transparent background, for images that sit loose in the README.
export function loose(label: string, piece: Piece, shadow: number) {
  return doc(piece.w + shadow + 3, piece.h + shadow + 3, label, at(1.5, 1.5, piece.svg), piece.css);
}
