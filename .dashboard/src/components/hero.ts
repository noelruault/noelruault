import { c, CONTENT_W } from "../../theme";
import { box, chip, at, rot, rect, text, fits, measure, type Piece, type TextStyle } from "../kit";

export interface HeroParams {
  role: string;
  shout: readonly string[];
  tagline: readonly string[];
  tag: string;
  // [prompt, text] rows; an empty prompt is program output.
  terminal: readonly (readonly [string, string])[];
}

// Docs hero: stacked shout on the left, a taped yellow frame holding a terminal on the right.
export function render(p: HeroParams): Piece {
  const w = CONTENT_W;
  const pad = 32;
  const frameW = 300;
  const frameX = w - pad - 8 - frameW;
  const shout: TextStyle = { size: 76, font: "display", track: -0.02 };
  const role = chip(p.role, { fill: c.violet });

  let y = pad;
  let copy = at(pad, y, role.svg);
  y += role.h + 22;
  p.shout.forEach((row, i) => {
    fits(row.toUpperCase(), shout, frameX - pad - 24);
    copy += text(row.toUpperCase(), pad - 3, y + 58 + i * 70, shout);
  });
  y += p.shout.length * 70 + 14;
  copy += box(pad, y, 96, 14, { fill: c.yellow, shadow: 4 });
  y += 14 + 26;
  p.tagline.forEach((row, i) => (copy += text(row, pad, y + 14 + i * 24, { size: 16, font: "bold" })));
  const h = y + p.tagline.length * 24 + pad - 4;

  const mono: TextStyle = { size: 13, font: "mono" };
  const rows = p.terminal.length + 1;
  const termH = rows * 22 + 26;
  const frameH = 26 + termH + 22;
  const frameY = (h - frameH) / 2;
  const tx = frameX + 22 + 16;
  const lineY = (i: number) => frameY + 26 + 30 + i * 22;
  const promptW = measure("$ ", mono);
  let term = rect(frameX + 22, frameY + 26, frameW - 44, termH, { fill: c.ink });
  p.terminal.forEach(([prompt, row], i) => {
    fits(prompt ? `$ ${row}` : row, mono, frameW - 44 - 32);
    if (prompt) term += text(prompt, tx, lineY(i), { ...mono, fill: c.yellow });
    term += text(row, prompt ? tx + promptW : tx, lineY(i), { ...mono, fill: c.paper });
  });
  term += text("$", tx, lineY(rows - 1), { ...mono, fill: c.yellow });
  term += `<rect class="blink" x="${tx + promptW}" y="${lineY(rows - 1) - 13}" width="9" height="16" fill="${c.mint}"/>`;

  const tag = chip(p.tag, { fill: c.pink, color: c.white });
  const frame =
    box(frameX, frameY, frameW, frameH, { fill: c.yellow, shadow: 8 }) +
    term +
    rot(-6, frameX + 63, frameY - 1, rect(frameX + 26, frameY - 13, 74, 24, { fill: c.white })) +
    at(frameX + frameW - 16 - tag.w, frameY - 17, tag.svg) +
    rot(-8, frameX + 3, frameY + frameH - 3, rect(frameX - 14, frameY + frameH - 20, 34, 34, { fill: c.pink }));

  return {
    w,
    h,
    svg: box(0, 0, w, h, { shadow: 8 }) + copy + frame,
    css: ".blink{animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}",
  };
}
