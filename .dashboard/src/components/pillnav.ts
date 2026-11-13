import { c, CONTENT_W } from "../../theme";
import { box, rect, text, measure, arrow, fits, type Piece, type TextStyle } from "../kit";
import { globe } from "../icons";

// Poster-style top bar: outlined pill with a globe, the role, a word list, a link pill, and an orange menu disc.
export function render(role: string, items: readonly string[], link: string): Piece {
  const w = CONTENT_W;
  const h = 72;
  const style: TextStyle = { size: 12, font: "mono", track: 0.08 };
  const roleStyle: TextStyle = { size: 13, font: "display", track: 0.02 };
  const pillW = w - 24 - 60;
  const lw = measure(link.toUpperCase(), style) + 24 + 18;
  const lx = 12 + pillW - 10 - lw;
  let x = 64;
  let words = text(role.toUpperCase(), x, 40.5, roleStyle);
  x += measure(role.toUpperCase(), roleStyle) + 16;
  words += `<path d="M${x} 24V48" stroke="${c.ink}" stroke-width="3"/>`;
  x += 18;
  fits(items.map((item) => item.toUpperCase()).join("   "), style, lx - 16 - x);
  for (const item of items) {
    words += text(item.toUpperCase(), x, 40.5, style);
    x += measure(item.toUpperCase(), style) + 20;
  }
  const disc = w - 12 - 24;
  const svg =
    box(0, 0, w, h, { r: 22, shadow: 8 }) +
    rect(12, 12, pillW, 48, { r: 24, fill: "none" }) +
    globe(26, 24, 24) +
    words +
    rect(lx, 22, lw, 28, { r: 14, fill: "none" }) +
    text(link.toUpperCase(), lx + 12, 40.5, style) +
    arrow(lx + lw - 22, 31, 9) +
    `<circle cx="${disc + 3}" cy="39" r="24" fill="${c.ink}"/><circle cx="${disc}" cy="36" r="24" fill="${c.orange}" stroke="${c.ink}" stroke-width="3"/>` +
    `<path d="M${disc - 10} 28h20m-20 8h20m-20 8h20" stroke="${c.ink}" stroke-width="3"/>`;
  return { w, h, svg };
}
