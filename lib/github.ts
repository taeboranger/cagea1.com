import "server-only";

export interface ContributionDay {
  date: string;
  count: number;
}

export interface MonthlyContributions {
  username: string;
  monthLabel: string;
  totalContributions: number;
  weeks: ContributionDay[][];
}

const QUERY = `
  query ($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

export async function getMonthlyContributions(): Promise<MonthlyContributions | null> {
  const username = process.env.GITHUB_USERNAME;
  const token = process.env.GITHUB_TOKEN;
  if (!username || !token) return null;

  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = now;

  let json: {
    data?: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: number;
            weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
          };
        };
      } | null;
    };
    errors?: unknown;
  };

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { login: username, from: from.toISOString(), to: to.toISOString() },
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    json = await res.json();
  } catch {
    return null;
  }

  const calendar = json.data?.user?.contributionsCollection.contributionCalendar;
  if (!calendar) return null;

  return {
    username,
    monthLabel: `${now.getUTCFullYear()}.${String(now.getUTCMonth() + 1).padStart(2, "0")}`,
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks.map((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
      }))
    ),
  };
}
