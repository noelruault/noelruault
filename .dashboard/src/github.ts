import type { Stats } from "./dashboards";

// "public" counts only repositories and pull requests any visitor could count; "all" adds the private ones the token can see.
export type Visibility = "public" | "all";

const QUERY = `query($login: String!, $after: String, $privacy: RepositoryPrivacy, $publicPrs: String!) {
  search(query: $publicPrs, type: ISSUE) { issueCount }
  user(login: $login) {
    createdAt
    followers { totalCount }
    pullRequests { totalCount }
    contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { contributionCount } } } }
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: $privacy, first: 100, after: $after) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes { stargazerCount }
    }
  }
}`;

interface Page {
  search: { issueCount: number };
  user: {
    createdAt: string;
    followers: { totalCount: number };
    pullRequests: { totalCount: number };
    contributionsCollection: { contributionCalendar: { totalContributions: number; weeks: { contributionDays: { contributionCount: number }[] }[] } };
    repositories: {
      totalCount: number;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: { stargazerCount: number }[];
    };
  } | null;
}

export type Request = (url: string, init: RequestInit) => Promise<Response>;

// A profile has a few hundred repositories at most; past this the API is misbehaving.
const MAX_PAGES = 50;

export function fullYears(since: Date, now: Date) {
  const years = now.getUTCFullYear() - since.getUTCFullYear();
  const anniversary = Date.UTC(now.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate());
  return now.getTime() < anniversary ? years - 1 : years;
}

// `days` is one contribution count per day, oldest first, ending today.
export function activity(days: readonly number[]) {
  let longestStreak = 0;
  let run = 0;
  for (const count of days) {
    run = count > 0 ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }
  // Today is not over, so an empty today does not break a streak that reached yesterday.
  const settled = days.at(-1) === 0 ? days.slice(0, -1) : days;
  let currentStreak = 0;
  for (let i = settled.length - 1; i >= 0 && settled[i] > 0; i--) currentStreak++;
  const total = days.reduce((sum, count) => sum + count, 0);
  return {
    activeDays: days.filter((count) => count > 0).length,
    currentStreak,
    longestStreak,
    bestDay: Math.max(0, ...days),
    dailyAverage: days.length ? Math.round(total / days.length) : 0,
  };
}

async function page(request: Request, login: string, token: string, visibility: Visibility, after: string | null) {
  const res = await request("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "github-dashboard" },
    body: JSON.stringify({
      query: QUERY,
      variables: { login, after, privacy: visibility === "public" ? "PUBLIC" : null, publicPrs: `author:${login} is:pr is:public` },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`GitHub GraphQL answered ${res.status}: ${raw.slice(0, 300)}`);
  let body: { data?: Page; errors?: { message: string }[] };
  try {
    body = JSON.parse(raw);
  } catch {
    throw new Error(`GitHub GraphQL answered ${res.status} with a body that is not JSON: ${raw.slice(0, 300)}`);
  }
  if (body.errors?.length) throw new Error(`GitHub GraphQL errors: ${body.errors.map((e) => e.message).join("; ")}`);
  if (!body.data?.user) throw new Error(`GitHub user "${login}" not found`);
  return { search: body.data.search, user: body.data.user };
}

// Stars are summed over every owned non-fork repository, so the repository list is paged to the end.
export async function fetchStats(login: string, token: string, now: Date, visibility: Visibility, request: Request = fetch): Promise<Stats> {
  const first = await page(request, login, token, visibility, null);
  let stars = 0;
  let current = first;
  for (let pages = 1; ; pages++) {
    for (const repo of current.user.repositories.nodes) stars += repo.stargazerCount;
    const { hasNextPage, endCursor } = current.user.repositories.pageInfo;
    if (!hasNextPage) break;
    if (!endCursor) throw new Error("GitHub reported another page of repositories without a cursor to reach it");
    if (pages >= MAX_PAGES) throw new Error(`repository list did not end after ${MAX_PAGES} pages`);
    current = await page(request, login, token, visibility, endCursor);
  }
  const contributions = first.user.contributionsCollection;
  const all = visibility === "all";
  const stats: Stats = {
    // Always the calendar total: it is the figure github.com prints on the profile itself, and subtracting restrictedContributionsCount gave 799 with one token and 6,505 with another.
    contributions: contributions.contributionCalendar.totalContributions,
    years: fullYears(new Date(first.user.createdAt), now),
    repos: first.user.repositories.totalCount,
    pullRequests: all ? first.user.pullRequests.totalCount : first.search.issueCount,
    stars,
    followers: first.user.followers.totalCount,
    ...activity(contributions.contributionCalendar.weeks.flatMap((week) => week.contributionDays.map((day) => day.contributionCount))),
  };
  // The response is only cast, so a renamed field would otherwise reach a card as "NaN" or "undefined".
  for (const [name, value] of Object.entries(stats)) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`GitHub returned an unusable "${name}": ${value}`);
  }
  return stats;
}
