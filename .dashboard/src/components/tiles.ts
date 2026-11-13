import { CONTENT_W } from "../../theme";
import { box, text, fits, shrunk, type Piece, type TextStyle } from "../kit";

export interface Tile {
  value: string;
  label: readonly string[];
  fill: string;
}

// One fat number per tile.
export function render(tiles: readonly Tile[]): Piece {
  const gap = 18;
  const tw = (CONTENT_W - (tiles.length - 1) * gap) / tiles.length;
  const h = 124;
  const value: TextStyle = { size: 46, font: "display" };
  const label: TextStyle = { size: 11, font: "mono", track: 0.1 };
  const svg = tiles
    .map((tile, i) => {
      const x = i * (tw + gap);
      tile.label.forEach((row) => fits(row.toUpperCase(), label, tw - 32));
      return (
        box(x, 0, tw, h, { fill: tile.fill }) +
        text(tile.value, x + 15, 60, shrunk(tile.value, value, tw - 32)) +
        tile.label.map((row, j) => text(row.toUpperCase(), x + 16, 86 + j * 16, label)).join("")
      );
    })
    .join("");
  return { w: CONTENT_W, h, svg };
}
