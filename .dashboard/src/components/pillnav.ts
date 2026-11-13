import { c, CONTENT_W } from "../../theme";
import { box, rect, text, measure, arrow, type Piece, type TextStyle } from "../kit";
import { globe } from "../icons";

// Poster-style top bar: outlined pill with a globe, a word list, a contact pill, and an orange menu disc.
export function render(items: readonly string[], contact: string): Piece {
  const w = CONTENT_W;
  const h = 72;
  const style: TextStyle = { size: 12, font: "mono", track: 0.08 };
  const pillW = w - 24 - 60;
  let x = 64;
  let words = "";
  for (const item of items) {
    words += text(item.toUpperCase(), x, 40.5, style);
    x += measure(item.toUpperCase(), style) + 24;
  }
  const cw = measure(contact.toUpperCase(), style) + 24 + 18;
  const cx = 12 + pillW - 10 - cw;
  const disc = w - 12 - 24;
  const svg =
    box(0, 0, w, h, { r: 22, shadow: 8 }) +
    rect(12, 12, pillW, 48, { r: 24, fill: "none" }) +
    globe(26, 24, 24) +
    words +
    rect(cx, 22, cw, 28, { r: 14, fill: "none" }) +
    text(contact.toUpperCase(), cx + 12, 40.5, style) +
    arrow(cx + cw - 22, 31, 9) +
    `<circle cx="${disc + 3}" cy="39" r="24" fill="${c.ink}"/><circle cx="${disc}" cy="36" r="24" fill="${c.orange}" stroke="${c.ink}" stroke-width="3"/>` +
    `<path d="M${disc - 10} 28h20m-20 8h20m-20 8h20" stroke="${c.ink}" stroke-width="3"/>`;
  return { w, h, svg };
}
