import { c, CONTENT_W } from "../../theme";
import { box, text, measure, n, type Piece, type TextStyle } from "../kit";
import { star } from "../icons";

const SPEED = 40; // px per second

// Scrolling ink strip. `id` must be unique per SVG file: the clip path, the class and the keyframes are all named from it.
export function render(items: readonly string[], id: string): Piece {
  const w = CONTENT_W;
  const h = 46;
  const style: TextStyle = { size: 18, font: "display", track: 0.06, fill: c.yellow };
  let x = 20;
  let run = "";
  for (const item of items) {
    run += text(item.toUpperCase(), x, 29.5, style);
    x += measure(item.toUpperCase(), style) + 20;
    run += star(x + 8, 23, 9, c.yellow);
    x += 16 + 20;
  }
  const runW = x - 20;
  // Enough copies that the strip stays full while one run scrolls out.
  const copies = Math.ceil(w / runW) + 1;
  const track = Array.from({ length: copies }, (_, i) => `<g transform="translate(${n(i * runW)} 0)">${run}</g>`).join("");
  const svg =
    box(0, 0, w, h, { fill: c.ink, shadowFill: c.pink }) +
    `<clipPath id="${id}-clip"><rect x="2" y="2" width="${w - 4}" height="${h - 4}"/></clipPath>` +
    `<g clip-path="url(#${id}-clip)"><g class="${id}-mq">${track}</g></g>`;
  return {
    w,
    h,
    svg,
    css: `.${id}-mq{animation:${id}-mq ${n(runW / SPEED)}s linear infinite}@keyframes ${id}-mq{to{transform:translateX(-${n(runW)}px)}}`,
  };
}
