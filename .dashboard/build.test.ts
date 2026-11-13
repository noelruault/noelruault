import { expect, test } from "bun:test";
import { SAMPLE } from "./build";
import { docs, posterBoard, readme, today, type Stats } from "./src/dashboards";
import { fetchStats, fullYears, type Request } from "./src/github";
import { fits } from "./src/kit";

const day = (iso: string) => new Date(`${iso}T12:00:00Z`);
const cards = [...docs(SAMPLE).rows.flat(), ...posterBoard(SAMPLE).rows.flat()];

test("the dashboard flips every UTC day and holds within one", () => {
  expect(today(SAMPLE, day("2026-11-13")).id).toBe("docs");
  expect(today(SAMPLE, day("2026-11-14")).id).toBe("poster");
  expect(today(SAMPLE, day("2026-11-15")).id).toBe("docs");
  expect(today(SAMPLE, new Date("2026-11-14T00:00:01Z")).id).toBe(today(SAMPLE, new Date("2026-11-14T23:59:59Z")).id);
});

test("years on GitHub count whole years only", () => {
  const joined = new Date("2013-04-09T12:59:27Z");
  expect(fullYears(joined, day("2026-04-08"))).toBe(12);
  expect(fullYears(joined, day("2026-04-09"))).toBe(13);
  expect(fullYears(joined, day("2026-11-13"))).toBe(13);
});

test("every card is a self-contained SVG that GitHub's image sandbox accepts", () => {
  const banned: [string, RegExp][] = [
    ["<script", /<script/i],
    ["<text (fonts cannot load)", /<text[\s>]/i],
    ["<foreignObject", /<foreignObject/i],
    ["<image", /<image[\s>]/i],
    ["external reference", /(?:href|src)\s*=\s*["']\s*(?:https?:)?\/\//i],
    ["@import", /@import/i],
    ["url(http", /url\(\s*["']?\s*(?:https?:)?\/\//i],
    ["event handler", /\son[a-z]+\s*=/i],
    ["NaN coordinate", /NaN/],
  ];
  for (const card of cards) {
    const xml = Bun.spawnSync(["xmllint", "--noout", "-"], { stdin: Buffer.from(card.svg), stderr: "pipe" });
    expect(`${card.file}: ${xml.stderr.toString()}`).toBe(`${card.file}: `);
    for (const [name, re] of banned) expect(`${card.file} has ${name}: ${re.test(card.svg)}`).toBe(`${card.file} has ${name}: false`);
    // The rule must cover every element, so a new animated class cannot ship without honouring the preference.
    if (/animation:/.test(card.svg)) expect(card.svg).toContain("@media (prefers-reduced-motion:reduce){*{animation:none!important}}");
  }
});

test("stats reach the accessible label, since the picture itself holds no text", () => {
  const main = docs(SAMPLE).rows[1][0];
  expect(main.svg).toContain('aria-label="Keep it simple.');
  expect(main.alt).toContain("7,880 contributions in the last year");
  expect(main.alt).toContain("17 stars, 29 followers");
});

test("the README links every card of the day's dashboard", () => {
  const board = posterBoard(SAMPLE);
  const md = readme(board);
  for (const card of board.rows.flat()) expect(md).toContain(`src="cards/${card.file}"`);
  expect(md).toContain('href="https://noel.engineer"');
  expect(md).toContain("Read my CV");
  expect(md).toContain("See repositories");
});

test("text wider than its box fails the build", () => {
  expect(() => fits("A long label", { size: 40, font: "display" }, 50)).toThrow("box allows 50px");
  expect(() => fits("OK", { size: 12, font: "mono" }, 50)).not.toThrow();
});

test("numbers far past today's shrink to fit instead of stopping the daily build", () => {
  const big: Stats = { contributions: 1_234_567, years: 40, repos: 99_999, pullRequests: 99_999, stars: 99_999, followers: 99_999 };
  expect(() => [docs(big), posterBoard(big)]).not.toThrow();
  expect(docs(big).rows[1][0].alt).toContain("1,234,567 contributions");
});

// Two pages of repositories: three stars on the first, four on the second.
function fakeGitHub(overrides: { cursorOnPageOne?: string | null } = {}) {
  const sent: { after: string | null; privacy: string | null }[] = [];
  const request: Request = async (_url, init) => {
    const { variables } = JSON.parse(String(init.body));
    sent.push({ after: variables.after, privacy: variables.privacy });
    const firstPage = variables.after === null;
    const data = {
      search: { issueCount: 11 },
      user: {
        createdAt: "2013-04-09T12:59:27Z",
        followers: { totalCount: 29 },
        pullRequests: { totalCount: 264 },
        contributionsCollection: { contributionCalendar: { totalContributions: 7800 } },
        repositories: {
          totalCount: 101,
          pageInfo: firstPage ? { hasNextPage: true, endCursor: overrides.cursorOnPageOne === undefined ? "c1" : overrides.cursorOnPageOne } : { hasNextPage: false, endCursor: null },
          nodes: firstPage ? [{ stargazerCount: 1 }, { stargazerCount: 2 }] : [{ stargazerCount: 4 }],
        },
      },
    };
    return new Response(JSON.stringify({ data }));
  };
  return { request, sent };
}

test("stars are summed across every page of repositories", async () => {
  const { request, sent } = fakeGitHub();
  const stats = await fetchStats("someone", "token", day("2026-11-13"), "all", request);
  expect(stats.stars).toBe(7);
  expect(sent.map((s) => s.after)).toEqual([null, "c1"]);
});

test("public counts leave out private pull requests and repositories, and contributions stay the calendar total", async () => {
  const pub = fakeGitHub();
  expect(await fetchStats("someone", "token", day("2026-11-13"), "public", pub.request)).toMatchObject({ contributions: 7800, pullRequests: 11, years: 13 });
  expect(pub.sent[0].privacy).toBe("PUBLIC");
  const all = fakeGitHub();
  expect(await fetchStats("someone", "token", day("2026-11-13"), "all", all.request)).toMatchObject({ contributions: 7800, pullRequests: 264 });
  expect(all.sent[0].privacy).toBeNull();
});

test("a next page without a cursor fails instead of refetching page one forever", async () => {
  const { request } = fakeGitHub({ cursorOnPageOne: null });
  expect(fetchStats("someone", "token", day("2026-11-13"), "all", request)).rejects.toThrow("without a cursor");
});

test("a failed or non-JSON reply fails with the status and the start of the body", async () => {
  const html: Request = async () => new Response("<html>gateway</html>");
  expect(fetchStats("someone", "token", day("2026-11-13"), "all", html)).rejects.toThrow("not JSON: <html>gateway");
  const denied: Request = async () => new Response("Bad credentials", { status: 401 });
  expect(fetchStats("someone", "token", day("2026-11-13"), "all", denied)).rejects.toThrow("answered 401: Bad credentials");
});
