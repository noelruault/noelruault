import { c } from "../../theme";
import { box, text, shrunk, type Piece } from "../kit";

export interface Bubble {
  icon: (x: number, y: number, size: number) => string;
  value: string;
  label: string;
}

const BW = 170;
const BH = 132;
const TAIL = 12;

// Yellow speech-bubble tiles: one icon, one number each.
export function render(bubbles: readonly Bubble[], gap = 18): Piece {
  const svg = bubbles
    .map((b, i) => {
      const x = i * (BW + gap);
      const cx = x + BW / 2;
      return (
        box(x, 0, BW, BH, { fill: c.yellow, r: 12, shadow: 5 }) +
        `<path d="M${x + 24} ${BH}l10 ${TAIL}l10 ${-TAIL}" fill="${c.yellow}" stroke="${c.ink}" stroke-width="3" stroke-linejoin="round"/>` +
        // Paints over the bubble's border where the tail joins it.
        `<rect x="${x + 26.5}" y="${BH - 3}" width="15" height="4" fill="${c.yellow}"/>` +
        b.icon(cx - 20, 16, 40) +
        text(b.value, cx, 88, shrunk(b.value, { size: 26, font: "display", anchor: "middle" }, BW - 28)) +
        text(b.label.toUpperCase(), cx, 110, { size: 11, font: "mono", track: 0.1, anchor: "middle" })
      );
    })
    .join("");
  return { w: bubbles.length * BW + (bubbles.length - 1) * gap, h: BH + TAIL, svg };
}
