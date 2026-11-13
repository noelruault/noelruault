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

// What a visitor is told, whichever dashboard is up.
// Both dashboards are skins over this one struct: a field added here has to be drawn by both, and build.test.ts fails when either drops one.
export interface Content {
  name: string;
  first: string;
  last: string;
  initials: string;
  role: string;
  since: string;
  site: string;
  languages: readonly string[];
  headline: readonly string[];
  motto: readonly string[];
  tagline: readonly string[];
  terminal: readonly (readonly [string, string])[];
  stats: readonly { key: StatKey; value: string }[];
  stars: string;
  followers: string;
  joke: readonly string[];
  marquee: readonly string[];
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

// The tile row and the pill row are both laid out for four.
const SLOTS = 4;

export function content(s: Stats, keys: readonly StatKey[] = profile.stats): Content {
  if (keys.length !== SLOTS) throw new Error(`a dashboard shows exactly ${SLOTS} stats, got ${keys.length}: ${keys.join(", ")}`);
  return {
    name: profile.name,
    first: profile.first,
    last: profile.last,
    initials: profile.initials,
    role: profile.role,
    since: profile.since,
    site: profile.site.label,
    languages: profile.languages,
    headline: profile.shout,
    motto: profile.motto,
    tagline: profile.tagline,
    terminal: profile.terminal,
    stats: keys.map((key) => ({ key, value: fmt(s[key]) })),
    stars: fmt(s.stars),
    followers: fmt(s.followers),
    joke: profile.error,
    marquee: profile.marquee,
  };
}

// One description for both dashboards, since they say the same things.
const describe = (k: Content) =>
  `${k.name}, ${k.role.toLowerCase()}, since ${k.since}. ${k.headline.join(" ")} ${k.motto.join(" ")} ${k.tagline.join(" ")} ` +
  `${k.stats.map((stat) => `${stat.value} ${STAT[stat.key].phrase}`).join(", ")}, ${k.stars} stars, ${k.followers} followers. ` +
  `${k.languages.join(", ")}. ${k.joke.join(" ")}.`;

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

const navAlt = (k: Content) => `${k.name}, ${k.role.toLowerCase()}. ${k.languages.join(", ")}. Since ${k.since}. ${k.site}`;

function renderDocs(k: Content): Dashboard {
  const social = bubbles.render([
    { icon: heart, value: k.stars, label: "Stars" },
    { icon: eye, value: k.followers, label: "Followers" },
  ]);
  const gap = 26;
  const main = [
    hero.render({ role: k.role, shout: k.headline, motto: k.motto, tagline: k.tagline, tag: k.languages[0], terminal: k.terminal }),
    tiles.render(k.stats.map((stat, i) => ({ value: stat.value, label: STAT[stat.key].tile, fill: TILE_FILLS[i] }))),
    sideBySide(social, dialog.render({ title: "Error", message: k.joke.join(" "), button: "OK", w: CONTENT_W - social.w - gap }), social.w + gap),
    marquee.render(k.marquee, "docs"),
  ];
  const top = nav.render({ name: k.name, initials: k.initials, role: k.role, languages: k.languages, since: k.since, site: k.site });
  return {
    id: "docs",
    rows: [
      [{ file: "docs-nav.svg", svg: page("docs-nav", navAlt(k), [top], sheet), alt: navAlt(k), href: profile.site.url }],
      [{ file: "docs-main.svg", svg: page("docs-main", describe(k), main, { ...sheet, gap }), alt: describe(k) }],
      buttons(),
    ],
  };
}

function renderPoster(k: Content): Dashboard {
  const main = [
    poster.render({
      first: k.first,
      last: k.last,
      stamp: profile.stamp,
      headline: [k.headline.slice(0, 2).join(" "), k.headline.slice(2).join(" ")],
      motto: k.motto,
      tagline: k.tagline.join(" "),
      cta: profile.cta,
      since: k.since,
      stars: k.stars,
      followers: k.followers,
      tag: k.languages[0],
      joke: k.joke,
      pills: k.stats.map((stat, i) => ({ icon: PILL_ICONS[i], value: stat.value, label: STAT[stat.key].pill, fill: PILL_FILLS[i] })),
    }),
    marquee.render(k.marquee, "poster"),
  ];
  return {
    id: "poster",
    rows: [
      [{ file: "poster-nav.svg", svg: page("poster-nav", navAlt(k), [pillnav.render(k.role, k.languages, k.site)], { ...sheet, r: 22 }), alt: navAlt(k), href: profile.site.url }],
      [{ file: "poster-main.svg", svg: page("poster-main", describe(k), main, { ...sheet, r: 22 }), alt: describe(k) }],
      buttons(),
    ],
  };
}

export const docs = (s: Stats, keys?: readonly StatKey[]) => renderDocs(content(s, keys));
export const posterBoard = (s: Stats, keys?: readonly StatKey[]) => renderPoster(content(s, keys));

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
