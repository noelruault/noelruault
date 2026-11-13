// Writes both dashboards' SVG cards plus a README showing today's one.
// bun build.ts --out <repo dir> [--sample] [--date YYYY-MM-DD]
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { profile } from "./profile";
import { docs, posterBoard, readme, today, type Stats } from "./src/dashboards";
import { fetchStats } from "./src/github";

// Stand-in numbers for working on the design without a token.
export const SAMPLE: Stats = { contributions: 7880, years: 13, repos: 133, pullRequests: 264, stars: 17, followers: 29 };

if (import.meta.main) {
  const { values } = parseArgs({ options: { out: { type: "string", default: "dist" }, sample: { type: "boolean", default: false }, date: { type: "string" } } });
  const now = values.date ? new Date(`${values.date}T12:00:00Z`) : new Date();
  // Date parsing rolls 2026-02-30 over to March, so the value must survive a round trip.
  if (values.date && (Number.isNaN(now.getTime()) || now.toISOString().slice(0, 10) !== values.date)) throw new Error(`--date "${values.date}" is not a real YYYY-MM-DD date`);

  let stats = SAMPLE;
  if (!values.sample) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN is not set; pass --sample to build with stand-in numbers");
    stats = await fetchStats(process.env.GITHUB_LOGIN || profile.login, token, now, profile.counts);
  }

  const cards = join(values.out, "cards");
  mkdirSync(cards, { recursive: true });
  const seen = new Set<string>();
  for (const board of [docs(stats), posterBoard(stats)]) {
    for (const card of board.rows.flat()) {
      if (seen.has(card.file)) continue;
      seen.add(card.file);
      if (/NaN|undefined/.test(card.svg)) throw new Error(`${card.file} holds a broken value; nothing more is written`);
      writeFileSync(join(cards, card.file), card.svg);
    }
  }
  // A renamed card would otherwise leave its old file committed forever.
  for (const file of readdirSync(cards)) if (file.endsWith(".svg") && !seen.has(file)) rmSync(join(cards, file));
  const board = today(stats, now);
  writeFileSync(join(values.out, "README.md"), readme(board));
  console.log(`${seen.size} cards, README shows "${board.id}", stats ${JSON.stringify(stats)}`);
}
