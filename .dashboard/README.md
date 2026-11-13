# github-dashboard

Two neo-brutalist dashboards for a GitHub profile README, drawn as SVG cards from live GitHub numbers and swapped every day.

| Dashboard | Cards |
| --- | --- |
| `docs` | nav bar, docs hero with terminal, stat tiles, stars and followers bubbles, error dialog, marquee |
| `poster` | pill nav, bento poster (name, stamp, info card with stickers, sticker panel, banner, fact panel, stat pills), marquee |

Both end with the same two link buttons.

## Use

1. `bun install`
2. `bun build.ts --sample` writes `dist/cards/*.svg` and `dist/README.md` with stand-in numbers. Add `--date 2026-11-14` to see the other day's dashboard.
3. `GITHUB_TOKEN=... bun build.ts --out <repo>` fetches real numbers and writes into a profile repository.
4. `bun deploy.ts <repo>` copies this generator into `<repo>/.dashboard/`, where the repo's daily workflow runs it. This folder is the source; `.dashboard/` is a copy, so edit here and deploy. A deployed copy leaves out `deploy.ts` and `checks/`.

## Change things

- Words, links, name: `profile.ts`. Nothing else names a person. Its `counts` setting picks `"public"` repository and pull-request numbers (what any visitor could count) or `"all"` (adds private ones). Contributions are always the calendar total github.com prints on the profile.
- Which four numbers the tiles and pills show: `stats` in `profile.ts`, any four of `contributions`, `years`, `activeDays`, `currentStreak`, `longestStreak`, `bestDay`, `dailyAverage`, `repos`, `pullRequests`.
- Colours and page width: `theme.ts`.
- One card: its file in `src/components/`. Each exports `render(params)` and returns a piece (`w`, `h`, `svg`).
- Which cards a dashboard holds and in what order: `src/dashboards.ts`.

## Why it is built this way

- GitHub strips CSS and scripts from a README, so everything visual is an `<img>` pointing at an SVG.
- An SVG shown through `<img>` cannot load fonts. `src/kit.ts` turns every string into glyph outlines (Archivo Black, Space Grotesk, Space Mono, read from `@fontsource`), so the type is identical everywhere and the layout is computed from real text widths.
- A string wider than its box throws at build time (`fits`) instead of shipping a broken card.
- Pages have a border and no outer shadow, so one file reads the same on GitHub's light and dark backgrounds.
- The dashboard is picked from the UTC day number, so a rerun on the same day never flips it.

## Checks

- `bun test`: day flip, year arithmetic, every card well-formed and free of anything GitHub's image sandbox rejects (`<text>`, scripts, external references, `NaN`), README links.
- `bun checks/motion.ts` (after a build, needs Playwright from `../tools`): serves the cards with the Content-Security-Policy GitHub sends for raw files, loads them through `<img>` in headless Chromium and confirms the marquee and cursor move. Last run 2026-11-13: `broken images: 0; moving: 2/2`.

## Benchmark

Not measured. The build is one GraphQL request per 100 repositories plus string concatenation, run once a day; nothing here is on a hot path.
