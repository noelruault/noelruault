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
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  bestDay: number;
  dailyAverage: number;
}

export type StatKey = Exclude<keyof Stats, "stars" | "followers">;

interface StatView {
  // Two short lines under a tile's number.
  tile: readonly string[];
  // One line beside a pill's number.
  pill: string;
  // How the number reads in alt text, after the value.
  phrase: string;
}

// Every stat a tile or pill can show; `profile.stats` picks four of them, in order.
export const STAT: Record<StatKey, StatView> = {
  contributions: { tile: ["Contributions,", "last year"], pill: "Contributions", phrase: "contributions in the last year" },
  years: { tile: ["Years on", "GitHub"], pill: "Years on GitHub", phrase: "years on GitHub" },
  activeDays: { tile: ["Active days,", "last year"], pill: "Active days", phrase: "active days in the last year" },
  currentStreak: { tile: ["Days in a row,", "right now"], pill: "Day streak now", phrase: "days in a row right now" },
  longestStreak: { tile: ["Longest streak,", "in days"], pill: "Longest streak", phrase: "days in the longest streak" },
  bestDay: { tile: ["Contributions,", "best day"], pill: "On the best day", phrase: "contributions on the best day" },
  dailyAverage: { tile: ["Contributions", "a day"], pill: "A day, average", phrase: "contributions a day on average" },
  repos: { tile: ["Repositories"], pill: "Repositories", phrase: "repositories" },
  pullRequests: { tile: ["Pull requests"], pill: "Pull requests", phrase: "pull requests" },
};

// The tile row and the pill row are both laid out for four.
const SLOTS = 4;
function four(keys: readonly StatKey[]) {
  if (keys.length !== SLOTS) throw new Error(`a dashboard shows exactly ${SLOTS} stats, got ${keys.length}: ${keys.join(", ")}`);
  return keys;
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

const summary = (s: Stats, keys: readonly StatKey[]) =>
  `${keys.map((key) => `${fmt(s[key])} ${STAT[key].phrase}`).join(", ")}, ${fmt(s.stars)} stars, ${fmt(s.followers)} followers.`;

const TILE_FILLS = [c.yellow, c.mint, c.pink, c.violet];
const PILL_FILLS = [c.orange, c.blue, c.pink, c.yellow];
const PILL_ICONS = [globe, (x: number, y: number, size: number) => sparkle(x + size / 2, y + size / 2, size, c.yellow), globe, check];

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

export function docs(s: Stats, keys: readonly StatKey[] = profile.stats): Dashboard {
  four(keys);
  const navAlt = `${profile.name}, ${profile.role.toLowerCase()}. Since ${profile.since}. ${profile.site.label}`;
  const stat = bubbles.render([
    { icon: heart, value: fmt(s.stars), label: "Stars" },
    { icon: eye, value: fmt(s.followers), label: "Followers" },
  ]);
  const gap = 26;
  const main = [
    hero.render({ role: profile.role, shout: profile.shout, tagline: profile.tagline, tag: profile.languages[0], terminal: profile.terminal }),
    tiles.render(keys.map((key, i) => ({ value: fmt(s[key]), label: STAT[key].tile, fill: TILE_FILLS[i] }))),
    sideBySide(stat, dialog.render({ title: "Error", message: profile.error, button: "OK", w: CONTENT_W - stat.w - gap }), stat.w + gap),
    marquee.render(profile.marquee, "docs"),
  ];
  return {
    id: "docs",
    rows: [
      [{ file: "docs-nav.svg", svg: page("docs-nav", navAlt, [nav.render({ name: profile.name, initials: profile.initials, role: profile.role, since: profile.since, site: profile.site.label })], sheet), alt: navAlt, href: profile.site.url }],
      [{ file: "docs-main.svg", svg: page("docs-main", `${profile.shout.join(" ")} ${profile.tagline.join(" ")} ${summary(s, keys)}`, main, { ...sheet, gap }), alt: `${profile.shout.join(" ")} ${profile.tagline.join(" ")} ${summary(s, keys)}` }],
      buttons(),
    ],
  };
}

export function posterBoard(s: Stats, keys: readonly StatKey[] = profile.stats): Dashboard {
  four(keys);
  const navAlt = `${profile.languages.join(", ")}. Contact: ${profile.site.label}`;
  const mainAlt = `${profile.name}. ${profile.motto.join(" ")} ${profile.tagline.join(" ")} ${summary(s, keys)}`;
  const main = [
    poster.render({
      first: profile.first,
      last: profile.last,
      stamp: profile.stamp,
      motto: profile.motto,
      tagline: profile.tagline.join(" "),
      cta: profile.cta,
      since: profile.since,
      pills: keys.map((key, i) => ({ icon: PILL_ICONS[i], value: fmt(s[key]), label: STAT[key].pill, fill: PILL_FILLS[i] })),
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
