import { c } from "../../theme";
import { box, rect, text, measure, fits, type Piece, type TextStyle } from "../kit";
import { noEntry } from "../icons";

export interface DialogParams {
  title: string;
  message: string;
  button: string;
  w: number;
}

const BAR = 34;

// Retro window title bar with the three control cells drawn as shapes.
function bar(w: number, title: string, fill: string) {
  const cell = (i: number) => w - (3 - i) * BAR;
  const mark = `stroke="${c.ink}" stroke-width="2.5" fill="none"`;
  return (
    rect(0, 0, w, BAR, { fill }) +
    text(title.toUpperCase(), 12, 22, { size: 12, font: "mono", track: 0.08 }) +
    [0, 1, 2].map((i) => `<path d="M${cell(i)} 0V${BAR}" ${mark}/>`).join("") +
    `<rect x="${cell(0) + 12}" y="12" width="10" height="10" ${mark}/>` +
    `<path d="M${cell(1) + 11} 23h12" ${mark}/>` +
    `<path d="M${cell(2) + 12} 12l10 10m0-10l-10 10" ${mark}/>`
  );
}

// Error dialog window used as a joke card.
export function render(p: DialogParams): Piece {
  const h = 206;
  const cx = p.w / 2;
  const message: TextStyle = { size: 16, font: "bold" };
  const button: TextStyle = { size: 12, font: "mono", track: 0.1 };
  fits(p.message, message, p.w - 32);
  const bw = measure(p.button.toUpperCase(), button) + 44;
  const svg =
    box(0, 0, p.w, h, { fill: c.white, shadow: 8 }) +
    bar(p.w, p.title, c.teal) +
    noEntry(cx - 28, BAR + 18, 56) +
    text(p.message, cx, BAR + 100, { ...message, anchor: "middle" }) +
    box(cx - bw / 2, BAR + 118, bw, 30, { fill: c.teal, shadow: 3 }) +
    text(p.button.toUpperCase(), cx, BAR + 137.5, { ...button, anchor: "middle" });
  return { w: p.w, h, svg };
}
