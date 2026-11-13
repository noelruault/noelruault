import { c, CONTENT_W } from "../../theme";
import { box, chip, at, rot, text, measure, fits, type Piece, type TextStyle } from "../kit";

export interface NavParams {
  name: string;
  initials: string;
  role: string;
  languages: readonly string[];
  since: string;
  site: string;
}

// Docs-style top bar: tilted logo block, name, the language list, a "since" chip and the website link chip.
export function render(p: NavParams): Piece {
  const w = CONTENT_W;
  const h = 72;
  const nameStyle: TextStyle = { size: 17, font: "display" };
  const roleStyle: TextStyle = { size: 11, font: "mono", track: 0.14 };
  const langStyle: TextStyle = { size: 11, font: "mono", track: 0.08 };
  const site = chip(p.site, { fill: c.pink, link: true });
  const since = chip(`Since ${p.since}`, { fill: c.mint });
  const siteX = w - 22 - site.w;
  const sinceX = siteX - 18 - since.w;
  const languages = p.languages.map((l) => l.toUpperCase()).join("  ");
  const langX = 86 + Math.max(measure(p.name.toUpperCase(), nameStyle), measure(p.role.toUpperCase(), roleStyle)) + 26;
  fits(languages, langStyle, sinceX - 16 - langX);
  const svg =
    box(0, 0, w, h, { shadow: 8 }) +
    rot(-4, 42, 36, box(18, 12, 48, 48, { fill: c.yellow, shadow: 4 }) + text(p.initials, 42, 41.5, { size: 15, font: "display", anchor: "middle" })) +
    text(p.name.toUpperCase(), 86, 33, nameStyle) +
    text(p.role.toUpperCase(), 86, 52, roleStyle) +
    text(languages, langX, 40.5, langStyle) +
    at(sinceX, 19, since.svg) +
    at(siteX, 19, site.svg);
  return { w, h, svg };
}
