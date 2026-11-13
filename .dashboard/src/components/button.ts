import { c } from "../../theme";
import { box, text, measure, arrow, type Piece, type TextStyle } from "../kit";

export const SHADOW = 6;

// Link button. In a README it is an image wrapped in an anchor, so it has no hover state.
export function render(label: string, fill: string = c.yellow): Piece {
  const style: TextStyle = { size: 16, font: "bold" };
  const tw = measure(label, style);
  const w = tw + 40 + 20;
  const h = 48;
  return { w, h, svg: box(0, 0, w, h, { fill, shadow: SHADOW }) + text(label, 20, 29.5, style) + arrow(tw + 28, 18, 11) };
}
