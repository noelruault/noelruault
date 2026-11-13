import { c, CONTENT_W } from "../../theme";
import { box, rect, rot, text, lines, measure, fits, shrunk, n, type Piece, type TextStyle } from "../kit";
import { burst, cursor, heart, mascot, sparkle } from "../icons";

export interface Pill {
  icon: (x: number, y: number, size: number) => string;
  value: string;
  label: string;
  fill: string;
}

export interface PosterParams {
  first: string;
  last: string;
  stamp: readonly string[];
  motto: readonly string[];
  tagline: string;
  cta: string;
  since: string;
  pills: readonly Pill[];
}

const PAD = 28;
const R = 16;

// Round stamp with a hard shadow, tilted like a sticker.
function stamp(cx: number, cy: number, r: number, rows: readonly string[]) {
  return rot(
    12,
    cx,
    cy,
    `<circle cx="${cx + 5}" cy="${cy + 5}" r="${r}" fill="${c.ink}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.mint}" stroke="${c.ink}" stroke-width="3"/>` +
      lines(rows.map((row) => row.toUpperCase()), cx, cy, 18, { size: 16, font: "display" }),
  );
}

// Bento poster: giant name, info card with a sticker cluster, a sticker panel, a banner, a fact panel and a row of stat pills.
export function render(p: PosterParams): Piece {
  const w = CONTENT_W;
  const inner = w - 2 * PAD;
  const right = PAD + inner;

  const giant: TextStyle = { size: 112, font: "display", track: -0.03 };
  const nameW = Math.max(measure(p.first.toUpperCase(), giant), measure(p.last.toUpperCase(), giant));
  fits(p.last.toUpperCase(), giant, inner - 240);
  const top =
    text(p.first.toUpperCase(), PAD - 5, PAD + 84, giant) +
    text(p.last.toUpperCase(), PAD - 5, PAD + 176, giant) +
    stamp(PAD + nameW + 96, PAD + 74, 62, p.stamp) +
    sparkle(right - 52, PAD + 150, 84, c.pink) +
    sparkle(right - 132, PAD + 176, 34, c.white);

  const y2 = PAD + 202;
  const infoH = 184;
  const body: TextStyle = { size: 15, font: "body" };
  const cta: TextStyle = { size: 12, font: "mono", track: 0.06 };
  const ctaW = measure(p.cta.toUpperCase(), cta) + 30;
  const ruleEnd = right - 318;
  fits(p.tagline, body, ruleEnd - PAD - 20);
  const hearts = [0, 1, 2, 3, 4].map((i) => heart(right - 296 + i * 29, y2 + 127, 23)).join("");
  const info =
    rect(PAD, y2, inner, infoH, { r: R }) +
    p.motto.map((row, i) => text(row.toUpperCase(), PAD + 20, y2 + 38 + i * 23, { size: 20, font: "display" })).join("") +
    `<path d="M${PAD + 20} ${y2 + 100}H${ruleEnd}" stroke="${c.ink}" stroke-width="3"/>` +
    text(p.tagline, PAD + 20, y2 + 126, body) +
    rect(PAD + 20, y2 + 140, ctaW, 30, { r: 15, fill: c.yellow }) +
    text(p.cta.toUpperCase(), PAD + 35, y2 + 159.5, cta) +
    cursor(right - 290, y2 + 22, 40) +
    sparkle(right - 200, y2 + 58, 70, c.pink) +
    box(right - 306, y2 + 118, 170, 40, { fill: c.white, r: 20, shadow: 4 }) +
    hearts +
    rot(-10, right - 72, y2 + 88, burst(right - 72, y2 + 88, 56, c.ink) + text("GO", right - 72, y2 + 97, { size: 24, font: "display", fill: c.white, anchor: "middle" })) +
    sparkle(right - 140, y2 + 30, 30, c.white);

  const y3 = y2 + infoH + 16;
  const h3 = 214;
  const bigW = 500;
  const tagStyle: TextStyle = { size: 18, font: "display" };
  const tagW = measure("NO MAGIC", tagStyle) + 32;
  const panel =
    rect(PAD, y3, bigW, h3, { r: R, fill: c.pink }) +
    rot(-10, PAD + 78, y3 + 76, burst(PAD + 78, y3 + 76, 58, c.blue) + lines(["LET'S", "BUILD"], PAD + 78, y3 + 76, 19, { size: 17, font: "display" })) +
    mascot(PAD + 168, y3 + 22, 172) +
    rot(
      -6,
      PAD + 408,
      y3 + 70,
      `<ellipse cx="${PAD + 408}" cy="${y3 + 70}" rx="76" ry="38" fill="${c.yellow}" stroke="${c.ink}" stroke-width="3"/><ellipse cx="${PAD + 408}" cy="${y3 + 70}" rx="68" ry="30" fill="${c.blue}" stroke="${c.ink}" stroke-width="3"/>` +
        text("SHIP IT!", PAD + 408, y3 + 78, { size: 22, font: "display", fill: c.white, anchor: "middle", stroke: c.ink, sw: 3 }),
    ) +
    rot(-4, PAD + 410, y3 + 160, box(PAD + 410 - tagW / 2, y3 + 140, tagW, 40, { fill: c.yellow, r: 14, shadow: 4 }) + text("NO MAGIC", PAD + 410, y3 + 166.5, { ...tagStyle, anchor: "middle" }));

  const sideX = PAD + bigW + 16;
  const sideW = inner - bigW - 16;
  const side =
    rect(sideX, y3, sideW, 88, { r: R, fill: c.teal }) +
    text("STAY", sideX + 18, y3 + 40, { size: 27, font: "display" }) +
    text("SIMPLE", sideX + 18, y3 + 68, { size: 27, font: "display" }) +
    sparkle(sideX + sideW - 44, y3 + 44, 50, c.yellow) +
    rect(sideX, y3 + 104, sideW, h3 - 104, { r: R, fill: c.orange }) +
    text("SINCE", sideX + 18, y3 + 138, { size: 20, font: "display" }) +
    text(p.since, sideX + 15, y3 + 196, { size: 62, font: "display", track: -0.02 });

  const y4 = y3 + h3 + 16;
  const gap = 12;
  const pw = (inner - (p.pills.length - 1) * gap) / p.pills.length;
  const label: TextStyle = { size: 11, font: "bold", track: 0.04 };
  const pills = p.pills
    .map((pill, i) => {
      const x = PAD + i * (pw + gap);
      fits(pill.label.toUpperCase(), label, pw - 62);
      return (
        rect(x, y4, pw, 66, { r: R, fill: pill.fill }) +
        pill.icon(x + 14, y4 + 18, 30) +
        text(pill.value, x + 54, y4 + 32, shrunk(pill.value, { size: 22, font: "display" }, pw - 62)) +
        text(pill.label.toUpperCase(), x + 54, y4 + 50, label)
      );
    })
    .join("");

  const h = n(y4 + 66 + PAD);
  return { w, h, svg: box(0, 0, w, h, { r: 22, shadow: 8 }) + top + info + panel + side + pills };
}
