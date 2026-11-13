import { c, CONTENT_W, PAD, PAGE_W, SHADOW_MAX } from "../theme";
import { profile } from "../profile";
import { at, loose, page, type Piece } from "./kit";
import { check, eye, globe, heart, sparkle } from "./icons";
import * as bubbles from "./components/bubbles";
import * as button from "./components/button";
import * as dialog from "./components/dialog";
import * as hero from "./components/hero";
import * as marquee from "./components/marquee";
import * as nav from "./components/nav";
import * as pillnav from "./components/pillnav";
import * as poster from "./components/poster";
import * as tiles from "./components/tiles";

export interface Stats {
  contributions: number;
  years: number;
  repos: number;
  pullRequests: number;
  stars: number;
  followers: number;
}

export interface Card {
  file: string;
  svg: string;
  alt: string;
  href?: string;
  // Loose images are sized by height in the README; full-width cards are not.
  height?: number;
}

export interface Dashboard {
  id: "docs" | "poster";
  rows: Card[][];
}

const fmt = (v: number) => v.toLocaleString("en-US");
const sheet = { w: PAGE_W, pad: PAD, shadowMax: SHADOW_MAX };

const summary = (s: Stats) =>
  `${fmt(s.contributions)} contributions in the last year, ${s.years} years on GitHub, ${fmt(s.repos)} repositories, ${fmt(s.pullRequests)} pull requests, ${fmt(s.stars)} stars, ${fmt(s.followers)} followers.`;

function buttons(): Card[] {
  // Small enough that both buttons share one row on a 390px phone.
  const height = 46;
  return [
    { file: "button-cv.svg", svg: loose(profile.cv.label, button.render(profile.cv.label, c.yellow), button.SHADOW), alt: profile.cv.label, href: profile.cv.url, height },
    { file: "button-repos.svg", svg: loose(profile.repos.label, button.render(profile.repos.label, c.white), button.SHADOW), alt: profile.repos.label, href: profile.repos.url, height },
  ];
}

function sideBySide(left: Piece, right: Piece, x: number): Piece {
  const h = Math.max(left.h, right.h);
  return { w: CONTENT_W, h, svg: at(0, (h - left.h) / 2, left.svg) + at(x, (h - right.h) / 2, right.svg) };
}

export function docs(s: Stats): Dashboard {
  const navAlt = `${profile.name}, ${profile.role.toLowerCase()}. Since ${profile.since}. ${profile.site.label}`;
  const stat = bubbles.render([
    { icon: heart, value: fmt(s.stars), label: "Stars" },
    { icon: eye, value: fmt(s.followers), label: "Followers" },
  ]);
  const gap = 26;
  const main = [
    hero.render({ role: profile.role, shout: profile.shout, tagline: profile.tagline, tag: profile.languages[0], terminal: profile.terminal }),
    tiles.render([
      { value: fmt(s.contributions), label: ["Contributions,", "last year"], fill: c.yellow },
      { value: String(s.years), label: ["Years on", "GitHub"], fill: c.mint },
      { value: fmt(s.repos), label: ["Repositories"], fill: c.pink },
      { value: fmt(s.pullRequests), label: ["Pull requests"], fill: c.violet },
    ]),
    sideBySide(stat, dialog.render({ title: "Error", message: profile.error, button: "OK", w: CONTENT_W - stat.w - gap }), stat.w + gap),
    marquee.render(profile.marquee, "docs"),
  ];
  return {
    id: "docs",
    rows: [
      [{ file: "docs-nav.svg", svg: page("docs-nav", navAlt, [nav.render({ name: profile.name, initials: profile.initials, role: profile.role, since: profile.since, site: profile.site.label })], sheet), alt: navAlt, href: profile.site.url }],
      [{ file: "docs-main.svg", svg: page("docs-main", `${profile.shout.join(" ")} ${profile.tagline.join(" ")} ${summary(s)}`, main, { ...sheet, gap }), alt: `${profile.shout.join(" ")} ${profile.tagline.join(" ")} ${summary(s)}` }],
      buttons(),
    ],
  };
}

export function posterBoard(s: Stats): Dashboard {
  const navAlt = `${profile.languages.join(", ")}. Contact: ${profile.site.label}`;
  const mainAlt = `${profile.name}. ${profile.motto.join(" ")} ${profile.tagline.join(" ")} ${summary(s)}`;
  const main = [
    poster.render({
      first: profile.first,
      last: profile.last,
      stamp: profile.stamp,
      motto: profile.motto,
      tagline: profile.tagline.join(" "),
      cta: profile.cta,
      since: profile.since,
      pills: [
        { icon: globe, value: String(s.years), label: "Years on GitHub", fill: c.orange },
        { icon: (x, y, size) => sparkle(x + size / 2, y + size / 2, size, c.yellow), value: fmt(s.contributions), label: "Contributions", fill: c.blue },
        { icon: globe, value: fmt(s.repos), label: "Repositories", fill: c.pink },
        { icon: check, value: fmt(s.pullRequests), label: "Pull requests", fill: c.yellow },
      ],
    }),
    marquee.render(profile.marquee, "poster"),
  ];
  return {
    id: "poster",
    rows: [
      [{ file: "poster-nav.svg", svg: page("poster-nav", navAlt, [pillnav.render(profile.languages, "Contact")], { ...sheet, r: 22 }), alt: navAlt, href: profile.site.url }],
      [{ file: "poster-main.svg", svg: page("poster-main", mainAlt, main, { ...sheet, r: 22 }), alt: mainAlt }],
      buttons(),
    ],
  };
}

const DAY_MS = 86_400_000;

// The two dashboards alternate by UTC day, so a rerun on the same day never flips the profile.
export const today = (s: Stats, now: Date): Dashboard => (Math.floor(now.getTime() / DAY_MS) % 2 === 0 ? docs(s) : posterBoard(s));

const attr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function readme(board: Dashboard, dir = "cards") {
  const img = (card: Card) => {
    const size = card.height ? `height="${card.height}"` : 'width="100%"';
    const tag = `<img src="${dir}/${card.file}" ${size} alt="${attr(card.alt)}">`;
    return card.href ? `<a href="${attr(card.href)}">${tag}</a>` : tag;
  };
  const rows = board.rows.map((row) => `<p>${row.map(img).join("&nbsp;&nbsp;")}</p>`);
  return `<!-- Generated once a day by .dashboard/build.ts (${board.id} dashboard today). Edit the generator, not this file. -->\n\n${rows.join("\n\n")}\n`;
}
