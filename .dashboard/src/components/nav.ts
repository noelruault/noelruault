import { c, CONTENT_W } from "../../theme";
import { box, chip, at, rot, text, type Piece } from "../kit";

export interface NavParams {
  name: string;
  initials: string;
  role: string;
  since: string;
  site: string;
}

// Docs-style top bar: tilted logo block, name, a "since" chip and the website link chip.
export function render(p: NavParams): Piece {
  const w = CONTENT_W;
  const h = 72;
  const site = chip(p.site, { fill: c.pink, link: true });
  const since = chip(`Since ${p.since}`, { fill: c.mint });
  const siteX = w - 22 - site.w;
  const sinceX = siteX - 18 - since.w;
  const svg =
    box(0, 0, w, h, { shadow: 8 }) +
    rot(-4, 42, 36, box(18, 12, 48, 48, { fill: c.yellow, shadow: 4 }) + text(p.initials, 42, 41.5, { size: 15, font: "display", anchor: "middle" })) +
    text(p.name.toUpperCase(), 86, 33, { size: 17, font: "display" }) +
    text(p.role.toUpperCase(), 86, 52, { size: 11, font: "mono", track: 0.14 }) +
    at(sinceX, 19, since.svg) +
    at(siteX, 19, site.svg);
  return { w, h, svg };
}
