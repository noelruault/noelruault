import type { Stats } from "./dashboards";

// "public" publishes only what any visitor could count; "all" adds private repositories, pull requests and contributions the token can see.
export type Visibility = "public" | "all";

const QUERY = `query($login: String!, $after: String, $privacy: RepositoryPrivacy, $publicPrs: String!) {
  search(query: $publicPrs, type: ISSUE) { issueCount }
  user(login: $login) {
    createdAt
    followers { totalCount }
    pullRequests { totalCount }
    contributionsCollection { restrictedContributionsCount contributionCalendar { totalContributions } }
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
    contributionsCollection: { restrictedContributionsCount: number; contributionCalendar: { totalContributions: number } };
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
    contributions: contributions.contributionCalendar.totalContributions - (all ? 0 : contributions.restrictedContributionsCount),
    years: fullYears(new Date(first.user.createdAt), now),
    repos: first.user.repositories.totalCount,
    pullRequests: all ? first.user.pullRequests.totalCount : first.search.issueCount,
    stars,
    followers: first.user.followers.totalCount,
  };
  // The response is only cast, so a renamed field would otherwise reach a card as "NaN" or "undefined".
  for (const [name, value] of Object.entries(stats)) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`GitHub returned an unusable "${name}": ${value}`);
  }
  return stats;
}
